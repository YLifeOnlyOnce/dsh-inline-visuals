#!/usr/bin/env node
/* SPDX-License-Identifier: MIT */

/**
 * Regenerate docs/demo.png: a 3×3 grid covering nine visual kinds.
 * Chart.js kinds use the real `buildChartConfig`; custom kinds are static HTML/SVG mockups.
 * Requires a local Chrome; this is a maintainer script, not part of CI.
 */
import { build } from 'esbuild'
import { execFileSync } from 'node:child_process'
import { mkdtemp, rm, writeFile, copyFile, mkdir } from 'node:fs/promises'
import { normalize } from '../src/host/normalize.js'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const TOKENS = {
  surface: '#ffffff', surfaceMuted: '#f3f4f6', border: '#e5e7eb', text: '#1f2328',
  muted: '#8b929c', accent: '#1f6feb', success: '#1a7f37', warn: '#9a6700',
  error: '#cf222e', idle: '#d9dee5',
}

const SPECS = {
  bar: { title: '柱状图 bar（含数值）', kind: 'bar', style: { values: true }, data: { labels: ['LRU', 'LFU', 'TTL'], series: [{ name: '命中率', values: [82, 91, 76] }], unit: '%' } },
  barh: { title: '横向堆叠 bar', kind: 'bar', style: { orientation: 'horizontal', stacked: true, legend: 'bottom' }, data: { labels: ['Q1', 'Q2', 'Q3'], series: [{ name: '新客户', values: [12, 18, 22] }, { name: '老客户', values: [30, 28, 35] }] } },
  line: { title: '阶梯折线 line', kind: 'line', style: { curve: 'step', points: false }, data: { labels: ['Q1', 'Q2', 'Q3', 'Q4'], series: [{ name: '会话数', values: [120, 180, 260, 340] }] } },
  area: { title: '面积 area', kind: 'area', style: { points: false }, data: { labels: ['1月', '2月', '3月', '4月'], series: [{ name: '调用量', values: [40, 75, 120, 210] }] } },
  pie: { title: '饼图 pie', kind: 'pie', style: { legend: 'bottom' }, data: { slices: [{ label: '计划', value: 44 }, { label: '编码', value: 31 }, { label: '评审', value: 15 }, { label: '其他', value: 10 }], unit: '%' } },
  radar: { title: '雷达图 radar', kind: 'radar', style: { points: false }, data: { labels: ['成本', '风险', '速度', '可维护', '可观测'], series: [{ name: '方案 A', values: [3, 4, 5, 4, 3] }, { name: '方案 B', values: [4, 3, 3, 5, 4] }] } },
  scatter: { title: '散点 + 趋势线', kind: 'scatter', style: { trendLine: true }, data: { points: [{ x: 1, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 5 }, { x: 4, y: 4 }, { x: 5, y: 7 }, { x: 6, y: 6 }, { x: 7, y: 9 }, { x: 8, y: 8 }], xLabel: '输入', yLabel: '耗时' } },
  waterfall: { title: '瀑布图 waterfall', kind: 'waterfall', style: { values: true }, data: { labels: ['收入', '成本', '税费'], values: [120, -45, -15], unit: 'k', totalLabel: '净利' } },
}

