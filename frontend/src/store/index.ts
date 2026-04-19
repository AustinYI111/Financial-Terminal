import { create } from 'zustand'
import type { RealtimeQuote, WatchlistItem, NewsArticle } from '../types'

interface MarketState {
  quotes: Record<string, RealtimeQuote>
  watchlist: WatchlistItem[]
  news: NewsArticle[]
  selectedSymbol: string
  isLoading: boolean
  error: string | null

  setSelectedSymbol: (symbol: string) => void
  updateQuote: (quote: Partial<RealtimeQuote> & { symbol: string }) => void
  setWatchlist: (items: WatchlistItem[]) => void
  setNews: (articles: NewsArticle[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useMarketStore = create<MarketState>((set) => ({
  quotes: {},
  watchlist: [],
  news: [],
  selectedSymbol: 'AAPL',
  isLoading: false,
  error: null,

  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),

  updateQuote: (incoming) =>
    set((state) => ({
      quotes: {
        ...state.quotes,
        [incoming.symbol]: {
          ...(state.quotes[incoming.symbol] ?? {}),
          ...incoming,
        } as RealtimeQuote,
      },
    })),

  setWatchlist: (watchlist) => set({ watchlist }),
  setNews: (news) => set({ news }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}))
