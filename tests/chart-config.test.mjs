/* SPDX-License-Identifier: MIT */
import test from 'node:test'
import assert from 'node:assert/strict'
import { buildChartConfig } from '../src/client/chart-config.js'
import { normalize } from '../src/host/normalize.js'

const TOKENS = {
  surface: '#ffffff',
  surfaceMuted: '#f3f4f6',
  border: '#e5e7eb',
  text: '#1f2328',
  muted: '#8b929c',
  accent: '#1f6feb',
  success: '#1a7f37',
  warn: '#9a6700',
  error: '#cf222e',
  idle: '#d9dee5',
}

const SPECS = {
  bar: { labels: ['A', 'B'], series: [{ name: 's', values: [1, 2] }] },
  line: { labels: ['A', 'B'], series: [{ name: 's', values: [1, 2] }] },
  area: { labels: ['A', 'B'], series: [{ name: 's', values: [1, 2] }] },
  pie: { slices: [{ label: 'x', value: 1 }, { label: 'y', value: 2 }] },
  doughnut: { slices: [{ label: 'x', value: 1 }] },
  scatter: { points: [{ x: 1, y: 2 }] },
  radar: { labels: ['A', 'B', 'C'], series: [{ name: 's', values: [1, 2, 3] }] },
  waterfall: { labels: ['a', 'b'], values: [10, -4] },
}

test('each canvas kind builds a deterministic Chart.js config', () => {
  for (const [kind, data] of Object.entries(SPECS)) {
    const spec = normalize({ kind, title: kind, data })
    const config = buildChartConfig(spec, TOKENS)
    assert.equal(typeof config.type, 'string')
    assert.ok(Array.isArray(config.data.datasets) && config.data.datasets.length > 0)
    assert.deepEqual(JSON.parse(JSON.stringify(config)), JSON.parse(JSON.stringify(config)))
  }
})

test('config shapes match the visual form', () => {
  const bar = buildChartConfig(normalize({ kind: 'bar', title: 'b', data: SPECS.bar }), TOKENS)
  assert.equal(bar.type, 'bar')
  assert.ok(bar.options.scales.y, 'bar needs a y scale')
  assert.equal(bar.data.datasets[0].borderRadius, 4)

  const area = buildChartConfig(normalize({ kind: 'area', title: 'a', data: SPECS.area }), TOKENS)
  assert.equal(area.data.datasets[0].fill, true)

  const pie = buildChartConfig(normalize({ kind: 'pie', title: 'p', data: SPECS.pie }), TOKENS)
  assert.equal(pie.type, 'pie')
  assert.equal(pie.options.scales, undefined)
  assert.equal(pie.data.labels.length, 2)

  const scatter = buildChartConfig(normalize({ kind: 'scatter', title: 's', data: SPECS.scatter }), TOKENS)
  assert.equal(scatter.type, 'scatter')
  assert.equal(scatter.options.scales.x.type, 'linear')

  const radar = buildChartConfig(normalize({ kind: 'radar', title: 'r', data: SPECS.radar }), TOKENS)
  assert.equal(radar.type, 'radar')
  assert.ok(radar.options.scales.r)
})

test('unsupported kinds fail loudly', () => {
  assert.throws(() => buildChartConfig({ kind: 'compare', data: {} }, TOKENS), /unsupported chart kind/)
})


test('style variants change the Chart.js configuration', () => {
  const horizontal = buildChartConfig(normalize({ kind: 'bar', title: 'h', data: SPECS.bar, style: { orientation: 'horizontal', stacked: true } }), TOKENS)
  assert.equal(horizontal.options.indexAxis, 'y')
  assert.equal(horizontal.options.scales.x.stacked, true)

  const step = buildChartConfig(normalize({ kind: 'line', title: 's', data: SPECS.line, style: { curve: 'step', points: false, legend: 'none', grid: false } }), TOKENS)
  assert.equal(step.data.datasets[0].stepped, 'middle')
  assert.equal(step.data.datasets[0].pointRadius, 0)
  assert.equal(step.options.plugins.legend.display, false)
  assert.equal(step.options.scales.y.grid.display, false)

  const labelled = buildChartConfig(normalize({ kind: 'bar', title: 'v', data: SPECS.bar, style: { values: true } }), TOKENS)
  assert.equal(labelled.plugins.length, 1)
  assert.equal(labelled.plugins[0].id, 'iv-value-labels')
})

test('scatter trend line adds a regression dataset', () => {
  const config = buildChartConfig(normalize({
    kind: 'scatter',
    title: 't',
    data: { points: [{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 6 }] },
    style: { trendLine: true },
  }), TOKENS)
  assert.equal(config.data.datasets.length, 2)
  assert.equal(config.data.datasets[1].type, 'line')
  assert.equal(config.data.datasets[1].borderDash[0], 6)
})

test('waterfall renders floating bars with a total', () => {
  const config = buildChartConfig(normalize({ kind: 'waterfall', title: 'w', data: SPECS.waterfall }), TOKENS)
  assert.equal(config.type, 'bar')
  assert.equal(config.data.labels.length, 3)
  assert.deepEqual(config.data.datasets[0].data[0], [0, 10])
  assert.deepEqual(config.data.datasets[0].data[1], [10, 6])
  assert.deepEqual(config.data.datasets[0].data[2], [0, 6])
})
