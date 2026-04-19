// Package finnhub provides a client for the Finnhub REST and WebSocket APIs.
package finnhub

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/AustinYI111/financial-terminal/backend/internal/models"
	"github.com/rs/zerolog/log"
)

const baseURL = "https://finnhub.io/api/v1"

// Client is a Finnhub API client.
type Client struct {
	apiKey     string
	httpClient *http.Client
}

// New creates a new Finnhub client.
func New(apiKey string) *Client {
	return &Client{
		apiKey: apiKey,
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

func (c *Client) get(ctx context.Context, path string, params map[string]string, dest interface{}) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, baseURL+path, nil)
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}

	q := req.URL.Query()
	q.Set("token", c.apiKey)
	for k, v := range params {
		q.Set(k, v)
	}
	req.URL.RawQuery = q.Encode()

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("execute request: %w", err)
	}
	defer func() {
		if closeErr := resp.Body.Close(); closeErr != nil {
			log.Warn().Err(closeErr).Msg("failed to close response body")
		}
	}()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("finnhub API error %d: %s", resp.StatusCode, string(body))
	}

	if err := json.NewDecoder(resp.Body).Decode(dest); err != nil {
		return fmt.Errorf("decode response: %w", err)
	}
	return nil
}

// Quote fetches the latest real-time quote for a symbol.
func (c *Client) Quote(ctx context.Context, symbol string) (*models.RealtimeQuote, error) {
	var q models.RealtimeQuote
	if err := c.get(ctx, "/quote", map[string]string{"symbol": symbol}, &q); err != nil {
		return nil, err
	}
	q.Symbol = symbol
	return &q, nil
}

// Candles fetches OHLCV candlestick data for a symbol.
// resolution: 1, 5, 15, 30, 60, D, W, M
func (c *Client) Candles(ctx context.Context, symbol, resolution string, from, to int64) (*models.Candle, error) {
	var candle models.Candle
	err := c.get(ctx, "/stock/candle", map[string]string{
		"symbol":     symbol,
		"resolution": resolution,
		"from":       fmt.Sprintf("%d", from),
		"to":         fmt.Sprintf("%d", to),
	}, &candle)
	if err != nil {
		return nil, err
	}
	candle.Symbol = symbol
	return &candle, nil
}

// MarketNews fetches general market news.
func (c *Client) MarketNews(ctx context.Context, category string) ([]models.NewsArticle, error) {
	var news []models.NewsArticle
	if err := c.get(ctx, "/news", map[string]string{"category": category}, &news); err != nil {
		return nil, err
	}
	return news, nil
}

// CompanyNews fetches news for a specific company symbol.
func (c *Client) CompanyNews(ctx context.Context, symbol, from, to string) ([]models.NewsArticle, error) {
	var news []models.NewsArticle
	err := c.get(ctx, "/company-news", map[string]string{
		"symbol": symbol,
		"from":   from,
		"to":     to,
	}, &news)
	if err != nil {
		return nil, err
	}
	return news, nil
}
