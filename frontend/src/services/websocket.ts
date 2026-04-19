import { useEffect, useRef } from 'react'
import { useMarketStore } from '../store'
import type { WSMessage, TradeEvent, RealtimeQuote } from '../types'

const WS_URL = (() => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.host
  return `${protocol}//${host}/ws`
})()

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const updateQuote = useMarketStore((s) => s.updateQuote)

  useEffect(() => {
    let isUnmounted = false

    function connect() {
      if (isUnmounted) return

      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[WS] connected')
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as WSMessage
          if (msg.type === 'trade') {
            const trade = msg.payload as TradeEvent
            // Convert trade tick to a partial quote update
            const partialQuote: Partial<RealtimeQuote> & { symbol: string } = {
              symbol: trade.s,
              c: trade.p,
            }
            updateQuote(partialQuote)
          } else if (msg.type === 'quote') {
            const quote = msg.payload as RealtimeQuote
            updateQuote(quote)
          }
        } catch {
          // ignore malformed messages
        }
      }

      ws.onclose = () => {
        console.log('[WS] disconnected, reconnecting in 3s…')
        if (!isUnmounted) {
          reconnectTimeout.current = setTimeout(connect, 3000)
        }
      }

      ws.onerror = (err) => {
        console.error('[WS] error', err)
        ws.close()
      }
    }

    connect()

    return () => {
      isUnmounted = true
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current)
      wsRef.current?.close()
    }
  }, [updateQuote])

  return wsRef
}
