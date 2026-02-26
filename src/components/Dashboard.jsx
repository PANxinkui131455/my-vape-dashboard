import { useState, useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { SOURCE_COLORS, TIER_DEFINITIONS, getTier } from '../utils/sheetData.js'

/* ─── Shared styles ──────────────────────────────────────────── */
const css = `
  .tab-btn { background: transparent; border: 1px solid #2A2A3A; color: #888; padding: 8px 20px; cursor: pointer; font-family: 'Syne', sans-serif; font-size: 13px; letter-spacing: 0.05em; transition: all 0.2s; border-bottom: none; border-top: none; }
  .tab-btn.active { background: #FF6B35; border-color: #FF6B35; color: #fff; }
  .tab-btn:hover:not(.active) { border-color: #FF6B35; color: #FF6B35; }
  .tier-chip { padding: 5px 14px; border-radius: 20px; cursor: pointer; font-size: 12px; border: 1px solid #2A2A3A; background: transparent; color: #888; font-family: 'Syne'; transition: all 0.2s; }
  .tier-chip.active { background: #FF6B35; border-color: #FF6B35; color: #fff; }
  .tier-chip:hover:not(.active) { border-color: #FF6B35; color: #E8E8F0; }
  .card { background: #13131F; border: 1px solid #1E1E2E; border-radius: 8px; padding: 20px; }
  .stat-val { font-family: 'Space Mono', monospace; font-size: 22px; color: #FF6B35; font-weight: 700; }
  .stat-lbl { font-size: 11px; color: #666; letter-spacing: 0.08em; text-transform: uppercase; margin-top: 4px; }
  .tbl-row:hover { background: #1A1A28; }
  input[type=number] { background: #1E1E2E; border: 1px solid #2A2A3A; color: #E8E8F0; padding: 8px 12px; border-radius: 6px; font-family: 'Space Mono'; font-size: 14px; outline: none; width: 140px; }
  input[type=number]:focus { border-color: #FF6B35; }
  .rec-card { border-radius: 8px; padding: 16px 20px; text-align: center; }
  .refresh-btn { background: transparent; border: 1px solid #2A2A3A; color: #888; padding: 6px 14px; cursor: pointer; font-family: 'Syne'; font-size: 12px; border-radius: 4px; transition: all 0.2s; display: flex; align-items: center; gap: 6px; }
  .refresh-btn:hover { border-color: #FF6B35; color: #FF6B35; }
  .refresh-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  @keyframes spin { to { transform: rotate(360deg) } }
  .spinning { animation: spin 1s linear infinite; display: inline-block; }
`

const tooltipStyle = {
  contentStyle: { background: '#13131F', border: '1px solid #2A2A3A', borderRadius: 8, fontFamily: 'Space Mono', fontSize: 12 },
  labelStyle: { color: '#FF6B35' },
  itemStyle: { color: '#E8E8F0' },
}

/* ─── Main Dashboard ─────────────────────────────────────────── */
export default function Dashboard({ data, tierStats, meta, loading, onRefresh }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedTier, setSelectedTier] = useState('20K-30K')
  const [myPuffs, setMyPuffs] = useState(20000)

  const priceCurveData = useMemo(() =>
    tierStats.filter(t => t.count > 0).map(t => ({
      tier: t.label,
      avgPrice: +t.avgPrice.toFixed(2),
      minPrice: +t.minPrice.toFixed(2),
      maxPrice: +t.maxPrice.toFixed(2),
      avgPPU: +t.avgPPU.toFixed(4),
    })), [tierStats])

  const scatterData = useMemo(() =>
    data.filter(d => d.puffs > 0 && d.puffs <= 100000).map(d => ({
      x: +(d.puffs / 1000).toFixed(1),
      y: d.price,
      name: d.name,
      source: d.source,
    })), [data])

  const selectedTierData = tierStats.find(t => t.label === selectedTier) || tierStats[4]

  const calcRecommendation = useMemo(() => {
    if (!myPuffs) return null
    const myTier = getTier(myPuffs)
    const stat = tierStats.find(t => t.label === myTier)
    if (!stat || !stat.count) return null
    return {
      tier: myTier,
      conservative: +(stat.avgPrice * 0.95).toFixed(2),
      market: +stat.avgPrice.toFixed(2),
      premium: +(stat.avgPrice * 1.1).toFixed(2),
      ppu_low: +stat.minPPU.toFixed(4),
      ppu_mid: +stat.avgPPU.toFixed(4),
      ppu_high: +stat.maxPPU.toFixed(4),
      count: stat.count,
      items: stat.items,
    }
  }, [myPuffs, tierStats])

  const totalProducts = data.length
  const sources = [...new Set(data.map(d => d.source))].length

  return (
    <div style={{ fontFamily: "'Syne', sans-serif", background: '#0A0A0F', minHeight: '100vh', color: '#E8E8F0' }}>
      <style>{css}</style>

      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(135deg, #0F0F1E 0%, #1A0A0A 100%)', padding: '28px 40px 0', borderBottom: '1px solid #1E1E2E' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: '#FF6B35', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'Space Mono' }}>
              欧洲一次性电子烟 · 实时竞品追踪
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              竞品价格分析 <span style={{ color: '#FF6B35' }}>Dashboard</span>
            </h1>
            <p style={{ margin: '8px 0 0', color: '#666', fontSize: 13 }}>
              数据来源：Google Sheets 实时同步 · <span style={{ color: '#CCC' }}>{totalProducts}</span> 条产品 · <span style={{ color: '#CCC' }}>{sources}</span> 个平台
            </p>
          </div>

          {/* Status & Refresh */}
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            <button className="refresh-btn" onClick={onRefresh} disabled={loading}>
              <span className={loading ? 'spinning' : ''}>⟳</span>
              {loading ? '更新中...' : '立即刷新'}
            </button>
            {meta && (
              <div style={{ fontSize: 11, color: '#555', fontFamily: 'Space Mono' }}>
                {meta.fromCache ? '📦 缓存' : '✅ 实时'} · 更新于 {meta.cachedAt.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {Object.entries(SOURCE_COLORS).filter(([s]) => data.some(d => d.source === s)).map(([s, c]) => (
                <span key={s} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 8, background: c + '22', color: c, border: `1px solid ${c}44` }}>{s}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #1E1E2E' }}>
          {[['overview', '📊 市场全貌'], ['tier', '🎯 档位分析'], ['scatter', '📈 散点图'], ['calc', '💡 定价计算器'], ['table', '📋 全量数据']].map(([id, label]) => (
            <button key={id} className={`tab-btn ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>{label}</button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: '28px 40px', maxWidth: 1400 }}>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <Overview priceCurveData={priceCurveData} tierStats={tierStats} totalProducts={totalProducts} />
        )}

        {/* TIER */}
        {activeTab === 'tier' && (
          <TierAnalysis
            tierStats={tierStats}
            selectedTier={selectedTier}
            setSelectedTier={setSelectedTier}
            selectedTierData={selectedTierData}
          />
        )}

        {/* SCATTER */}
        {activeTab === 'scatter' && <ScatterView scatterData={scatterData} />}

        {/* CALCULATOR */}
        {activeTab === 'calc' && (
          <Calculator
            myPuffs={myPuffs}
            setMyPuffs={setMyPuffs}
            calcRecommendation={calcRecommendation}
          />
        )}

        {/* TABLE */}
        {activeTab === 'table' && <FullTable data={data} />}
      </div>
    </div>
  )
}

/* ─── Overview Tab ───────────────────────────────────────────── */
function Overview({ priceCurveData, tierStats, totalProducts }) {
  const activeTiers = tierStats.filter(t => t.count > 0)
  const avgPrices = activeTiers.map(t => t.avgPrice)
  const overallAvg = avgPrices.length ? (avgPrices.reduce((a, b) => a + b) / avgPrices.length).toFixed(2) : '--'

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: '全部竞品数量', val: totalProducts, sub: '来自各平台实时数据' },
          { label: '覆盖档位数', val: activeTiers.length, sub: '有效 Puff 档位' },
          { label: '市场综合均价', val: `€${overallAvg}`, sub: '跨档位加权参考' },
          { label: '最低 €/千口', val: `€${Math.min(...activeTiers.map(t => t.minPPU)).toFixed(4)}`, sub: '最具价格竞争力' },
        ].map((k, i) => (
          <div key={i} className="card">
            <div className="stat-lbl">{k.label}</div>
            <div className="stat-val">{k.val}</div>
            <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>各档位价格区间（€）</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={priceCurveData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" vertical={false} />
            <XAxis dataKey="tier" tick={{ fill: '#666', fontSize: 12 }} axisLine={{ stroke: '#2A2A3A' }} tickLine={false} />
            <YAxis tick={{ fill: '#666', fontSize: 11, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
            <Tooltip {...tooltipStyle} formatter={(v, n) => [`€${v}`, n === 'avgPrice' ? '平均价' : n === 'minPrice' ? '最低价' : '最高价']} />
            <Legend formatter={v => v === 'avgPrice' ? '平均价' : v === 'minPrice' ? '最低价' : '最高价'} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="minPrice" fill="#10B981" name="minPrice" radius={[4, 4, 0, 0]} opacity={0.7} />
            <Bar dataKey="avgPrice" fill="#FF6B35" name="avgPrice" radius={[4, 4, 0, 0]} />
            <Bar dataKey="maxPrice" fill="#EF4444" name="maxPrice" radius={[4, 4, 0, 0]} opacity={0.5} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 style={{ margin: '0 0 20px', fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>€/千口 成本趋势（容量越大单口成本越低）</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={priceCurveData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" vertical={false} />
            <XAxis dataKey="tier" tick={{ fill: '#666', fontSize: 12 }} axisLine={{ stroke: '#2A2A3A' }} tickLine={false} />
            <YAxis tick={{ fill: '#666', fontSize: 11, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} tickFormatter={v => `€${v.toFixed(2)}`} />
            <Tooltip {...tooltipStyle} formatter={v => [`€${Number(v).toFixed(4)}/千口`, '平均单口成本']} />
            <Line type="monotone" dataKey="avgPPU" stroke="#FF6B35" strokeWidth={2.5} dot={{ fill: '#FF6B35', r: 5 }} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/* ─── Tier Analysis Tab ──────────────────────────────────────── */
function TierAnalysis({ tierStats, selectedTier, setSelectedTier, selectedTierData }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {TIER_DEFINITIONS.map(t => {
          const stat = tierStats.find(s => s.label === t.label)
          return (
            <button key={t.label} className={`tier-chip ${selectedTier === t.label ? 'active' : ''}`} onClick={() => setSelectedTier(t.label)}>
              {t.label} {stat?.count ? <span style={{ opacity: 0.7 }}>({stat.count})</span> : null}
            </button>
          )
        })}
      </div>

      {selectedTierData && selectedTierData.count > 0 ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { label: '产品数量', val: selectedTierData.count },
              { label: '最低价', val: `€${selectedTierData.minPrice.toFixed(2)}` },
              { label: '最高价', val: `€${selectedTierData.maxPrice.toFixed(2)}` },
              { label: '平均价', val: `€${selectedTierData.avgPrice.toFixed(2)}` },
              { label: '均 €/千口', val: `€${selectedTierData.avgPPU.toFixed(4)}` },
            ].map((k, i) => (
              <div key={i} className="card" style={{ textAlign: 'center' }}>
                <div className="stat-lbl">{k.label}</div>
                <div className="stat-val" style={{ fontSize: 18 }}>{k.val}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{selectedTier} · 推荐定价区间</h3>
            <div style={{ height: 8, background: 'linear-gradient(90deg, #10B981 0%, #FF6B35 50%, #EF4444 100%)', borderRadius: 4, marginBottom: 12, position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: `${Math.max(0, Math.min(100, ((selectedTierData.avgPrice - selectedTierData.minPrice) / Math.max(1, selectedTierData.maxPrice - selectedTierData.minPrice) * 100)))}%`,
                top: -7,
                transform: 'translateX(-50%)',
                width: 2,
                height: 22,
                background: '#fff',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', fontFamily: 'Space Mono' }}>
              <span>€{selectedTierData.minPrice.toFixed(2)} 最低</span>
              <span style={{ color: '#FF6B35' }}>均价 ±8% → €{(selectedTierData.avgPrice * 0.92).toFixed(2)} ~ €{(selectedTierData.avgPrice * 1.08).toFixed(2)}</span>
              <span>€{selectedTierData.maxPrice.toFixed(2)} 最高</span>
            </div>
          </div>

          <div className="card">
            <h3 style={{ margin: '0 0 16px', fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{selectedTier} 全部产品 (按价格排序)</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1E1E2E' }}>
                    {['产品名称', '平台', 'Puffs', '售价', '€/千口', 'vs均价'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#555', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...selectedTierData.items].sort((a, b) => a.price - b.price).map((item, i) => {
                    const diff = ((item.price - selectedTierData.avgPrice) / selectedTierData.avgPrice * 100)
                    return (
                      <tr key={i} className="tbl-row" style={{ borderBottom: '1px solid #12121E' }}>
                        <td style={{ padding: '8px 12px', maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <a href={item.link} target="_blank" rel="noopener" style={{ color: '#CCC', textDecoration: 'none' }}>{item.name}</a>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 11, background: (SOURCE_COLORS[item.source] || '#666') + '22', color: SOURCE_COLORS[item.source] || '#888' }}>{item.source}</span>
                        </td>
                        <td style={{ padding: '8px 12px', fontFamily: 'Space Mono', fontSize: 12, color: '#888' }}>{(item.puffs / 1000).toFixed(0)}K</td>
                        <td style={{ padding: '8px 12px', fontFamily: 'Space Mono', fontSize: 13, fontWeight: 700 }}>€{item.price.toFixed(2)}</td>
                        <td style={{ padding: '8px 12px', fontFamily: 'Space Mono', fontSize: 12, color: '#888' }}>€{item.ppu.toFixed(4)}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ fontSize: 11, color: diff > 5 ? '#EF4444' : diff < -5 ? '#10B981' : '#F59E0B', fontFamily: 'Space Mono' }}>
                            {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 60, color: '#555' }}>该档位暂无数据</div>
      )}
    </div>
  )
}

/* ─── Scatter View ───────────────────────────────────────────── */
function ScatterView({ scatterData }) {
  const sources = [...new Set(scatterData.map(d => d.source))]
  return (
    <div className="card">
      <h3 style={{ margin: '0 0 6px', fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>价格 vs 口数 散点图（≤100K Puffs）</h3>
      <p style={{ color: '#555', fontSize: 12, margin: '0 0 16px' }}>悬停查看产品详情，颜色区分平台</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {sources.map(s => (
          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: SOURCE_COLORS[s] || '#888' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: SOURCE_COLORS[s] || '#888', display: 'inline-block' }} />{s}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={440}>
        <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" />
          <XAxis dataKey="x" type="number" name="Puffs" tick={{ fill: '#666', fontSize: 11, fontFamily: 'Space Mono' }} tickFormatter={v => `${v}K`} label={{ value: '口数（千）', position: 'insideBottom', offset: -10, fill: '#555', fontSize: 12 }} domain={[0, 100]} />
          <YAxis dataKey="y" type="number" name="Price" tick={{ fill: '#666', fontSize: 11, fontFamily: 'Space Mono' }} tickFormatter={v => `€${v}`} />
          <Tooltip
            {...tooltipStyle}
            cursor={{ strokeDasharray: '3 3', stroke: '#FF6B35' }}
            formatter={(v, n) => n === 'x' ? [`${v}K puffs`, '口数'] : [`€${v}`, '价格']}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.name || ''}
          />
          {sources.map(source => {
            const pts = scatterData.filter(d => d.source === source)
            return pts.length > 0 ? <Scatter key={source} name={source} data={pts} fill={SOURCE_COLORS[source] || '#888'} opacity={0.75} /> : null
          })}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ─── Calculator Tab ─────────────────────────────────────────── */
function Calculator({ myPuffs, setMyPuffs, calcRecommendation }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20 }}>
      <div>
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 13, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.06em' }}>🎯 输入产品参数</h3>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>产品口数（Puffs）</label>
            <input type="number" value={myPuffs} onChange={e => setMyPuffs(+e.target.value)} min={1000} step={1000} />
            <div style={{ fontSize: 11, color: '#555', marginTop: 6 }}>
              当前档位：<span style={{ color: '#FF6B35', fontFamily: 'Space Mono' }}>{getTier(myPuffs)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[5000, 7000, 9000, 10000, 12000, 15000, 20000, 25000, 30000, 40000, 50000].map(p => (
              <button key={p} className={`tier-chip ${myPuffs === p ? 'active' : ''}`} onClick={() => setMyPuffs(p)} style={{ fontSize: 11 }}>{(p / 1000).toFixed(0)}K</button>
            ))}
          </div>
        </div>

        <div className="card" style={{ background: '#0A0A14', borderColor: '#FF6B3533' }}>
          <div style={{ fontSize: 11, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>📌 定价规律总结</div>
          {['10K以下：€1.5-3.0/千口，售价 €9-22', '10K-20K：€1.0-1.6/千口，售价 €13-27', '20K-40K：€0.6-1.2/千口，售价 €19-36', '40K+：€0.4-0.8/千口，售价 €20-35', '批发价通常为零售价 40-60%', '品牌溢价产品可高于均价 20-30%'].map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7, fontSize: 12, color: '#888', lineHeight: 1.5 }}>
              <span style={{ color: '#FF6B35' }}>—</span><span>{tip}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        {calcRecommendation ? (
          <>
            <div style={{ marginBottom: 14, padding: '12px 18px', background: '#13131F', borderRadius: 8, borderLeft: '3px solid #FF6B35', fontSize: 12, color: '#888' }}>
              分析基于 <span style={{ color: '#E8E8F0', fontFamily: 'Space Mono' }}>{calcRecommendation.count}</span> 款竞品 · 档位 <span style={{ color: '#FF6B35', fontFamily: 'Space Mono' }}>{calcRecommendation.tier}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: '进取定价', desc: '低于均价 ~5%，快速抢占份额', price: calcRecommendation.conservative, color: '#10B981', badge: '竞争力强' },
                { label: '市场均价', desc: '与竞品持平，稳健入市', price: calcRecommendation.market, color: '#FF6B35', badge: '推荐' },
                { label: '溢价定价', desc: '高于均价 ~10%，品质溢价', price: calcRecommendation.premium, color: '#F59E0B', badge: '利润优先' },
              ].map((r, i) => (
                <div key={i} className="rec-card" style={{ background: r.color + '11', border: `1px solid ${r.color}44` }}>
                  <div style={{ fontSize: 10, color: r.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{r.label}</div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: r.color, fontFamily: 'Space Mono', lineHeight: 1 }}>€{r.price}</div>
                  <div style={{ fontSize: 11, color: '#888', margin: '8px 0 6px', lineHeight: 1.5 }}>{r.desc}</div>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: r.color + '22', color: r.color }}>{r.badge}</span>
                </div>
              ))}
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { label: '市场最低 €/千口', val: calcRecommendation.ppu_low, color: '#10B981' },
                  { label: '市场均值 €/千口', val: calcRecommendation.ppu_mid, color: '#FF6B35' },
                  { label: '市场最高 €/千口', val: calcRecommendation.ppu_high, color: '#EF4444' },
                ].map((p, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: 12, background: '#0A0A0F', borderRadius: 6 }}>
                    <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{p.label}</div>
                    <div style={{ fontFamily: 'Space Mono', fontSize: 16, color: p.color, fontWeight: 700 }}>€{p.val}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h4 style={{ margin: '0 0 12px', fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{calcRecommendation.tier} 档位参考竞品</h4>
              <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                {[...calcRecommendation.items].sort((a, b) => a.price - b.price).slice(0, 15).map((item, i) => (
                  <div key={i} className="tbl-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', borderBottom: '1px solid #12121E', fontSize: 12 }}>
                    <span style={{ color: '#CCC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 10 }}>{item.name}</span>
                    <span style={{ fontFamily: 'Space Mono', color: '#FF6B35', fontWeight: 700, flexShrink: 0 }}>€{item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: 60, color: '#555' }}>请输入产品口数以查看定价建议</div>
        )}
      </div>
    </div>
  )
}

/* ─── Full Table Tab ─────────────────────────────────────────── */
function FullTable({ data }) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('price')
  const [sortDir, setSortDir] = useState('asc')

  const filtered = useMemo(() => {
    let rows = data.filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.source.toLowerCase().includes(search.toLowerCase()))
    rows.sort((a, b) => {
      const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })
    return rows
  }, [data, search, sortKey, sortDir])

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const SortIcon = ({ k }) => sortKey === k ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>全量数据 ({filtered.length} / {data.length})</h3>
        <input
          type="text"
          placeholder="搜索产品名或平台..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ background: '#1E1E2E', border: '1px solid #2A2A3A', color: '#E8E8F0', padding: '7px 12px', borderRadius: 6, fontFamily: 'Syne', fontSize: 13, outline: 'none', width: 220 }}
        />
      </div>
      <div style={{ overflowX: 'auto', maxHeight: 600, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ position: 'sticky', top: 0, background: '#13131F', zIndex: 1 }}>
            <tr style={{ borderBottom: '1px solid #1E1E2E' }}>
              {[['name', '产品名称'], ['source', '平台'], ['puffs', 'Puffs'], ['price', '售价'], ['ppu', '€/千口'], ['gradient', '梯度价格']].map(([k, label]) => (
                <th key={k} onClick={() => handleSort(k)} style={{ padding: '10px 12px', textAlign: 'left', color: sortKey === k ? '#FF6B35' : '#555', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                  {label}<SortIcon k={k} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, i) => (
              <tr key={i} className="tbl-row" style={{ borderBottom: '1px solid #12121E' }}>
                <td style={{ padding: '8px 12px', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <a href={item.link} target="_blank" rel="noopener" style={{ color: '#CCC', textDecoration: 'none' }}>{item.name}</a>
                </td>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 11, background: (SOURCE_COLORS[item.source] || '#666') + '22', color: SOURCE_COLORS[item.source] || '#888' }}>{item.source}</span>
                </td>
                <td style={{ padding: '8px 12px', fontFamily: 'Space Mono', fontSize: 12, color: '#888' }}>{item.puffs ? `${(item.puffs / 1000).toFixed(0)}K` : '—'}</td>
                <td style={{ padding: '8px 12px', fontFamily: 'Space Mono', fontSize: 13, fontWeight: 700, color: '#E8E8F0' }}>€{item.price.toFixed(2)}</td>
                <td style={{ padding: '8px 12px', fontFamily: 'Space Mono', fontSize: 12, color: '#888' }}>{item.ppu ? `€${item.ppu.toFixed(4)}` : '—'}</td>
                <td style={{ padding: '8px 12px', fontSize: 12, color: '#666' }}>{item.gradient || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