const ML_SPECS = {
  curves: { title: '训练曲线（log y + 平滑）', kind: 'line', style: { yScale: 'log', smoothing: 0.45, points: false, legend: 'bottom', errorBars: true }, data: { labels: ['1', '2', '3', '4', '5', '6', '7', '8'], series: [{ name: 'train loss', values: [2.1, 1.4, 0.95, 0.72, 0.61, 0.55, 0.52, 0.5], errors: [0.12, 0.09, 0.07, 0.05, 0.04, 0.04, 0.03, 0.03] }, { name: 'val loss', values: [2.2, 1.6, 1.1, 0.95, 0.98, 1.05, 1.12, 1.2], errors: [0.15, 0.12, 0.1, 0.08, 0.07, 0.06, 0.06, 0.05] }] } },
  roc: { title: 'ROC 曲线', kind: 'curve', style: { baseline: true, points: false }, data: { points: [{ x: 0, y: 0 }, { x: 0.05, y: 0.45 }, { x: 0.12, y: 0.68 }, { x: 0.25, y: 0.82 }, { x: 0.45, y: 0.9 }, { x: 0.7, y: 0.96 }, { x: 1, y: 1 }], auc: 0.91, xLabel: 'FPR', yLabel: 'TPR' } },
  embedding: { title: 'Embedding 聚类', kind: 'scatter', style: { points: true }, data: { series: [{ name: 'cat', points: [{ x: 1, y: 2 }, { x: 1.2, y: 2.3 }, { x: 0.8, y: 1.8 }] }, { name: 'dog', points: [{ x: 4, y: 3 }, { x: 4.3, y: 3.2 }, { x: 3.8, y: 2.7 }] }], xLabel: 't-SNE 1', yLabel: 't-SNE 2' } },
  histogram: { title: '预测置信度分布', kind: 'histogram', style: { values: true }, data: { values: [0.12, 0.22, 0.31, 0.35, 0.42, 0.47, 0.52, 0.55, 0.61, 0.66, 0.71, 0.75, 0.78, 0.82, 0.85, 0.88, 0.9, 0.93, 0.95, 0.97, 0.98, 0.99], bins: 8 } },
}

const NORMALIZED_ML = Object.fromEntries(Object.entries(ML_SPECS).map(([key, spec]) => [key, normalize({ kind: spec.kind, title: spec.title, style: spec.style, data: spec.data })]))

const grid = await build({
  entryPoints: [path.join(root, 'src/client/chart-config.js')],
  bundle: true, format: 'iife', globalName: 'IVDemo', platform: 'browser',
  target: 'es2020', write: false, minify: false, legalComments: 'none',
})

const CARD = (body, title, sub) => `
  <section class="card">
    <header><h2>${title}</h2><p>${sub}</p></header>
    <div class="body">${body}</div>
  </section>`

const chartCard = (key, title, sub) => CARD(
  `<div class="chart"><canvas id="chart-${key}"></canvas></div>`, title, sub)

const compareCard = CARD(`
  <table class="cmp">
    <thead><tr><th>形态</th><th>成本</th><th>风险</th><th>适用</th></tr></thead>
    <tbody>
      <tr><td>独立 bundle</td><td>低</td><td>低</td><td>90% 创意</td></tr>
      <tr><td>core 小改动</td><td>中</td><td>中</td><td>平台能力</td></tr>
      <tr><td>preset 配置</td><td>低</td><td>低</td><td>工具组合</td></tr>
      <tr><td>MCP 配置</td><td>低</td><td>中</td><td>外部服务</td></tr>
    </tbody>
  </table>`, '对比表 compare', '表格，原生语义')

const timelineCard = CARD(`
  <ol class="tl">
    <li><span class="dot"></span><span class="at">第 1 步</span><span class="txt"><b>发讨论</b><i>空白地图 + 30 个创意</i></span></li>
    <li><span class="dot"></span><span class="at">第 2 步</span><span class="txt"><b>发提案</b><i>四条精选</i></span></li>
    <li><span class="dot"></span><span class="at">第 3 步</span><span class="txt"><b>发实现</b><i>仓库 + GIF</i></span></li>
    <li><span class="dot"></span><span class="at">第 4 步</span><span class="txt"><b>升级 RFC</b><i>进入 rfc/ 目录</i></span></li>
  </ol>`, '时间线 timeline', '步骤 / 事故复盘')

