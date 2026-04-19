// Package api wires up the REST handlers.
package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/AustinYI111/financial-terminal/backend/internal/cache"
	"github.com/AustinYI111/financial-terminal/backend/internal/finnhub"
	"github.com/AustinYI111/financial-terminal/backend/internal/models"
	"github.com/AustinYI111/financial-terminal/backend/internal/repository"
	ws "github.com/AustinYI111/financial-terminal/backend/internal/websocket"
	"github.com/gorilla/mux"
	"github.com/rs/zerolog/log"
)

// Handler bundles service dependencies for HTTP handlers.
type Handler struct {
	finnhub *finnhub.Client
	cache   *cache.Cache
	db      *repository.DB
	hub     *ws.Hub
}

// New creates a new Handler.
func New(fh *finnhub.Client, c *cache.Cache, db *repository.DB, hub *ws.Hub) *Handler {
	return &Handler{finnhub: fh, cache: c, db: db, hub: hub}
}

// Router builds and returns the application router.
func (h *Handler) Router() http.Handler {
	r := mux.NewRouter()
	r.HandleFunc("/health", h.health).Methods(http.MethodGet)

	api := r.PathPrefix("/api/v1").Subrouter()
	api.HandleFunc("/stocks", h.getStocks).Methods(http.MethodGet)
	api.HandleFunc("/quote/{symbol}", h.getQuote).Methods(http.MethodGet)
	api.HandleFunc("/candles/{symbol}", h.getCandles).Methods(http.MethodGet)
	api.HandleFunc("/news", h.getMarketNews).Methods(http.MethodGet)
	api.HandleFunc("/news/{symbol}", h.getCompanyNews).Methods(http.MethodGet)
	api.HandleFunc("/watchlist", h.getWatchlist).Methods(http.MethodGet)
	api.HandleFunc("/watchlist", h.addWatchlist).Methods(http.MethodPost)
	api.HandleFunc("/watchlist/{symbol}", h.removeWatchlist).Methods(http.MethodDelete)

	r.HandleFunc("/ws", h.hub.ServeWS)

	return r
}

// --- helpers ---

func writeJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		log.Error().Err(err).Msg("encode response")
	}
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

// --- handlers ---

func (h *Handler) health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) getStocks(w http.ResponseWriter, r *http.Request) {
	stocks, err := h.db.GetStocks(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch stocks")
		return
	}
	writeJSON(w, http.StatusOK, stocks)
}

func (h *Handler) getQuote(w http.ResponseWriter, r *http.Request) {
	symbol := mux.Vars(r)["symbol"]
	cacheKey := fmt.Sprintf("quote:%s", symbol)

	var quote models.RealtimeQuote
	if found, _ := h.cache.Get(r.Context(), cacheKey, &quote); found {
		writeJSON(w, http.StatusOK, quote)
		return
	}

	q, err := h.finnhub.Quote(r.Context(), symbol)
	if err != nil {
		log.Error().Err(err).Str("symbol", symbol).Msg("finnhub quote")
		writeError(w, http.StatusBadGateway, "failed to fetch quote")
		return
	}

	_ = h.cache.Set(r.Context(), cacheKey, q, 30*time.Minute)
	writeJSON(w, http.StatusOK, q)
}

func (h *Handler) getCandles(w http.ResponseWriter, r *http.Request) {
	symbol := mux.Vars(r)["symbol"]
	resolution := r.URL.Query().Get("resolution")
	if resolution == "" {
		resolution = "D"
	}
	now := time.Now().Unix()
	from := now - 30*24*60*60 // 30 days ago

	cacheKey := fmt.Sprintf("candles:%s:%s", symbol, resolution)
	var candle models.Candle
	if found, _ := h.cache.Get(r.Context(), cacheKey, &candle); found {
		writeJSON(w, http.StatusOK, candle)
		return
	}

	c, err := h.finnhub.Candles(r.Context(), symbol, resolution, from, now)
	if err != nil {
		log.Error().Err(err).Str("symbol", symbol).Msg("finnhub candles")
		writeError(w, http.StatusBadGateway, "failed to fetch candles")
		return
	}

	// Intraday resolutions (1, 5, 15, 30, 60 min) → 5 min TTL
	// Daily / weekly / monthly → 2 hour TTL
	candleTTL := 2 * time.Hour
	switch resolution {
	case "1", "5", "15", "30", "60":
		candleTTL = 5 * time.Minute
	}
	_ = h.cache.Set(r.Context(), cacheKey, c, candleTTL)
	writeJSON(w, http.StatusOK, c)
}

func (h *Handler) getMarketNews(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")
	if category == "" {
		category = "general"
	}

	cacheKey := fmt.Sprintf("news:market:%s", category)
	var news []models.NewsArticle
	if found, _ := h.cache.Get(r.Context(), cacheKey, &news); found {
		writeJSON(w, http.StatusOK, news)
		return
	}

	n, err := h.finnhub.MarketNews(r.Context(), category)
	if err != nil {
		log.Error().Err(err).Msg("finnhub market news")
		writeError(w, http.StatusBadGateway, "failed to fetch news")
		return
	}

	_ = h.cache.Set(r.Context(), cacheKey, n, 30*time.Minute)
	writeJSON(w, http.StatusOK, n)
}

func (h *Handler) getCompanyNews(w http.ResponseWriter, r *http.Request) {
	symbol := mux.Vars(r)["symbol"]
	to := time.Now().Format("2006-01-02")
	from := time.Now().AddDate(0, 0, -7).Format("2006-01-02")

	cacheKey := fmt.Sprintf("news:company:%s", symbol)
	var news []models.NewsArticle
	if found, _ := h.cache.Get(r.Context(), cacheKey, &news); found {
		writeJSON(w, http.StatusOK, news)
		return
	}

	n, err := h.finnhub.CompanyNews(r.Context(), symbol, from, to)
	if err != nil {
		log.Error().Err(err).Str("symbol", symbol).Msg("finnhub company news")
		writeError(w, http.StatusBadGateway, "failed to fetch company news")
		return
	}

	_ = h.cache.Set(r.Context(), cacheKey, n, 30*time.Minute)
	writeJSON(w, http.StatusOK, n)
}

func (h *Handler) getWatchlist(w http.ResponseWriter, r *http.Request) {
	items, err := h.db.GetWatchlist(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch watchlist")
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) addWatchlist(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Symbol     string   `json:"symbol"`
		Notes      string   `json:"notes"`
		AlertPrice *float64 `json:"alert_price,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if body.Symbol == "" {
		writeError(w, http.StatusBadRequest, "symbol is required")
		return
	}
	if err := h.db.AddToWatchlist(r.Context(), body.Symbol, body.Notes, body.AlertPrice); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to add to watchlist")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]string{"status": "added"})
}

func (h *Handler) removeWatchlist(w http.ResponseWriter, r *http.Request) {
	symbol := mux.Vars(r)["symbol"]
	if err := h.db.RemoveFromWatchlist(r.Context(), symbol); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to remove from watchlist")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "removed"})
}
