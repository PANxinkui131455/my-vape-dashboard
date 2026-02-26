# 竞品价格分析 Dashboard

> 实时连接 Google Sheets 数据源 · GitHub Pages 自动部署 · 每天自动刷新

---

## 🚀 快速开始（完整部署流程）

### 第一步：准备 Google Sheets 数据表

1. 打开你的竞品价格调研 Google Sheets
2. 确认表格第一行为以下表头（列顺序需一致）：

   | A | B | C | D | E | F | G | H |
   |---|---|---|---|---|---|---|---|
   | 产品链接 | 图片 | 产品名称 | 单品价格 | 梯度价格 | Puff 数 | 是否包邮 | 图片链接 |

3. 点击菜单 **文件 → 共享 → 发布到网络**
4. 选择"整个文档" + 格式选 **"逗号分隔值 (.csv)"**
5. 点击"发布"，复制生成的链接
6. 从链接中提取 `SHEET_ID`，例如：
   ```
   https://docs.google.com/spreadsheets/d/【这部分就是SHEET_ID】/pub?...
   ```

---

### 第二步：配置 SHEET_ID

打开 `src/utils/sheetData.js`，找到以下位置，替换为你的真实 ID：

```js
export const SHEET_CONFIG = {
  SHEET_ID: '你的SHEET_ID填这里',  // ← 替换这里
  GID: '0',  // 如果数据在第一个标签页，保持 '0' 不变
}
```

如果你的数据在第二个、第三个 Tab，在 Google Sheets 地址栏末尾可以看到 `#gid=123456`，将该数字填入 `GID`。

---

### 第三步：修改 vite.config.js 中的仓库名

打开 `vite.config.js`，将 `base` 改为你的 GitHub 仓库名：

```js
base: '/你的仓库名/',
// 例如: base: '/vape-pricing-dashboard/',
```

如果你使用自定义域名，改为：
```js
base: '/',
```

---

### 第四步：上传到 GitHub

```bash
# 初始化 git 仓库（如果还没有）
git init
git add .
git commit -m "初始化竞品价格分析平台"

# 创建 GitHub 仓库后，推送
git remote add origin https://github.com/你的用户名/你的仓库名.git
git branch -M main
git push -u origin main
```

---

### 第五步：开启 GitHub Pages

1. 进入你的 GitHub 仓库页面
2. 点击 **Settings** → 左侧菜单 **Pages**
3. Source 选择 **GitHub Actions**
4. 保存

推送代码后，GitHub Actions 会自动构建并部署，大约 1-2 分钟后可访问：
```
https://你的用户名.github.io/你的仓库名/
```

---

## ⚙️ 自动更新机制

### 数据实时性
- 每次打开 Dashboard，程序会自动从 Google Sheets 拉取最新数据
- **本地缓存 24 小时**：同一浏览器 24 小时内再次访问会使用缓存，加快加载速度
- 点击右上角 **"立即刷新"** 按钮可强制绕过缓存，获取最新数据

### 自动重新部署
GitHub Actions 配置了每天北京时间 **09:00 自动构建部署**（即使没有代码更新），确保：
- 每天获得全新构建
- 如果 Google Sheets 结构有变化，新构建会反映最新解析逻辑

### 手动触发
进入 GitHub 仓库 → **Actions** → 选择 "Deploy to GitHub Pages" → 点击 **"Run workflow"**

---

## 📋 Dashboard 功能说明

| 模块 | 说明 |
|------|------|
| 📊 市场全貌 | 各 Puff 档位的价格区间柱状图 + €/千口单口成本趋势曲线 |
| 🎯 档位分析 | 按档位筛选，查看最低/均/最高价，及所有竞品明细 |
| 📈 散点图 | 所有竞品按平台颜色分布在价格 vs 口数坐标系 |
| 💡 定价计算器 | 输入你的口数，自动推荐进取/均价/溢价三种定价 |
| 📋 全量数据 | 所有数据可搜索、可按各列排序，点击产品名跳转原链接 |

---

## 🛠 本地开发

```bash
# 安装依赖
npm install

# 启动本地开发服务器（热更新）
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

---

## 📌 常见问题

**Q: 数据加载失败，显示 HTTP 错误？**
> 检查 Google Sheets 是否已正确"发布到网络"，并选择了 CSV 格式。Sheet 必须是公开可访问状态。

**Q: 数据显示但 Puff 数为空？**
> 检查 Google Sheets 中 F 列（Puff 数）的表头名称是否与程序一致（`Puff 数` 或 `Puff数`），且数值列为纯数字（不含文字）。

**Q: 修改了 SHEET_ID 但还看到旧数据？**
> 点击 Dashboard 右上角"立即刷新"强制清除缓存，或在浏览器中清除 localStorage。

**Q: 如何添加新的数据来源平台？**
> 在 `src/utils/sheetData.js` 的 `parseRow` 函数中，在 `source` 判断逻辑里添加新的 `else if (link.includes('新平台域名')) source = '新平台名'`，并在 `SOURCE_COLORS` 中添加对应颜色。
