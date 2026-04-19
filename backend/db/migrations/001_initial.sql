-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Stocks table: master list of tracked symbols
CREATE TABLE IF NOT EXISTS stocks (
    symbol      TEXT        NOT NULL,
    name        TEXT        NOT NULL,
    exchange    TEXT        NOT NULL DEFAULT '',
    currency    TEXT        NOT NULL DEFAULT 'USD',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (symbol)
);

-- Quotes hypertable: real-time OHLCV data
CREATE TABLE IF NOT EXISTS quotes (
    time        TIMESTAMPTZ NOT NULL,
    symbol      TEXT        NOT NULL REFERENCES stocks(symbol) ON DELETE CASCADE,
    open        DOUBLE PRECISION,
    high        DOUBLE PRECISION,
    low         DOUBLE PRECISION,
    close       DOUBLE PRECISION NOT NULL,
    volume      BIGINT,
    vwap        DOUBLE PRECISION,
    CONSTRAINT quotes_pkey PRIMARY KEY (time, symbol)
);

SELECT create_hypertable('quotes', 'time', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_quotes_symbol_time ON quotes (symbol, time DESC);

-- News table: aggregated news articles
CREATE TABLE IF NOT EXISTS news (
    id          BIGSERIAL   PRIMARY KEY,
    category    TEXT        NOT NULL DEFAULT 'general',
    datetime    TIMESTAMPTZ NOT NULL,
    headline    TEXT        NOT NULL,
    source      TEXT        NOT NULL,
    summary     TEXT        NOT NULL DEFAULT '',
    url         TEXT        NOT NULL,
    image       TEXT        NOT NULL DEFAULT '',
    related     TEXT        NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_datetime ON news (datetime DESC);
CREATE INDEX IF NOT EXISTS idx_news_related ON news (related);

-- Watchlist table: user-tracked symbols
CREATE TABLE IF NOT EXISTS watchlist (
    id          BIGSERIAL   PRIMARY KEY,
    symbol      TEXT        NOT NULL REFERENCES stocks(symbol) ON DELETE CASCADE,
    alert_price DOUBLE PRECISION,
    notes       TEXT        NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (symbol)
);

-- Seed some default symbols
INSERT INTO stocks (symbol, name, exchange) VALUES
    ('AAPL',  'Apple Inc.',             'NASDAQ'),
    ('MSFT',  'Microsoft Corporation',  'NASDAQ'),
    ('GOOGL', 'Alphabet Inc.',          'NASDAQ'),
    ('AMZN',  'Amazon.com Inc.',        'NASDAQ'),
    ('TSLA',  'Tesla Inc.',             'NASDAQ'),
    ('META',  'Meta Platforms Inc.',    'NASDAQ'),
    ('NVDA',  'NVIDIA Corporation',     'NASDAQ'),
    ('SPY',   'SPDR S&P 500 ETF',       'NYSE')
ON CONFLICT (symbol) DO NOTHING;
