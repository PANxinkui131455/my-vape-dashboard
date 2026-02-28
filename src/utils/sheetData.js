import Papa from 'papaparse'

// ============================================================
// 📋 配置你的 Google Sheets 信息
// 步骤：
//   1. 打开 Google Sheets
//   2. 菜单 → 文件 → 共享 → 发布到网络
//   3. 选择 "整个文档" + "逗号分隔值 (.csv)"，点击发布
//   4. 复制链接，提取其中的 SHEET_ID（两个 /d/ 和 /pub 之间的部分）
//   5. 将 SHEET_ID 填入下方
// ============================================================
export const SHEET_CONFIG = {
  // 替换为你的 Google Sheet ID
  SHEET_ID: '17kmpOVppPAPeHcld84o_82bslQ3VUvYRNLbxAAT5SOc',
  // 如果有多个 sheet tab，填入对应的 gid（默认第一个 tab 为 0）
  GID: '0',
}

// 缓存键和过期时间（24小时）
const CACHE_KEY = 'vape_pricing_cache'
const CACHE_TS_KEY = 'vape_pricing_cache_ts'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * 构建 Google Sheets CSV 导出 URL
 */
export function buildSheetUrl(sheetId = SHEET_CONFIG.SHEET_ID, gid = SHEET_CONFIG.GID) {
  return `https://docs.google.com/spreadsheets/d/e/2PACX-1vRr2OgjqbFwNWVcgb-n0Mtu73Y3Qh8AjR49Cj_9IEvcBQRy0NdMg5rzGjWLSzuilEkwjhaum-7eBzyH/pub?output=csv`
}

/**
 * 解析 CSV 行为产品对象
 * 表头：产品链接 | 图片 | 产品名称 | 单品价格 | 梯度价格 | Puff数 | 是否包邮 | 图片链接
 */
function parseRow(row) {
  const name = row['产品名称'] || row[2] || ''
  const price = parseFloat(row['单品价格'] || row[3] || 0)
  const puffs = parseFloat(row['Puff 数'] || row['Puff数'] || row[5] || 0)
  const gradient = row['梯度价格'] || row[4] || ''
  const link = row['产品链接'] || row[0] || ''
  const imgUrl = row['图片链接'] || row[7] || ''

  if (!name || !price || price <= 0) return null

  // 从链接推断来源平台
  let source = '其他'
  if (link.includes('vapeseurope')) source = 'VapesEurope'
  else if (link.includes('eurocityvape')) source = 'EuroCityVape'
  else if (link.includes('vapormo')) source = 'Vapormo'
  else if (link.includes('randmvapes')) source = 'RandMVapes'
  else if (link.includes('vapes001')) source = 'Vapes001'
  else if (link.includes('eurovapeland')) source = 'EuroVapeLand'
  else if (link.includes('vapebarmarket')) source = 'VapeBarMarket'
  else if (link.includes('vapepurchase')) source = 'VapePurchase'
  else if (link.includes('vapsolo')) source = 'Vapsolo'

  return {
    name: name.trim(),
    price,
    puffs: puffs > 0 ? Math.round(puffs) : null,
    ppu: puffs > 0 ? (price / puffs) * 1000 : null,
    gradient: gradient.trim(),
    source,
    link: link.replace(/^=HYPERLINK\("([^"]+)".*$/, '$1'),
    imgUrl,
  }
}

/**
 * 从 Google Sheets 获取数据，带本地缓存
 * @param {boolean} forceRefresh - 强制忽略缓存重新获取
 */
export async function fetchSheetData(forceRefresh = false) {
  // 检查缓存
  if (!forceRefresh) {
    try {
      const ts = localStorage.getItem(CACHE_TS_KEY)
      const cached = localStorage.getItem(CACHE_KEY)
      if (ts && cached && Date.now() - parseInt(ts) < CACHE_TTL_MS) {
        return { data: JSON.parse(cached), fromCache: true, cachedAt: new Date(parseInt(ts)) }
      }
    } catch (_) {}
  }

  // 从 Google Sheets 获取
  const url = buildSheetUrl()
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}: 无法获取数据表`)
  const csvText = await response.text()

  // 解析 CSV
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true })
  const rows = parsed.data.map(parseRow).filter(Boolean)

  // 存入缓存
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(rows))
    localStorage.setItem(CACHE_TS_KEY, Date.now().toString())
  } catch (_) {}

  return { data: rows, fromCache: false, cachedAt: new Date() }
}

/**
 * 档位分组定义
 */
export const TIER_DEFINITIONS = [
  { label: '≤5K',     min: 0,      max: 5000   },
  { label: '5K-10K',  min: 5000,   max: 10000  },
  { label: '10K-15K', min: 10000,  max: 15000  },
  { label: '15K-20K', min: 15000,  max: 20000  },
  { label: '20K-30K', min: 20000,  max: 30000  },
  { label: '30K-40K', min: 30000,  max: 40000  },
  { label: '40K-50K', min: 40000,  max: 50000  },
  { label: '50K-100K',min: 50000,  max: 100000 },
  { label: '100K+',   min: 100000, max: Infinity },
]

export function getTier(puffs) {
  for (const t of TIER_DEFINITIONS) {
    if (puffs > t.min && puffs <= t.max) return t.label
  }
  return '未知'
}

export function computeTierStats(data) {
  const withPPU = data.filter(d => d.puffs > 0).map(d => ({ ...d, tier: getTier(d.puffs) }))
  return TIER_DEFINITIONS.map(t => {
    const items = withPPU.filter(d => d.tier === t.label)
    if (items.length === 0) return { ...t, count: 0, items: [] }
    const prices = items.map(d => d.price)
    const ppus = items.map(d => d.ppu)
    return {
      ...t,
      count: items.length,
      items,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
      minPPU: Math.min(...ppus),
      maxPPU: Math.max(...ppus),
      avgPPU: ppus.reduce((a, b) => a + b, 0) / ppus.length,
    }
  })
}

export const SOURCE_COLORS = {
  VapeBarMarket: '#111827',
  VapesEurope:   '#1F2937',
  EuroCityVape:  '#374151',
  Vapormo:       '#4B5563',
  RandMVapes:    '#6B7280',
  Vapes001:      '#9CA3AF',
  EuroVapeLand:  '#111827',
  VapePurchase:  '#4B5563',
  Vapsolo:       '#6B7280',
  '其他':         '#9CA3AF',
}
