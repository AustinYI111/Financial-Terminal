import { create } from 'zustand'
import type { Candle } from '../types'

interface CandleEntry {
  data: Candle
  fetchedAt: number // Unix ms timestamp
}

interface CandlesState {
  // Keyed by `${symbol}:${resolution}`
  candles: Record<string, CandleEntry>
  updateCandles: (symbol: string, resolution: string, data: Candle) => void
  clearCandles: (symbol: string, resolution?: string) => void
  clearAll: () => void
}

function candleKey(symbol: string, resolution: string): string {
  return `${symbol}:${resolution}`
}

export const useCandlesStore = create<CandlesState>((set) => ({
  candles: {},

  updateCandles: (symbol, resolution, data) =>
    set((state) => ({
      candles: {
        ...state.candles,
        [candleKey(symbol, resolution)]: { data, fetchedAt: Date.now() },
      },
    })),

  clearCandles: (symbol, resolution) =>
    set((state) => {
      const next = { ...state.candles }
      if (resolution) {
        delete next[candleKey(symbol, resolution)]
      } else {
        // Clear all resolutions for the symbol
        for (const key of Object.keys(next)) {
          if (key.startsWith(`${symbol}:`)) {
            delete next[key]
          }
        }
      }
      return { candles: next }
    }),

  clearAll: () => set({ candles: {} }),
}))
