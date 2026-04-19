import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchQuote } from '../services/api'
import { useQuotesStore } from '../store/quotes'
import type { RealtimeQuote } from '../types'

// Quote cache TTL: 30 minutes (matches backend Redis TTL)
const QUOTE_TTL_MS = 30 * 60 * 1000

interface UseQuoteOptions {
  /** Override cache TTL in milliseconds. */
  ttl?: number
  /** Poll interval in milliseconds. 0 = no polling (default). */
  pollInterval?: number
}

interface UseQuoteResult {
  data: RealtimeQuote | null
  loading: boolean
  error: Error | null
  lastUpdated: number | null
  refetch: () => void
}

/**
 * useQuote fetches and caches a realtime quote for the given symbol.
 *
 * Implements stale-while-revalidate: returns the cached (possibly stale) data
 * immediately, while a fresh fetch is in progress in the background.
 */
export function useQuote(symbol: string, options: UseQuoteOptions = {}): UseQuoteResult {
  const { ttl = QUOTE_TTL_MS, pollInterval = 0 } = options

  const updateQuote = useQuotesStore((s) => s.updateQuote)
  const entry = useQuotesStore((s) => s.quotes[symbol])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const doFetch = useCallback(() => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setLoading(true)
    setError(null)

    fetchQuote(symbol)
      .then((q) => {
        if (!ctrl.signal.aborted) {
          updateQuote(q)
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
  }, [symbol, updateQuote])

  useEffect(() => {
    const isStale = !entry || Date.now() - entry.fetchedAt > ttl

    if (isStale) {
      doFetch()
    }

    if (pollInterval > 0) {
      pollRef.current = setInterval(doFetch, pollInterval)
    }

    return () => {
      abortRef.current?.abort()
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, ttl, pollInterval])

  return {
    data: entry?.data ?? null,
    loading,
    error,
    lastUpdated: entry?.fetchedAt ?? null,
    refetch: doFetch,
  }
}
