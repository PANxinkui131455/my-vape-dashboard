import { useState, useEffect } from 'react'
import { fetchSheetData, computeTierStats, SHEET_CONFIG } from './utils/sheetData.js'
import Dashboard from './components/Dashboard.jsx'

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  body { background: #0A0A0F; color: #E8E8F0; font-family: 'Syne', sans-serif; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: #13131F; }
  ::-webkit-scrollbar-thumb { background: #2A2A3A; border-radius: 2px; }
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
      <div style={{ width: 48, height: 48, border: '3px solid #1E1E2E', borderTop: '3px solid #FF6B35', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <p style={{ color: '#666', fontFamily: 'Space Mono', fontSize: 13 }}>正在从 Google Sheets 加载数据...</p>
    </div>
  )
}

function ErrorScreen({ message, onRetry }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16, padding: 40 }}>
      <div style={{ fontSize: 48 }}>⚠️</div>
      <h2 style={{ color: '#EF4444' }}>数据加载失败</h2>
      <p style={{ color: '#666', fontFamily: 'Space Mono', fontSize: 13, textAlign: 'center', maxWidth: 500 }}>{message}</p>
      <p style={{ color: '#555', fontSize: 12, textAlign: 'center', maxWidth: 500 }}>
        请确认 Google Sheets 已设置为"发布到网络"，且 SHEET_ID 填写正确。
      </p>
      <button onClick={onRetry} style={{ padding: '10px 24px', background: '#FF6B35', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontFamily: 'Syne', fontSize: 14 }}>
        重试
      </button>
    </div>
  )
}

function SetupGuide() {
  return (
    <div style={{ maxWidth: 720, margin: '80px auto', padding: '0 24px', fontFamily: 'Space Mono' }}>
      <div style={{ background: '#13131F', border: '1px solid #FF6B3544', borderRadius: 12, padding: 40 }}>
        <div style={{ fontSize: 11, color: '#FF6B35', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>初始化配置</div>
        <h1 style={{ fontSize: 28, fontFamily: 'Syne', fontWeight: 800, marginBottom: 8 }}>连接 Google Sheets</h1>
        <p style={{ color: '#888', fontSize: 13, lineHeight: 1.8, marginBottom: 32 }}>
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
          <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 20, padding: '14px 18px', background: '#0A0A0F', borderRadius: 8, border: '1px solid #1E1E2E' }}>
            <div style={{ fontSize: 11, color: '#FF6B35', minWidth: 56, paddingTop: 2 }}>{step}</div>
            <div style={{ fontSize: 13, color: '#CCC', lineHeight: 1.6 }}>{desc}</div>
          </div>
        ))}
        <div style={{ marginTop: 24, padding: '16px 20px', background: '#1A1A10', border: '1px solid #F59E0B44', borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: '#F59E0B', marginBottom: 8 }}>📋 Google Sheets 表格列顺序（需与程序匹配）</div>
          <div style={{ fontSize: 12, color: '#888', lineHeight: 2 }}>
            A: 产品链接 &nbsp;|&nbsp; B: 图片 &nbsp;|&nbsp; C: 产品名称 &nbsp;|&nbsp; D: 单品价格 &nbsp;|&nbsp; E: 梯度价格 &nbsp;|&nbsp; F: Puff 数 &nbsp;|&nbsp; G: 是否包邮 &nbsp;|&nbsp; H: 图片链接
          </div>
        </div>
      </div>
    </div>
  )
}
