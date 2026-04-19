package models

import "time"

// Stock represents a tracked financial instrument.
type Stock struct {
	Symbol    string    `json:"symbol"`
	Name      string    `json:"name"`
	Exchange  string    `json:"exchange"`
	Currency  string    `json:"currency"`
	CreatedAt time.Time `json:"created_at"`
}

// Quote represents a single OHLCV data point.
type Quote struct {
	Time   time.Time `json:"time"`
	Symbol string    `json:"symbol"`
	Open   float64   `json:"open"`
	High   float64   `json:"high"`
	Low    float64   `json:"low"`
	Close  float64   `json:"close"`
	Volume int64     `json:"volume"`
}

// Candle holds candlestick OHLCV series returned by Finnhub.
type Candle struct {
	Symbol    string    `json:"symbol"`
	Timestamp []int64   `json:"t"`
	Open      []float64 `json:"o"`
	High      []float64 `json:"h"`
	Low       []float64 `json:"l"`
	Close     []float64 `json:"c"`
	Volume    []int64   `json:"v"`
	Status    string    `json:"s"`
}

// RealtimeQuote holds the latest quote data from Finnhub.
type RealtimeQuote struct {
	Symbol        string  `json:"symbol"`
	CurrentPrice  float64 `json:"c"`
	Change        float64 `json:"d"`
	PercentChange float64 `json:"dp"`
	High          float64 `json:"h"`
	Low           float64 `json:"l"`
	Open          float64 `json:"o"`
	PreviousClose float64 `json:"pc"`
	Timestamp     int64   `json:"t"`
}

// NewsArticle represents a single news article from Finnhub.
type NewsArticle struct {
	ID       int64  `json:"id"`
	Category string `json:"category"`
	Datetime int64  `json:"datetime"`
	Headline string `json:"headline"`
	Image    string `json:"image"`
	Related  string `json:"related"`
	Source   string `json:"source"`
	Summary  string `json:"summary"`
	URL      string `json:"url"`
}

// WatchlistItem represents a symbol on the user's watchlist.
type WatchlistItem struct {
	ID         int64     `json:"id"`
	Symbol     string    `json:"symbol"`
	Name       string    `json:"name,omitempty"`
	AlertPrice *float64  `json:"alert_price,omitempty"`
	Notes      string    `json:"notes"`
	CreatedAt  time.Time `json:"created_at"`
}

// WSMessage is the envelope for WebSocket messages sent to clients.
type WSMessage struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

// TradeEvent is a real-time trade tick from Finnhub WebSocket.
type TradeEvent struct {
	Symbol    string  `json:"s"`
	Price     float64 `json:"p"`
	Volume    float64 `json:"v"`
	Timestamp int64   `json:"t"`
	Condition []int   `json:"c,omitempty"`
}