const ganttCard = CARD(`
  <svg viewBox="0 0 440 200" width="100%">
    <text x="86" y="22" text-anchor="end" fill="#1f2328" font-size="11">需求</text>
    <rect x="96" y="12" width="60" height="14" rx="3" fill="#1f6feb"/>
    <text x="86" y="52" text-anchor="end" fill="#1f2328" font-size="11">设计</text>
    <rect x="146" y="42" width="80" height="14" rx="3" fill="#1a7f37"/>
    <text x="86" y="82" text-anchor="end" fill="#1f2328" font-size="11">实现</text>
    <rect x="216" y="72" width="130" height="14" rx="3" fill="#9a6700"/>
    <text x="86" y="112" text-anchor="end" fill="#1f2328" font-size="11">测试</text>
    <rect x="326" y="102" width="70" height="14" rx="3" fill="#cf222e"/>
    <text x="86" y="142" text-anchor="end" fill="#1f2328" font-size="11">发布</text>
    <rect x="376" y="132" width="40" height="14" rx="3" fill="#8b929c"/>
    <line x1="96" x2="416" y1="172" y2="172" stroke="#e5e7eb"/>
    <text x="96" y="190" text-anchor="middle" fill="#8b929c" font-size="10">0</text>
    <text x="256" y="190" text-anchor="middle" fill="#8b929c" font-size="10">5</text>
    <text x="416" y="190" text-anchor="middle" fill="#8b929c" font-size="10">10</text>
  </svg>`, '甘特图 gantt', '排期 / 长任务')

const metricsCard = CARD(`
  <div class="metrics">
    <div class="tile"><span>p95 延迟</span><b>120ms</b><i class="up">↑ 12ms</i></div>
    <div class="tile"><span>错误率</span><b>0.4%</b><i class="down">↓ 0.2%</i></div>
    <div class="tile"><span>今日会话</span><b>1,284</b><i class="up">↑ 18%</i></div>
    <div class="tile"><span>今日花费</span><b>$42</b><i class="flat">→ 持平</i></div>
  </div>`, '指标卡 metrics', 'KPI / 巡检快照')

const flowCard = CARD(`
  <svg viewBox="0 0 460 230" width="100%">
    <defs><marker id="a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#d0d5dd"/></marker></defs>
    <rect x="170" y="8" width="120" height="40" rx="8" fill="#f3f4f6" stroke="#e5e7eb"/>
    <text x="230" y="26" text-anchor="middle" fill="#1f2328" font-size="11" font-weight="600">需求</text>
    <text x="230" y="40" text-anchor="middle" fill="#8b929c" font-size="9">review</text>
    <rect x="40" y="96" width="120" height="40" rx="8" fill="#f3f4f6" stroke="#e5e7eb"/>
    <text x="100" y="114" text-anchor="middle" fill="#1f2328" font-size="11" font-weight="600">前端</text>
    <text x="100" y="128" text-anchor="middle" fill="#8b929c" font-size="9">2 天</text>
    <rect x="300" y="96" width="120" height="40" rx="8" fill="#f3f4f6" stroke="#e5e7eb"/>
    <text x="360" y="114" text-anchor="middle" fill="#1f2328" font-size="11" font-weight="600">后端</text>
    <text x="360" y="128" text-anchor="middle" fill="#8b929c" font-size="9">3 天</text>
    <rect x="170" y="184" width="120" height="40" rx="8" fill="#eef4ff" stroke="#bfd3f7"/>
    <text x="230" y="202" text-anchor="middle" fill="#1f2328" font-size="11" font-weight="600">发布</text>
    <text x="230" y="216" text-anchor="middle" fill="#8b929c" font-size="9">周五</text>
    <g fill="none" stroke="#d0d5dd" stroke-width="1.4" marker-end="url(#a)">
      <path d="M 230 48 C 230 70, 100 74, 100 96"/>
      <path d="M 230 48 C 230 70, 360 74, 360 96"/>
      <path d="M 100 136 C 100 164, 230 160, 230 184"/>
      <path d="M 360 136 C 360 164, 230 160, 230 184"/>
    </g>
  </svg>`, '流程图 flow', 'DAG / 编排')

