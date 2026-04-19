import { useEffect, useState, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import { Card, Segmented, Spin, Empty } from 'antd'
import { finnhubApi } from '../../services/finnhub'
import type { Candle } from '../../types'

interface ChartViewProps {
  symbol: string
}

const RESOLUTIONS = ['1', '5', '15', '60', 'D', 'W'] as const
type Resolution = (typeof RESOLUTIONS)[number]

const RESOLUTION_LABELS: Record<Resolution, string> = {
  '1': '1m',
  '5': '5m',
  '15': '15m',
  '60': '1h',
  D: '1D',
  W: '1W',
}

function buildCandlestickOption(candle: Candle, symbol: string) {
  if (!candle.t || candle.s !== 'ok') return null

  const dates = candle.t.map((ts) =>
    new Date(ts * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  )

  const ohlcData = candle.t.map((_, i) => [
    candle.o[i],
    candle.c[i],
    candle.l[i],
    candle.h[i],
  ])

  return {
    backgroundColor: '#0d1117',
    animation: false,
    title: {
      text: `${symbol} Candlestick`,
      textStyle: { color: '#c9d1d9', fontSize: 14 },
      left: 10,
      top: 5,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: '#161b22',
      borderColor: '#30363d',
      textStyle: { color: '#c9d1d9' },
    },
    legend: {
      data: ['Candle', 'Volume'],
      textStyle: { color: '#8b949e' },
      top: 30,
    },
    grid: [
      { left: 60, right: 20, top: 60, height: '60%' },
      { left: 60, right: 20, bottom: 40, height: '18%' },
    ],
    xAxis: [
      {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: '#30363d' } },
        axisLabel: { color: '#8b949e', fontSize: 11 },
        gridIndex: 0,
      },
      {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: '#30363d' } },
        axisLabel: { show: false },
        gridIndex: 1,
      },
    ],
    yAxis: [
      {
        scale: true,
        axisLine: { lineStyle: { color: '#30363d' } },
        splitLine: { lineStyle: { color: '#21262d' } },
        axisLabel: { color: '#8b949e', fontSize: 11, formatter: (v: number) => `$${v.toFixed(0)}` },
        gridIndex: 0,
      },
      {
        scale: true,
        axisLine: { lineStyle: { color: '#30363d' } },
        splitLine: { show: false },
        axisLabel: { color: '#8b949e', fontSize: 10 },
        gridIndex: 1,
      },
    ],
    dataZoom: [
      { type: 'inside', xAxisIndex: [0, 1], start: 60, end: 100 },
      {
        type: 'slider',
        xAxisIndex: [0, 1],
        bottom: 5,
        height: 20,
        borderColor: '#30363d',
        textStyle: { color: '#8b949e' },
        fillerColor: 'rgba(88, 166, 255, 0.1)',
      },
    ],
    series: [
      {
        name: 'Candle',
        type: 'candlestick',
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: ohlcData,
        itemStyle: {
          color: '#3fb950',
          color0: '#f85149',
          borderColor: '#3fb950',
          borderColor0: '#f85149',
        },
      },
      {
        name: 'Volume',
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: candle.v,
        itemStyle: {
          color: (params: { dataIndex: number }) => {
            const i = params.dataIndex
            return candle.c[i] >= candle.o[i] ? '#3fb950' : '#f85149'
          },
        },
      },
    ],
  }
}

export function ChartView({ symbol }: ChartViewProps) {
  const [candle, setCandle] = useState<Candle | null>(null)
  const [resolution, setResolution] = useState<Resolution>('D')
  const [loading, setLoading] = useState(false)

  const fetchCandles = useCallback(() => {
    setLoading(true)
    finnhubApi
      .getCandles(symbol, resolution)
      .then(setCandle)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [symbol, resolution])

  useEffect(() => {
    fetchCandles()
  }, [fetchCandles])

  const option = candle ? buildCandlestickOption(candle, symbol) : null

  return (
    <Card
      style={{ background: '#161b22', border: '1px solid #30363d', height: '100%' }}
      styles={{ body: { padding: 8, height: 'calc(100% - 40px)' } }}
      title={
        <div className="flex items-center gap-3">
          <span className="text-terminal-text text-sm">Chart</span>
          <Segmented
            size="small"
            options={RESOLUTIONS.map((r) => ({ label: RESOLUTION_LABELS[r], value: r }))}
            value={resolution}
            onChange={(v) => setResolution(v as Resolution)}
          />
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <Spin />
        </div>
      ) : !option ? (
        <Empty description="No data available" />
      ) : (
        <ReactECharts
          option={option}
          style={{ height: '380px', width: '100%' }}
          notMerge
          lazyUpdate
        />
      )}
    </Card>
  )
}
