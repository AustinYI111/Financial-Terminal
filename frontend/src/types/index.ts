export interface Stock {
  symbol: string
  name: string
  exchange: string
  currency: string
  created_at: string
}

export interface RealtimeQuote {
  symbol: string
  c: number   // current price
  d: number   // change
  dp: number  // percent change
  h: number   // high
  l: number   // low
  o: number   // open
  pc: number  // previous close
  t: number   // timestamp
}

export interface Candle {
  symbol: string
  t: number[]   // timestamps
  o: number[]   // open
  h: number[]   // high
  l: number[]   // low
  c: number[]   // close
  v: number[]   // volume
  s: string     // status: "ok" | "no_data"
}

export interface NewsArticle {
  id: number
  category: string
  datetime: number
  headline: string
  image: string
  related: string
  source: string
  summary: string
  url: string
}

export interface WatchlistItem {
  id: number
  symbol: string
  name: string
  alert_price?: number
  notes: string
  created_at: string
}

export interface WSMessage {
  type: 'trade' | 'quote' | 'error'
  payload: unknown
}

export interface TradeEvent {
  s: string   // symbol
  p: number   // price
  v: number   // volume
  t: number   // timestamp
}
