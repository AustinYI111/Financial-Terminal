import axios from 'axios'
import type { RealtimeQuote, WatchlistItem, NewsArticle, Candle } from '../types'

const BASE_URL = '/api/v1'

// Axios instance with base URL and default headers
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor: unwrap data and normalize errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      (error.response?.data as { error?: string } | undefined)?.error ??
      error.message ??
      'Unknown error'
    return Promise.reject(new Error(message))
  },
)

// ─── Quote ───────────────────────────────────────────────────────────────────

export const fetchQuote = (symbol: string): Promise<RealtimeQuote> =>
  apiClient.get<RealtimeQuote>(`/quote/${encodeURIComponent(symbol)}`).then((r) => r.data)

// ─── Candles ─────────────────────────────────────────────────────────────────

export const fetchCandles = (symbol: string, resolution = 'D'): Promise<Candle> =>
  apiClient
    .get<Candle>(`/candles/${encodeURIComponent(symbol)}`, { params: { resolution } })
    .then((r) => r.data)

// ─── News ─────────────────────────────────────────────────────────────────────

export const fetchMarketNews = (category = 'general'): Promise<NewsArticle[]> =>
  apiClient.get<NewsArticle[]>('/news', { params: { category } }).then((r) => r.data)

export const fetchCompanyNews = (symbol: string): Promise<NewsArticle[]> =>
  apiClient.get<NewsArticle[]>(`/news/${encodeURIComponent(symbol)}`).then((r) => r.data)

// ─── Watchlist ───────────────────────────────────────────────────────────────

export const fetchWatchlist = (): Promise<WatchlistItem[]> =>
  apiClient.get<WatchlistItem[]>('/watchlist').then((r) => r.data)

export const addWatchlistSymbol = (
  symbol: string,
  notes = '',
  alertPrice?: number,
): Promise<{ status: string }> =>
  apiClient
    .post<{ status: string }>('/watchlist', { symbol, notes, alert_price: alertPrice })
    .then((r) => r.data)

export const removeWatchlistSymbol = (symbol: string): Promise<{ status: string }> =>
  apiClient
    .delete<{ status: string }>(`/watchlist/${encodeURIComponent(symbol)}`)
    .then((r) => r.data)