const heatmapCard = CARD(`
  <svg viewBox="0 0 440 220" width="100%">
    <text x="92" y="16" text-anchor="end" fill="#8b929c" font-size="10">周一</text>
    <text x="92" y="52" text-anchor="end" fill="#8b929c" font-size="10">周二</text>
    <text x="92" y="88" text-anchor="end" fill="#8b929c" font-size="10">周三</text>
    <text x="92" y="124" text-anchor="end" fill="#8b929c" font-size="10">周四</text>
    <text x="92" y="160" text-anchor="end" fill="#8b929c" font-size="10">周五</text>
    <text x="160" y="12" text-anchor="middle" fill="#8b929c" font-size="10">00</text>
    <text x="244" y="12" text-anchor="middle" fill="#8b929c" font-size="10">08</text>
    <text x="328" y="12" text-anchor="middle" fill="#8b929c" font-size="10">16</text>
    <g font-size="10" text-anchor="middle">
      <rect x="118" y="24" width="84" height="34" rx="3" fill="#1f6feb" opacity=".18"/><text x="160" y="46" fill="#1f2328">2</text>
      <rect x="202" y="24" width="84" height="34" rx="3" fill="#1f6feb" opacity=".55"/><text x="244" y="46" fill="#fff">7</text>
      <rect x="286" y="24" width="84" height="34" rx="3" fill="#1f6feb" opacity=".85"/><text x="328" y="46" fill="#fff">11</text>
      <rect x="118" y="60" width="84" height="34" rx="3" fill="#1f6feb" opacity=".32"/><text x="160" y="82" fill="#fff">4</text>
      <rect x="202" y="60" width="84" height="34" rx="3" fill="#1f6feb" opacity=".7"/><text x="244" y="82" fill="#fff">9</text>
      <rect x="286" y="60" width="84" height="34" rx="3" fill="#1f6feb" opacity=".45"/><text x="328" y="82" fill="#fff">6</text>
      <rect x="118" y="96" width="84" height="34" rx="3" fill="#1f6feb" opacity=".6"/><text x="160" y="118" fill="#fff">8</text>
      <rect x="202" y="96" width="84" height="34" rx="3" fill="#1f6feb" opacity=".9"/><text x="244" y="118" fill="#fff">12</text>
      <rect x="286" y="96" width="84" height="34" rx="3" fill="#1f6feb" opacity=".28"/><text x="328" y="118" fill="#1f2328">3</text>
      <rect x="118" y="132" width="84" height="34" rx="3" fill="#1f6feb" opacity=".4"/><text x="160" y="154" fill="#fff">5</text>
      <rect x="202" y="132" width="84" height="34" rx="3" fill="#1f6feb" opacity=".65"/><text x="244" y="154" fill="#fff">8</text>
      <rect x="286" y="132" width="84" height="34" rx="3" fill="#1f6feb" opacity=".75"/><text x="328" y="154" fill="#fff">10</text>
      <rect x="118" y="168" width="84" height="34" rx="3" fill="#1f6feb" opacity=".22"/><text x="160" y="190" fill="#1f2328">3</text>
      <rect x="202" y="168" width="84" height="34" rx="3" fill="#1f6feb" opacity=".48"/><text x="244" y="190" fill="#fff">6</text>
      <rect x="286" y="168" width="84" height="34" rx="3" fill="#1f6feb" opacity=".35"/><text x="328" y="190" fill="#fff">4</text>
    </g>
  </svg>`, '热力图 heatmap', '矩阵 / 密度')

