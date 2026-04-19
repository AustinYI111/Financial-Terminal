-- Migration 002: Add quote_cache table for persistent quote caching
-- Note: The watchlist table is already created in 001_initial.sql

CREATE TABLE IF NOT EXISTS quote_cache (
  symbol VARCHAR(10) PRIMARY KEY,
  price DECIMAL(12, 2),
  change DECIMAL(8, 2),
  high DECIMAL(12, 2),
  low DECIMAL(12, 2),
  volume BIGINT,
  cached_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quote_cache_cached_at ON quote_cache (cached_at DESC);
