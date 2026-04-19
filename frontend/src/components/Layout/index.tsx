import type { ReactNode } from 'react'
import { Layout, Menu } from 'antd'
import { LineChartOutlined, DashboardOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

const { Sider, Content, Header } = Layout

interface AppLayoutProps {
  children: ReactNode
}

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
  },
  {
    key: '/charts',
    icon: <LineChartOutlined />,
    label: 'Charts',
  },
]

export default function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Layout style={{ minHeight: '100vh', background: '#0d1117' }}>
      <Sider
        width={200}
        style={{
          background: '#161b22',
          borderRight: '1px solid #30363d',
        }}
      >
        <div
          style={{
            height: 48,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 16,
            borderBottom: '1px solid #30363d',
          }}
        >
          <span
            style={{
              color: '#58a6ff',
              fontWeight: 700,
              fontSize: '0.9rem',
              letterSpacing: '0.05em',
            }}
          >
            FinTerminal
          </span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: '#161b22', borderRight: 'none' }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#161b22',
            borderBottom: '1px solid #30363d',
            padding: '0 16px',
            height: 48,
            lineHeight: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ color: '#8b949e', fontSize: '0.75rem' }}>
            Real-time Market Data powered by Finnhub
          </span>
          <span style={{ color: '#3fb950', fontSize: '0.7rem' }}>● LIVE</span>
        </Header>
        <Content
          style={{
            background: '#0d1117',
            padding: 12,
            overflow: 'auto',
            height: 'calc(100vh - 48px)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
