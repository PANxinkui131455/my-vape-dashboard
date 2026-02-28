import { useState, useEffect } from 'react'
import { fetchSheetData, computeTierStats, SHEET_CONFIG } from './utils/sheetData.js'
import Dashboard from './components/Dashboard.jsx'

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  body { background: #F3F4F6; color: #111827; font-family: 'Inter', sans-serif; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: #ECEFF3; }
  ::-webkit-scrollbar-thumb { background: #C4CBD4; border-radius: 2px; }
`

export default function App() {
  const [state, setState] = useState({ status: 'idle', data: [], tierStats: [], meta: null, error: null })
  const isConfigured = SHEET_CONFIG.SHEET_ID !== 'YOUR_GOOGLE_SHEET_ID_HERE'

  async function loadData(forceRefresh = false) {
    setState(s => ({ ...s, status: 'loading', error: null }))
    try {
      const result = await fetchSheetData(forceRefresh)
      const tierStats = computeTierStats(result.data)
      setState({
        status: 'ready',
        data: result.data,
        tierStats,
        meta: { fromCache: result.fromCache, cachedAt: result.cachedAt, total: result.data.length },
        error: null,
      })
    } catch (err) {
      setState(s => ({ ...s, status: 'error', error: err.message }))
    }
  }

  useEffect(() => {
    if (isConfigured) loadData()
  }, [])

  return (
    <>
      <style>{STYLES}</style>
      {!isConfigured ? (
        <SetupGuide />
      ) : state.status === 'loading' && state.data.length === 0 ? (
        <LoadingScreen />
      ) : state.status === 'error' && state.data.length === 0 ? (
        <ErrorScreen message={state.error} onRetry={() => loadData(true)} />
      ) : (
        <Dashboard
          data={state.data}
          tierStats={state.tierStats}
          meta={state.meta}
          loading={state.status === 'loading'}
          onRefresh={() => loadData(true)}
        />
      )}
    </>
  )
}

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 20 }}>
      <div style={{ width: 48, height: 48, border: '3px solid #D1D5DB', borderTop: '3px solid #111827', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <p style={{ color: '#6B7280', fontFamily: 'JetBrains Mono', fontSize: 13 }}>正在从 Google Sheets 加载数据...</p>
    </div>
  )
}

function ErrorScreen({ message, onRetry }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16, padding: 40 }}>
      <div style={{ fontSize: 48 }}>⚠️</div>
      <h2 style={{ color: '#111827' }}>数据加载失败</h2>
      <p style={{ color: '#6B7280', fontFamily: 'JetBrains Mono', fontSize: 13, textAlign: 'center', maxWidth: 500 }}>{message}</p>
      <p style={{ color: '#6B7280', fontSize: 12, textAlign: 'center', maxWidth: 500 }}>
        请确认 Google Sheets 已设置为"发布到网络"，且 SHEET_ID 填写正确。
      </p>
      <button onClick={onRetry} style={{ padding: '10px 24px', background: '#111827', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontFamily: 'Inter', fontSize: 14 }}>
        重试
      </button>
    </div>
  )
}

function SetupGuide() {
  return (
    <div style={{ maxWidth: 760, margin: '80px auto', padding: '0 24px', fontFamily: 'JetBrains Mono' }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: 40, boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)' }}>
        <div style={{ fontSize: 11, color: '#111827', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>初始化配置</div>
        <h1 style={{ fontSize: 28, fontFamily: 'Inter', fontWeight: 800, marginBottom: 8 }}>连接 Google Sheets</h1>
        <p style={{ color: '#6B7280', fontSize: 13, lineHeight: 1.8, marginBottom: 32 }}>
          请按以下步骤将你的竞品调研 Google Sheets 连接到本 Dashboard：
        </p>
        {[
          ['第一步', '打开你的 Google Sheets 价格调研表'],
          ['第二步', '点击菜单 → 文件 → 共享 → 发布到网络'],
          ['第三步', '选择「整个文档」+ 格式选「逗号分隔值 (.csv)」，点击「发布」'],
          ['第四步', '复制发布链接，提取 URL 中 /d/ 和 /pub 之间的部分，即为 SHEET_ID'],
          ['第五步', '打开项目文件 src/utils/sheetData.js，将 SHEET_ID 替换填入'],
          ['第六步', '重新运行 npm run build 并推送到 GitHub，自动部署生效'],
        ].map(([step, desc], i) => (
          <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 20, padding: '14px 18px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 11, color: '#111827', minWidth: 56, paddingTop: 2 }}>{step}</div>
            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{desc}</div>
          </div>
        ))}
        <div style={{ marginTop: 24, padding: '16px 20px', background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: '#111827', marginBottom: 8 }}>📋 Google Sheets 表格列顺序（需与程序匹配）</div>
          <div style={{ fontSize: 12, color: '#4B5563', lineHeight: 2 }}>
            A: 产品链接 &nbsp;|&nbsp; B: 图片 &nbsp;|&nbsp; C: 产品名称 &nbsp;|&nbsp; D: 单品价格 &nbsp;|&nbsp; E: 梯度价格 &nbsp;|&nbsp; F: Puff 数 &nbsp;|&nbsp; G: 是否包邮 &nbsp;|&nbsp; H: 图片链接
          </div>
        </div>
      </div>
    </div>
  )
}
