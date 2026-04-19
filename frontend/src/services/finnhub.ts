import type { RealtimeQuote, WatchlistItem, NewsArticle, Candle } from '../types'

const BASE_URL = '/api/v1'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, options)
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error ?? 'Request failed')
  }
  return response.json() as Promise<T>
}

export const finnhubApi = {
  getQuote: (symbol: string) =>
    request<RealtimeQuote>(`/quote/${encodeURIComponent(symbol)}`),

  getCandles: (symbol: string, resolution = 'D') =>
    request<Candle>(`/candles/${encodeURIComponent(symbol)}?resolution=${resolution}`),

  getMarketNews: (category = 'general') =>
    request<NewsArticle[]>(`/news?category=${category}`),

  getCompanyNews: (symbol: string) =>
    request<NewsArticle[]>(`/news/${encodeURIComponent(symbol)}`),

  getWatchlist: () =>
    request<WatchlistItem[]>('/watchlist'),

  addToWatchlist: (symbol: string, notes = '', alertPrice?: number) =>
    request<{ status: string }>('/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, notes, alert_price: alertPrice }),
    }),

  removeFromWatchlist: (symbol: string) =>
    request<{ status: string }>(`/watchlist/${encodeURIComponent(symbol)}`, {
      method: 'DELETE',
    }),
}
