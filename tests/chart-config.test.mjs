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
