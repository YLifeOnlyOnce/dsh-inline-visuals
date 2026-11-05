/* SPDX-License-Identifier: MIT */
import test from 'node:test'
import assert from 'node:assert/strict'
import { KINDS, LIMITS } from '../src/host/limits.js'
import { normalize } from '../src/host/normalize.js'

const SPECS = {
  bar: { labels: ['A', 'B'], series: [{ name: 's', values: [1, 2] }], unit: '%' },
  line: { labels: ['A', 'B'], series: [{ name: 's', values: [1, 2] }] },
  area: { labels: ['A'], series: [{ name: 's', values: [3] }], unit: 'ms' },
  radar: { labels: ['A', 'B', 'C'], series: [{ name: 's', values: [1, 2, 3] }] },
  pie: { slices: [{ label: 'x', value: 3 }, { label: 'y', value: 1 }], unit: 'GB' },
  doughnut: { slices: [{ label: 'x', value: 3 }] },
  scatter: { points: [{ x: 1, y: 2 }, { x: 2, y: 4, label: 'p' }], xLabel: 'in', yLabel: 'out' },
  compare: { columns: ['a', 'b'], rows: [['1', '2']] },
  timeline: { items: [{ label: 'start' }, { at: 'T+1', label: 'fix', detail: 'done' }] },
  gantt: { tasks: [{ label: 'a', start: 0, end: 2 }, { label: 'b', start: 1, end: 4 }], unit: 'h' },
  metrics: { items: [{ label: 'p95', value: 120, delta: '12ms', trend: 'up' }], unit: 'ms' },
  waterfall: { labels: ['收入', '成本'], values: [100, -30], unit: 'k' },
  heatmap: { rows: ['a', 'b'], columns: ['x', 'y'], values: [[1, 2], [3, 4]] },
  flow: { nodes: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], edges: [{ from: 'a', to: 'b' }] },
}

const roundTrip = (value) => JSON.parse(JSON.stringify(value))

test('every kind normalizes to a lossless version 3 spec', () => {
  for (const kind of KINDS) {
    const value = normalize({ kind, title: kind, data: SPECS[kind] })
    assert.equal(value.version, 3)
    assert.equal(value.kind, kind)
    assert.equal(value.title, kind)
    assert.deepEqual(roundTrip(value), value, `${kind} must be lossless JSON`)
  }
})

test('optional fields are omitted rather than set to undefined', () => {
  const value = normalize({ kind: 'timeline', title: 't', data: { items: [{ label: 'a' }] } })
  assert.equal('at' in value.data.items[0], false)
  assert.equal('detail' in value.data.items[0], false)
  const bar = normalize({ kind: 'bar', title: 'b', data: SPECS.bar })
  assert.equal('unit' in bar.data, true)
  const line = normalize({ kind: 'line', title: 'l', data: SPECS.line })
  assert.equal('unit' in line.data, false)
})

test('upper bounds clip instead of failing', () => {
  const big = normalize({
    kind: 'bar',
    title: 'big',
    data: {
      labels: Array.from({ length: 99 }, (_, i) => `L${i}`),
      series: [{ name: 's', values: Array.from({ length: 99 }, (_, i) => i) }],
    },
  })
  assert.equal(big.data.labels.length, LIMITS.labels)
  assert.equal(big.data.series[0].values.length, LIMITS.labels)

  const slices = normalize({
    kind: 'pie',
    title: 'p',
    data: { slices: Array.from({ length: 99 }, (_, i) => ({ label: `S${i}`, value: i })) },
  })
  assert.equal(slices.data.slices.length, LIMITS.slices)

  const tasks = normalize({
    kind: 'gantt',
    title: 'g',
    data: { tasks: Array.from({ length: 99 }, (_, i) => ({ label: `T${i}`, start: i, end: i + 1 })) },
  })
  assert.equal(tasks.data.tasks.length, LIMITS.tasks)

  const metrics = normalize({
    kind: 'metrics',
    title: 'm',
    data: { items: Array.from({ length: 99 }, (_, i) => ({ label: `M${i}`, value: i })) },
  })
  assert.equal(metrics.data.items.length, LIMITS.metrics)

  const scatter = normalize({
    kind: 'scatter',
    title: 's',
    data: { points: Array.from({ length: 999 }, (_, i) => ({ x: i, y: i })) },
  })
  assert.equal(scatter.data.points.length, LIMITS.points)
})

test('invalid input rejects with a readable message', () => {
  assert.throws(() => normalize({ kind: 'pie', title: 'x', data: { slices: [] } }), /must not be empty|needs a `slices`/)
  assert.throws(() => normalize({ kind: 'nope', title: 'x', data: {} }), /kind must be one of/)
  assert.throws(() => normalize({ kind: 'gantt', title: 'g', data: { tasks: [{ label: 'a', start: 3, end: 1 }] } }), /end must be >= start/)
  assert.throws(() => normalize({ kind: 'bar', title: 'b', data: { labels: [], series: [] } }), /must not be empty/)
  assert.throws(() => normalize(null), /expects one object/)
})

test('flow rejects cycles and unknown node references', () => {
  const nodes = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]
  assert.throws(
    () => normalize({ kind: 'flow', title: 'f', data: { nodes, edges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'a' }] } }),
    /must form a DAG/,
  )
  assert.throws(
    () => normalize({ kind: 'flow', title: 'f', data: { nodes, edges: [{ from: 'a', to: 'missing' }] } }),
    /unknown node/,
  )
  assert.throws(
    () => normalize({ kind: 'flow', title: 'f', data: { nodes: [{ id: 'a', label: 'A' }, { id: 'a', label: 'A2' }], edges: [] } }),
    /ids must be unique/,
  )
})

test('style defaults fill in and invalid values reject', () => {
  const value = normalize({ kind: 'bar', title: 't', data: SPECS.bar })
  assert.equal(value.style.palette, 'default')
  assert.equal(value.style.legend, 'auto')
  assert.equal(value.style.height, 240)
  assert.equal(value.style.orientation, 'vertical')

  const styled = normalize({
    kind: 'bar',
    title: 't',
    data: SPECS.bar,
    style: { orientation: 'horizontal', stacked: true, values: true, height: 999, palette: 'warm' },
  })
  assert.equal(styled.style.orientation, 'horizontal')
  assert.equal(styled.style.stacked, true)
  assert.equal(styled.style.values, true)
  assert.equal(styled.style.height, 420, 'height is clamped')
  assert.equal(styled.style.palette, 'warm')

  assert.throws(() => normalize({ kind: 'bar', title: 't', data: SPECS.bar, style: { orientation: 'diagonal' } }), /style.orientation/)
  assert.throws(() => normalize({ kind: 'bar', title: 't', data: SPECS.bar, style: { palette: 'neon' } }), /style.palette/)
  assert.throws(() => normalize({ kind: 'bar', title: 't', data: SPECS.bar, style: { height: 'tall' } }), /style.height/)
})
