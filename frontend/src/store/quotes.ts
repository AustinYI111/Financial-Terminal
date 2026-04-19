import { create } from 'zustand'
import type { RealtimeQuote } from '../types'

interface QuoteEntry {
  data: RealtimeQuote
  fetchedAt: number // Unix ms timestamp
}

interface QuotesState {
  quotes: Record<string, QuoteEntry>
  updateQuote: (quote: RealtimeQuote) => void
  clearQuote: (symbol: string) => void
  clearAll: () => void
}

export const useQuotesStore = create<QuotesState>((set) => ({
  quotes: {},

  updateQuote: (quote) =>
    set((state) => ({
      quotes: {
        ...state.quotes,
        [quote.symbol]: { data: quote, fetchedAt: Date.now() },
      },
    })),

  clearQuote: (symbol) =>
    set((state) => {
      const next = { ...state.quotes }
      delete next[symbol]
      return { quotes: next }
    }),

  clearAll: () => set({ quotes: {} }),
}))
