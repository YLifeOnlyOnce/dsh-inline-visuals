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
  bar: { title: '命中率对比', kind: 'bar', data: { labels: ['LRU', 'LFU', 'TTL'], series: [{ name: '命中率', values: [82, 91, 76] }], unit: '%' } },
  line: { title: '会话数趋势', kind: 'line', data: { labels: ['Q1', 'Q2', 'Q3', 'Q4'], series: [{ name: '会话数', values: [120, 180, 260, 340] }] } },
  pie: { title: '时间分布', kind: 'pie', data: { slices: [{ label: '计划', value: 44 }, { label: '编码', value: 31 }, { label: '评审', value: 15 }, { label: '其他', value: 10 }], unit: '%' } },
  radar: { title: '方案对比', kind: 'radar', data: { labels: ['成本', '风险', '速度', '可维护', '可观测'], series: [{ name: '方案 A', values: [3, 4, 5, 4, 3] }, { name: '方案 B', values: [4, 3, 3, 5, 4] }] } },
  scatter: { title: '样本分布', kind: 'scatter', data: { points: [{ x: 1, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 5 }, { x: 4, y: 4 }, { x: 5, y: 7 }, { x: 6, y: 6 }, { x: 7, y: 9 }, { x: 8, y: 8 }], xLabel: '输入', yLabel: '耗时' } },
}

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

const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>
*{box-sizing:border-box}
body{margin:0;padding:34px 40px;width:1500px;height:1320px;background:#f2f4f7;
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
<h1>Inline Visuals · 11 种图型</h1>
<p class="lead">Chart.js 负责 bar / line / area / pie / doughnut / scatter / radar；SVG 与 HTML 负责 compare / timeline / gantt / metrics。全部跟随主题 token，数据存于会话日志。</p>
<div class="grid">
  ${chartCard('bar', '柱状图 bar', '分类对比')}
  ${chartCard('line', '折线图 line / area', '趋势')}
  ${chartCard('pie', '饼图 pie / doughnut', '占比')}
  ${chartCard('radar', '雷达图 radar', '多维对比')}
  ${chartCard('scatter', '散点图 scatter', '相关性')}
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
const page = path.join(work, 'demo.html')
await writeFile(page, html, 'utf8')
const raw = path.join(work, 'demo.png')
try {
  execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-sandbox',
    '--force-device-scale-factor=2', '--window-size=1500,1320',
    `--screenshot=${raw}`, `file://${page}`,
  ], { stdio: 'ignore' })
  await mkdir(path.join(root, 'docs'), { recursive: true })
  await copyFile(raw, path.join(root, 'docs/demo.png'))
  console.log('docs/demo.png regenerated')
} finally {
  await rm(work, { recursive: true, force: true })
}
