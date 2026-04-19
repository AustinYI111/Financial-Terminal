// Package repository provides TimescaleDB persistence for quotes and news.
package repository

import (
	"context"
	"fmt"

	"github.com/AustinYI111/financial-terminal/backend/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

// DB wraps a pgxpool and provides domain-level operations.
type DB struct {
	pool *pgxpool.Pool
}

// New connects to TimescaleDB and returns a DB.
func New(ctx context.Context, dsn string) (*DB, error) {
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, fmt.Errorf("pgxpool: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("db ping: %w", err)
	}
	return &DB{pool: pool}, nil
}

// Close closes the connection pool.
func (d *DB) Close() {
	d.pool.Close()
}

// InsertQuote persists a single OHLCV quote.
func (d *DB) InsertQuote(ctx context.Context, q *models.Quote) error {
	_, err := d.pool.Exec(ctx,
		`INSERT INTO quotes (time, symbol, open, high, low, close, volume)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 ON CONFLICT (time, symbol) DO UPDATE
		 SET open = EXCLUDED.open, high = EXCLUDED.high,
		     low  = EXCLUDED.low,  close = EXCLUDED.close,
		     volume = EXCLUDED.volume`,
		q.Time, q.Symbol, q.Open, q.High, q.Low, q.Close, q.Volume,
	)
	return err
}

// GetRecentQuotes returns the most recent N quotes for a symbol.
func (d *DB) GetRecentQuotes(ctx context.Context, symbol string, limit int) ([]models.Quote, error) {
	rows, err := d.pool.Query(ctx,
		`SELECT time, symbol, open, high, low, close, volume
		 FROM quotes
		 WHERE symbol = $1
		 ORDER BY time DESC
		 LIMIT $2`,
		symbol, limit,
	)
	if err != nil {
		return nil, fmt.Errorf("query quotes: %w", err)
	}
	defer rows.Close()

	var quotes []models.Quote
	for rows.Next() {
		var q models.Quote
		if err := rows.Scan(&q.Time, &q.Symbol, &q.Open, &q.High, &q.Low, &q.Close, &q.Volume); err != nil {
			return nil, fmt.Errorf("scan quote: %w", err)
		}
		quotes = append(quotes, q)
	}
	return quotes, rows.Err()
}

// GetWatchlist returns all items on the user's watchlist.
func (d *DB) GetWatchlist(ctx context.Context) ([]models.WatchlistItem, error) {
	rows, err := d.pool.Query(ctx,
		`SELECT w.id, w.symbol, s.name, w.alert_price, w.notes, w.created_at
		 FROM watchlist w
		 JOIN stocks s ON s.symbol = w.symbol
		 ORDER BY w.created_at DESC`,
	)
	if err != nil {
		return nil, fmt.Errorf("query watchlist: %w", err)
	}
	defer rows.Close()

	var items []models.WatchlistItem
	for rows.Next() {
		var item models.WatchlistItem
		if err := rows.Scan(&item.ID, &item.Symbol, &item.Name, &item.AlertPrice, &item.Notes, &item.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan watchlist: %w", err)
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

// AddToWatchlist inserts a symbol into the watchlist.
func (d *DB) AddToWatchlist(ctx context.Context, symbol, notes string, alertPrice *float64) error {
	_, err := d.pool.Exec(ctx,
		`INSERT INTO watchlist (symbol, alert_price, notes)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (symbol) DO NOTHING`,
		symbol, alertPrice, notes,
	)
	return err
}

// RemoveFromWatchlist deletes a symbol from the watchlist.
func (d *DB) RemoveFromWatchlist(ctx context.Context, symbol string) error {
	_, err := d.pool.Exec(ctx,
		`DELETE FROM watchlist WHERE symbol = $1`, symbol,
	)
	return err
}

// GetStocks returns all stocks.
func (d *DB) GetStocks(ctx context.Context) ([]models.Stock, error) {
	rows, err := d.pool.Query(ctx,
		`SELECT symbol, name, exchange, currency, created_at FROM stocks ORDER BY symbol`,
	)
	if err != nil {
		return nil, fmt.Errorf("query stocks: %w", err)
	}
	defer rows.Close()

	var stocks []models.Stock
	for rows.Next() {
		var s models.Stock
		if err := rows.Scan(&s.Symbol, &s.Name, &s.Exchange, &s.Currency, &s.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan stock: %w", err)
		}
		stocks = append(stocks, s)
	}
	return stocks, rows.Err()
}
