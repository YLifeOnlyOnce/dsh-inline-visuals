/* SPDX-License-Identifier: MIT */
import test from 'node:test'
import assert from 'node:assert/strict'
import { normalize } from '../src/host/normalize.js'
import { renderText } from '../src/host/text.js'

const text = (input) => renderText(normalize(input))

test('chart text fallback is a readable list with the note', () => {
  const out = text({
    kind: 'bar',
    title: '命中率',
    data: { labels: ['LRU', 'LFU'], series: [{ name: 'hit', values: [82, 91] }], unit: '%' },
    note: 'LFU 更好',
  })
  assert.match(out, /^命中率/m)
  assert.match(out, /- LRU: hit=82%/)
  assert.match(out, /- LFU: hit=91%/)
  assert.match(out, /LFU 更好/)
})

test('compare text fallback is a markdown table', () => {
  const out = text({ kind: 'compare', title: 'compare', data: { columns: ['a', 'b'], rows: [['1', '2']] } })
  assert.match(out, /\| a \| b \|/)
  assert.match(out, /\| --- \| --- \|/)
  assert.match(out, /\| 1 \| 2 \|/)
})

test('timeline, gantt and metrics keep their structure', () => {
  assert.match(text({ kind: 'timeline', title: 't', data: { items: [{ at: 'T+1', label: 'fix', detail: 'ok' }] } }), /- \[T\+1\] fix — ok/)
  assert.match(text({ kind: 'gantt', title: 'g', data: { tasks: [{ label: 'a', start: 0, end: 2 }], unit: 'h' } }), /- a: 0h–2h/)
  assert.match(text({ kind: 'metrics', title: 'm', data: { items: [{ label: 'p95', value: 120, delta: '12ms', trend: 'up' }], unit: 'ms' } }), /- p95: 120ms \(↑12ms\)/)
})

test('long lists are truncated in the text fallback', () => {
  const labels = Array.from({ length: 30 }, (_, i) => `L${i}`)
  const out = text({ kind: 'bar', title: 't', data: { labels, series: [{ name: 's', values: labels.map((_, i) => i) }] } })
  assert.match(out, /more\)/)
  assert.ok(out.split('\n').length < 25, 'text fallback must stay compact')
})


test('waterfall and heatmap text fallbacks', () => {
  const waterfall = text({ kind: 'waterfall', title: 'w', data: { labels: ['收入', '成本'], values: [100, -30], unit: 'k' } })
  assert.match(waterfall, /- 收入: \+100k \(→ 100k\)/)
  assert.match(waterfall, /- 成本: -30k \(→ 70k\)/)
  assert.match(waterfall, /Total: 70k/)

  const heatmap = text({ kind: 'heatmap', title: 'h', data: { rows: ['a'], columns: ['x', 'y'], values: [[1, 2]] } })
  assert.match(heatmap, /\| a \| 1 \| 2 \|/)
})


test('flow text fallback lists nodes and edges', () => {
  const out = text({
    kind: 'flow',
    title: 'f',
    data: {
      nodes: [{ id: 'a', label: '规划' }, { id: 'b', label: '实现', detail: '2 天' }],
      edges: [{ from: 'a', to: 'b', label: '批准后' }],
    },
  })
  assert.match(out, /- 规划/)
  assert.match(out, /- 实现 — 2 天/)
  assert.match(out, /- 规划 → 实现 \(批准后\)/)
})


test('ML text fallbacks', () => {
  const curve = text({ kind: 'curve', title: 'roc', data: { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }], auc: 0.91 } })
  assert.match(curve, /AUC: 0.91/)

  const confusion = text({ kind: 'confusion', title: 'c', data: { labels: ['cat', 'dog'], matrix: [[8, 2], [1, 9]] } })
  assert.match(confusion, /accuracy: 85%/)
  assert.match(confusion, /cat: recall 80%/)

  const histogram = text({ kind: 'histogram', title: 'h', data: { values: [1, 2, 2, 3], bins: 2 } })
  assert.match(histogram, /- \[/)

  const leaderboard = text({ kind: 'leaderboard', title: 'l', data: { metrics: [{ label: 'acc' }, { label: 'lat', better: 'down' }], rows: [{ name: 'A', values: [0.9, 120] }, { name: 'B', values: [0.93, 100] }] } })
  assert.match(leaderboard, /\| A \| 0\.9 \| 120 \|/)
  assert.match(leaderboard, /\*\*0\.93\*\*/)
  assert.match(leaderboard, /\*\*100\*\*/)
})
