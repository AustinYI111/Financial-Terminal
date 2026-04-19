import { Row, Col } from 'antd'
import { StockQuote } from '../components/StockQuote'
import { ChartView } from '../components/ChartView'
import { NewsPanel } from '../components/NewsPanel'
import { Watchlist } from '../components/Watchlist'
import { useMarketStore } from '../store'

const TOP_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA']

export default function Dashboard() {
  const selectedSymbol = useMarketStore((s) => s.selectedSymbol)

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Top quotes bar */}
      <Row gutter={[8, 8]}>
        {TOP_SYMBOLS.map((sym) => (
          <Col key={sym} xs={12} sm={8} md={6} lg={4}>
            <StockQuote symbol={sym} />
          </Col>
        ))}
      </Row>

      {/* Main content */}
      <Row gutter={[8, 8]} style={{ flex: 1 }}>
        {/* Watchlist - left sidebar */}
        <Col xs={24} lg={4} style={{ minWidth: 180 }}>
          <Watchlist />
        </Col>

        {/* Chart - center */}
        <Col xs={24} lg={13}>
          <ChartView symbol={selectedSymbol} />
        </Col>

        {/* News - right panel */}
        <Col xs={24} lg={7}>
          <NewsPanel symbol={selectedSymbol} />
        </Col>
      </Row>
    </div>
  )
}
