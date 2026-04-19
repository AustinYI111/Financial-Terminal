import { useEffect, useState } from 'react'
import { Card, List, Button, Input, Tag, Popconfirm, message, Empty } from 'antd'
import { PlusOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { useMarketStore } from '../../store'
import { finnhubApi } from '../../services/finnhub'

export function Watchlist() {
  const watchlist = useMarketStore((s) => s.watchlist)
  const quotes = useMarketStore((s) => s.quotes)
  const setWatchlist = useMarketStore((s) => s.setWatchlist)
  const setSelectedSymbol = useMarketStore((s) => s.setSelectedSymbol)
  const selectedSymbol = useMarketStore((s) => s.selectedSymbol)

  const [addSymbol, setAddSymbol] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    finnhubApi
      .getWatchlist()
      .then(setWatchlist)
      .catch(console.error)
  }, [setWatchlist])

  const handleAdd = async () => {
    const sym = addSymbol.trim().toUpperCase()
    if (!sym) return
    setAdding(true)
    try {
      await finnhubApi.addToWatchlist(sym)
      const items = await finnhubApi.getWatchlist()
      setWatchlist(items)
      setAddSymbol('')
      void message.success(`${sym} added to watchlist`)
    } catch {
      void message.error('Failed to add symbol')
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (symbol: string) => {
    try {
      await finnhubApi.removeFromWatchlist(symbol)
      setWatchlist(watchlist.filter((w) => w.symbol !== symbol))
      void message.success(`${symbol} removed`)
    } catch {
      void message.error('Failed to remove symbol')
    }
  }

  return (
    <Card
      title={<span className="text-terminal-text text-sm">Watchlist</span>}
      style={{ background: '#161b22', border: '1px solid #30363d', height: '100%' }}
      styles={{ body: { padding: 8 } }}
      extra={
        <div className="flex gap-1">
          <Input
            size="small"
            placeholder="SYMBOL"
            value={addSymbol}
            onChange={(e) => setAddSymbol(e.target.value.toUpperCase())}
            onPressEnter={() => void handleAdd()}
            style={{ width: 90, fontSize: '0.75rem' }}
          />
          <Button
            size="small"
            icon={<PlusOutlined />}
            loading={adding}
            onClick={() => void handleAdd()}
          />
        </div>
      }
    >
      {watchlist.length === 0 ? (
        <Empty description="Add symbols to watchlist" />
      ) : (
        <List
          dataSource={watchlist}
          renderItem={(item) => {
            const quote = quotes[item.symbol]
            const isPositive = (quote?.d ?? 0) >= 0
            const changeColor = isPositive ? '#3fb950' : '#f85149'

            return (
              <List.Item
                style={{
                  padding: '6px 4px',
                  borderBottomColor: '#30363d',
                  cursor: 'pointer',
                  background: selectedSymbol === item.symbol ? '#1f2937' : 'transparent',
                  borderRadius: 4,
                }}
                onClick={() => setSelectedSymbol(item.symbol)}
                actions={[
                  <Popconfirm
                    key="delete"
                    title="Remove from watchlist?"
                    onConfirm={() => void handleRemove(item.symbol)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      danger
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>,
                ]}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-terminal-accent font-mono font-bold text-sm">
                      {item.symbol}
                    </span>
                    {quote && (
                      <span
                        style={{ color: changeColor, fontSize: '0.85rem', fontWeight: 600 }}
                      >
                        ${quote.c.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-gray-500 text-xs truncate">{item.name}</span>
                    {quote && (
                      <Tag
                        color={isPositive ? 'success' : 'error'}
                        style={{ margin: 0, fontSize: '0.65rem' }}
                      >
                        {isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}{' '}
                        {isPositive ? '+' : ''}{quote.dp.toFixed(2)}%
                      </Tag>
                    )}
                  </div>
                </div>
              </List.Item>
            )
          }}
        />
      )}
    </Card>
  )
}
