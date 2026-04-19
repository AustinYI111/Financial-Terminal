import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchCandles } from '../services/api'
import { useCandlesStore } from '../store/candles'
import type { Candle } from '../types'

// Cache TTLs matching backend configuration
const INTRADAY_RESOLUTIONS = new Set(['1', '5', '15', '30', '60'])
const INTRADAY_TTL_MS = 5 * 60 * 1000        // 5 minutes
const DAILY_TTL_MS = 2 * 60 * 60 * 1000       // 2 hours

function getTtl(resolution: string, override?: number): number {
  if (override !== undefined) return override
  return INTRADAY_RESOLUTIONS.has(resolution) ? INTRADAY_TTL_MS : DAILY_TTL_MS
}

interface UseCandlesOptions {
  /** Override cache TTL in milliseconds. */
  ttl?: number
}

interface UseCandlesResult {
  data: Candle | null
  loading: boolean
  error: Error | null
  lastUpdated: number | null
  refetch: () => void
}

/**
 * useCandles fetches and caches OHLCV candlestick data for a symbol and resolution.
 *
 * Automatically re-fetches when symbol or resolution changes.
 * Uses stale-while-revalidate: returns cached data while a background fetch completes.
 */
export function useCandles(
  symbol: string,
  resolution = 'D',
  options: UseCandlesOptions = {},
): UseCandlesResult {
  const ttl = getTtl(resolution, options.ttl)

  const updateCandles = useCandlesStore((s) => s.updateCandles)
  const entry = useCandlesStore((s) => s.candles[`${symbol}:${resolution}`])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const doFetch = useCallback(() => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setLoading(true)
    setError(null)

    fetchCandles(symbol, resolution)
      .then((candle) => {
        if (!ctrl.signal.aborted) {
          updateCandles(symbol, resolution, candle)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!ctrl.signal.aborted) {
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      })
      .finally(() => {
        if (!ctrl.signal.aborted) {
          setLoading(false)
        }
      })
  }, [symbol, resolution, updateCandles])

  useEffect(() => {
    const isStale = !entry || Date.now() - entry.fetchedAt > ttl

    if (isStale) {
      doFetch()
    }

    return () => {
      abortRef.current?.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, resolution, ttl])

  return {
    data: entry?.data ?? null,
    loading,
    error,
    lastUpdated: entry?.fetchedAt ?? null,
    refetch: doFetch,
  }
}