const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>
*{box-sizing:border-box}
body{margin:0;padding:34px 40px;width:1500px;height:2280px;background:#f2f4f7;
  font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Helvetica Neue",Arial,sans-serif;color:#1f2328}
h1{margin:0 0 4px;font-size:26px}
.lead{margin:0 0 22px;color:#6b7280;font-size:13.5px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:18px;
  box-shadow:0 1px 2px rgba(16,24,40,.04);height:360px;display:flex;flex-direction:column}
.card header h2{margin:0;font-size:14px;font-weight:600}
.card header p{margin:3px 0 10px;color:#8b929c;font-size:11px}
.body{flex:1;min-height:0;display:flex;flex-direction:column}
.chart{position:relative;flex:1;min-height:0}
.cmp{width:100%;border-collapse:collapse;font-size:12px}
.cmp th{color:#8b929c;font-weight:600;font-size:11px;padding:7px 9px;border-bottom:1px solid #e5e7eb;text-align:left}
.cmp th:not(:first-child),.cmp td:not(:first-child){text-align:center}
.cmp td{padding:9px;border-bottom:1px solid #f0f2f4;font-size:12px}
.cmp tr:last-child td{border-bottom:none}
.tl{list-style:none;margin:0;padding:0}
.tl li{display:flex;gap:10px;padding:9px 0;align-items:flex-start;border-bottom:1px solid #f0f2f4}
.tl li:last-child{border-bottom:none}
.tl .dot{width:9px;height:9px;border-radius:50%;background:#1f6feb;margin-top:5px;flex:0 0 auto}
.tl .at{flex:0 0 48px;color:#8b929c;font-size:11px;margin-top:1px}
.tl .txt b{display:block;font-size:12.5px}
.tl .txt i{display:block;font-style:normal;color:#8b929c;font-size:11px;margin-top:2px}
.metrics{display:flex;flex-wrap:wrap;gap:10px}
.tile{flex:1 1 140px;min-width:120px;border:1px solid #e5e7eb;border-radius:10px;background:#f3f4f6;padding:12px 14px}
.tile span{display:block;color:#8b929c;font-size:11px;margin-bottom:6px}
.tile b{font-size:22px;font-weight:600}
.tile i{font-style:normal;font-size:11.5px;margin-left:6px}
.tile i.up{color:#1a7f37}.tile i.down{color:#cf222e}.tile i.flat{color:#8b929c}
.note{margin-top:18px;color:#9aa0a6;font-size:11.5px}
</style></head><body>
<h1>Inline Visuals · 14 种图型 · 样式可调 · 可追问</h1>
<p class="lead">Chart.js 负责图表类（bar / line / area / pie / doughnut / scatter / radar / waterfall），SVG 与 HTML 负责 compare / timeline / gantt / heatmap / metrics。style 支持横向、堆叠、阶梯、数值标签、图例/网格、配色与趋势线；edit_visual 可基于上一张图做局部修改。</p>
<div class="grid">
  ${chartCard('bar', '柱状图 bar', '含数值标签')}
  ${chartCard('barh', '横向堆叠 bar', 'orientation + stacked')}
  ${chartCard('line', '阶梯折线 line', 'curve: step')}
  ${chartCard('area', '面积 area', '填充趋势')}
  ${chartCard('pie', '饼图 pie', '占比 + 图例')}
  ${chartCard('radar', '雷达图 radar', '多维对比')}
  ${chartCard('scatter', '散点 + 趋势线', 'trendLine: true')}
  ${chartCard('waterfall', '瀑布图 waterfall', '增减分解')}
  ${flowCard}
  ${heatmapCard}
  ${compareCard}
  ${timelineCard}
  ${ganttCard}
  ${metricsCard}
</div>
<p class="note">docs/demo.png 由 scripts/demo.mjs 生成 · 与 src/client/chart-config.js 使用同一份配置</p>
<script>${grid.outputFiles[0].text}</script>
<script>
const TOKENS = ${JSON.stringify(TOKENS)};
const SPECS = ${JSON.stringify(SPECS)};
for (const [key, spec] of Object.entries(SPECS)) {
  const canvas = document.getElementById('chart-' + key);
  if (!canvas) continue;
  IVDemo.createChart(canvas, Object.assign({ version: 2, title: spec.title }, spec), TOKENS);
}
</script>
</body></html>`

const work = await mkdtemp(path.join(tmpdir(), 'iv-demo-'))

async function shoot(htmlText, outName, windowSize) {
  const page = path.join(work, `${outName}.html`)
  await writeFile(page, htmlText, 'utf8')
  const raw = path.join(work, `${outName}.png`)
  execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-sandbox',
    '--virtual-time-budget=3000',
    '--force-device-scale-factor=2', `--window-size=${windowSize}`,
    `--screenshot=${raw}`, `file://${page}`,
  ], { stdio: 'ignore' })
  await mkdir(path.join(root, 'docs'), { recursive: true })
  await copyFile(raw, path.join(root, 'docs', outName))
  console.log(`docs/${outName} regenerated`)
}

const ML_CSS = `
*{box-sizing:border-box}
body{margin:0;padding:34px 40px;width:1500px;height:980px;background:#f2f4f7;
  font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Helvetica Neue",Arial,sans-serif;color:#1f2328}
h1{margin:0 0 4px;font-size:26px}
.lead{margin:0 0 20px;color:#6b7280;font-size:13.5px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:18px;height:360px;display:flex;flex-direction:column;
  box-shadow:0 1px 2px rgba(16,24,40,.04)}
.card header h2{margin:0;font-size:14px;font-weight:600}
.card header p{margin:3px 0 10px;color:#8b929c;font-size:11px}
.body{flex:1;min-height:0;display:flex;flex-direction:column}
.chart{position:relative;flex:1;min-height:0}
.note{margin-top:16px;color:#9aa0a6;font-size:11.5px}
`

const confusionCard = CARD(`
  <div style="display:flex;gap:18px;align-items:center;justify-content:center">
    <svg viewBox="0 0 300 220" width="62%">
      <text x="64" y="16" text-anchor="end" fill="#8b929c" font-size="10">cat</text>
      <text x="64" y="66" text-anchor="end" fill="#8b929c" font-size="10">dog</text>
      <text x="64" y="116" text-anchor="end" fill="#8b929c" font-size="10">bird</text>
      <text x="118" y="8" text-anchor="middle" fill="#8b929c" font-size="10">cat</text>
      <text x="188" y="8" text-anchor="middle" fill="#8b929c" font-size="10">dog</text>
      <text x="258" y="8" text-anchor="middle" fill="#8b929c" font-size="10">bird</text>
      <rect x="88" y="24" width="60" height="44" rx="4" fill="#1f6feb" opacity=".85"/><text x="118" y="52" text-anchor="middle" fill="#fff" font-size="12" font-weight="600">82</text>
      <rect x="158" y="24" width="60" height="44" rx="4" fill="#1f6feb" opacity=".12"/><text x="188" y="52" text-anchor="middle" fill="#1f2328" font-size="11">12</text>
      <rect x="228" y="24" width="60" height="44" rx="4" fill="#1f6feb" opacity=".06"/><text x="258" y="52" text-anchor="middle" fill="#1f2328" font-size="11">6</text>
      <rect x="88" y="74" width="60" height="44" rx="4" fill="#1f6feb" opacity=".1"/><text x="118" y="102" text-anchor="middle" fill="#1f2328" font-size="11">9</text>
      <rect x="158" y="74" width="60" height="44" rx="4" fill="#1f6feb" opacity=".85"/><text x="188" y="102" text-anchor="middle" fill="#fff" font-size="12" font-weight="600">76</text>
      <rect x="228" y="74" width="60" height="44" rx="4" fill="#1f6feb" opacity=".08"/><text x="258" y="102" text-anchor="middle" fill="#1f2328" font-size="11">5</text>
      <rect x="88" y="124" width="60" height="44" rx="4" fill="#1f6feb" opacity=".07"/><text x="118" y="152" text-anchor="middle" fill="#1f2328" font-size="11">4</text>
      <rect x="158" y="124" width="60" height="44" rx="4" fill="#1f6feb" opacity=".1"/><text x="188" y="152" text-anchor="middle" fill="#1f2328" font-size="11">8</text>
      <rect x="228" y="124" width="60" height="44" rx="4" fill="#1f6feb" opacity=".8"/><text x="258" y="152" text-anchor="middle" fill="#fff" font-size="12" font-weight="600">64</text>
    </svg>
    <div style="color:#8b929c;font-size:10px;line-height:1.6">accuracy 88%<br>macro F1 0.87</div>
  </div>`, '混淆矩阵 confusion', '分类评估')

const leaderboardCard = CARD(`
  <table style="width:100%;border-collapse:collapse;font-size:12px">
    <thead><tr>
      <th style="text-align:left;color:#8b929c;font-size:11px;padding:7px 9px;border-bottom:1px solid #e5e7eb">model</th>
      <th style="text-align:center;color:#8b929c;font-size:11px;padding:7px 9px;border-bottom:1px solid #e5e7eb">acc ↑</th>
      <th style="text-align:center;color:#8b929c;font-size:11px;padding:7px 9px;border-bottom:1px solid #e5e7eb">F1 ↑</th>
      <th style="text-align:center;color:#8b929c;font-size:11px;padding:7px 9px;border-bottom:1px solid #e5e7eb">latency ↓ (ms)</th>
    </tr></thead>
    <tbody>
      <tr><td style="padding:8px 9px">baseline</td><td style="text-align:center;padding:8px 9px">0.82</td><td style="text-align:center;padding:8px 9px">0.79</td><td style="text-align:center;padding:8px 9px">120</td></tr>
      <tr><td style="padding:8px 9px">+aug</td><td style="text-align:center;padding:8px 9px">0.87</td><td style="text-align:center;padding:8px 9px">0.85</td><td style="text-align:center;padding:8px 9px">125</td></tr>
      <tr><td style="padding:8px 9px">ours</td><td style="text-align:center;padding:8px 9px;color:#1a7f37;font-weight:600">0.93</td><td style="text-align:center;padding:8px 9px;color:#1a7f37;font-weight:600">0.91</td><td style="text-align:center;padding:8px 9px;color:#1a7f37;font-weight:600">98</td></tr>
    </tbody>
  </table>`, '排行榜 leaderboard', '模型对比')

const mlCards = [
  chartCard('curves', '训练曲线', 'yScale: log · smoothing 0.45'),
  chartCard('roc', 'ROC 曲线', 'baseline · AUC 0.91'),
  chartCard('embedding', 'Embedding 聚类', 'grouped scatter'),
  chartCard('histogram', '置信度分布', 'histogram · 8 bins'),
  confusionCard,
  leaderboardCard,
].join('\n')

const mlHtml = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>${ML_CSS}</style></head><body>
<h1>Inline Visuals · 机器学习与论文阅读</h1>
<p class="lead">训练曲线（log 轴 + EMA 平滑 + 误差棒）、ROC / PR 曲线（AUC + 对角线）、embedding 聚类散点、
置信度直方图、混淆矩阵、模型排行榜——都能让 Agent 从数据或论文结果直接画出来。</p>
<div class="grid">
  ${mlCards}
</div>
<p class="note">docs/ml-gallery.png 由 scripts/demo.mjs 生成 · 与卡片渲染共用同一份 Chart.js 配置</p>
<script>${grid.outputFiles[0].text}</script>
<script>
window.onerror = (message, source, line, column, error) => {
  const pre = document.createElement('pre');
  pre.id = 'mlerr';
  pre.style = 'color:red;font-size:14px;white-space:pre-wrap';
  pre.textContent = message + ' @' + line + ':' + column + '\\n' + (error && error.stack ? error.stack : '');
  document.body.appendChild(pre);
};
const TOKENS = ${JSON.stringify(TOKENS)};
const ML_SPECS = ${JSON.stringify(NORMALIZED_ML)};
document.body.dataset.mlStarted = '1';
document.body.dataset.ivdemo = String(typeof IVDemo);
document.body.dataset.errors = JSON.stringify(window.__errors || []);
setTimeout(() => { for (const [key, spec] of Object.entries(ML_SPECS)) {
  const canvas = document.getElementById('chart-' + key);
  if (!canvas) { document.body.dataset.mlMissing = (document.body.dataset.mlMissing || '') + key + ','; continue; }
  try {
    IVDemo.createChart(canvas, Object.assign({ version: 3, title: spec.title }, spec), TOKENS);
    canvas.setAttribute('data-drawn', '1'); document.body.dataset.mlDrawn = (document.body.dataset.mlDrawn || '') + key + ',';
  } catch (error) {
    canvas.setAttribute('data-error', String(error && error.message ? error.message : error));
  }
} }, 0);
</script>
</body></html>`

try {
  await shoot(html, 'demo.png', '1500,2300')
  await shoot(mlHtml, 'ml-gallery.png', '1500,1010')
} finally {
  if (process.env.DEBUG_ML) console.log('debug work dir:', work)
  else await rm(work, { recursive: true, force: true })
}
