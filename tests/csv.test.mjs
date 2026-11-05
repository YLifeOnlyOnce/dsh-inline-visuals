/* SPDX-License-Identifier: MIT */
import test from 'node:test'
import assert from 'node:assert/strict'
import { normalize } from '../src/host/normalize.js'
import { toCsv } from '../src/client/csv.js'

const csv = (input) => toCsv(normalize(input))

test('series, compare and heatmap serialize to CSV', () => {
  const bar = csv({ kind: 'bar', title: 'b', data: { labels: ['a', 'b'], series: [{ name: 's', values: [1, 2] }] } })
  assert.equal(bar, 'label,s\n"a",1\n"b",2'.replace(/"/g, ''))

  const compare = csv({ kind: 'compare', title: 'c', data: { columns: ['x', 'y'], rows: [['1', '2']] } })
  assert.match(compare, /^x,y\n1,2$/m)

  const heatmap = csv({ kind: 'heatmap', title: 'h', data: { rows: ['r1'], columns: ['c1', 'c2'], values: [[3, 4]] } })
  assert.equal(heatmap, 'row,c1,c2\nr1,3,4')
})

test('waterfall, timeline, gantt, metrics, flow and scatter serialize', () => {
  assert.match(csv({ kind: 'waterfall', title: 'w', data: { labels: ['a'], values: [5] } }), /label,delta,cumulative\na,5,5/)
  assert.match(csv({ kind: 'timeline', title: 't', data: { items: [{ at: 'T', label: 'L', detail: 'D' }] } }), /at,label,detail\nT,L,D/)
  assert.match(csv({ kind: 'gantt', title: 'g', data: { tasks: [{ label: 'a', start: 1, end: 3 }] } }), /label,start,end\na,1,3/)
  assert.match(csv({ kind: 'metrics', title: 'm', data: { items: [{ label: 'p', value: 1, trend: 'up' }] } }), /p,1,,up/)
  assert.match(csv({ kind: 'flow', title: 'f', data: { nodes: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], edges: [{ from: 'a', to: 'b' }] } }), /from,to,label\na,b,/)
  assert.match(csv({ kind: 'scatter', title: 's', data: { points: [{ x: 1, y: 2 }] } }), /x,y,label\n1,2,/)
})
