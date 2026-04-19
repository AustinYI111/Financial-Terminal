import { useEffect } from 'react'
import { Statistic, Card, Spin, Tag } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { useMarketStore } from '../../store'
import { finnhubApi } from '../../services/finnhub'

interface StockQuoteProps {
  symbol: string
}

export function StockQuote({ symbol }: StockQuoteProps) {
  const quote = useMarketStore((s) => s.quotes[symbol])
  const updateQuote = useMarketStore((s) => s.updateQuote)

  useEffect(() => {
    finnhubApi
      .getQuote(symbol)
      .then((q) => updateQuote(q))
      .catch(console.error)
  }, [symbol, updateQuote])

  if (!quote) {
    return (
      <Card className="bg-terminal-surface border-terminal-border" size="small">
        <Spin size="small" />
      </Card>
    )
  }

  const isPositive = quote.d >= 0
  const changeColor = isPositive ? '#3fb950' : '#f85149'

  return (
    <Card
      className="bg-terminal-surface border-terminal-border"
      style={{ background: '#161b22', border: '1px solid #30363d' }}
      size="small"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-terminal-accent font-bold text-base">{symbol}</span>
        <Tag color={isPositive ? 'success' : 'error'} style={{ margin: 0 }}>
          {isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}{' '}
          {isPositive ? '+' : ''}{quote.dp.toFixed(2)}%
        </Tag>
      </div>
      <Statistic
        value={quote.c}
        precision={2}
        prefix="$"
        valueStyle={{ color: changeColor, fontSize: '1.5rem', fontWeight: 700 }}
      />
      <div className="flex gap-4 mt-2 text-xs text-gray-400">
        <span>
          {isPositive ? '+' : ''}
          {quote.d.toFixed(2)}
        </span>
        <span>H: {quote.h.toFixed(2)}</span>
        <span>L: {quote.l.toFixed(2)}</span>
        <span>PC: {quote.pc.toFixed(2)}</span>
      </div>
    </Card>
  )
}
