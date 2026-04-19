import { useEffect } from 'react'
import { Card, List, Typography, Tag, Spin, Empty } from 'antd'
import { useMarketStore } from '../../store'
import { finnhubApi } from '../../services/finnhub'

const { Text, Link } = Typography

interface NewsPanelProps {
  symbol?: string
}

export function NewsPanel({ symbol }: NewsPanelProps) {
  const news = useMarketStore((s) => s.news)
  const setNews = useMarketStore((s) => s.setNews)
  const isLoading = useMarketStore((s) => s.isLoading)
  const setLoading = useMarketStore((s) => s.setLoading)

  useEffect(() => {
    setLoading(true)
    const promise = symbol
      ? finnhubApi.getCompanyNews(symbol)
      : finnhubApi.getMarketNews()

    promise
      .then(setNews)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [symbol, setNews, setLoading])

  return (
    <Card
      title={
        <span className="text-terminal-text text-sm">
          {symbol ? `${symbol} News` : 'Market News'}
        </span>
      }
      style={{ background: '#161b22', border: '1px solid #30363d', height: '100%' }}
      styles={{ body: { padding: '8px', overflow: 'auto', maxHeight: '380px' } }}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spin />
        </div>
      ) : news.length === 0 ? (
        <Empty description="No news available" />
      ) : (
        <List
          dataSource={news.slice(0, 20)}
          renderItem={(article) => (
            <List.Item style={{ padding: '8px 0', borderBottomColor: '#30363d' }}>
              <div className="w-full">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <Link
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#c9d1d9', fontSize: '0.8rem', lineHeight: 1.4 }}
                  >
                    {article.headline}
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <Tag color="default" style={{ fontSize: '0.7rem', margin: 0 }}>
                    {article.source}
                  </Tag>
                  <Text style={{ color: '#8b949e', fontSize: '0.7rem' }}>
                    {new Date(article.datetime * 1000).toLocaleDateString()}
                  </Text>
                </div>
              </div>
            </List.Item>
          )}
        />
      )}
    </Card>
  )
}
