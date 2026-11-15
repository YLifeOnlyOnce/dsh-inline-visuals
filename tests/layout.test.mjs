/* SPDX-License-Identifier: MIT */
import test from 'node:test'
import assert from 'node:assert/strict'
import { layoutSankey, layoutTree } from '../src/client/layout.js'

test('sankey layers follow longest paths and values aggregate links', () => {
  const nodes = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }, { id: 'd', label: 'D' }]
  const links = [
    { from: 'a', to: 'b', value: 5 },
    { from: 'a', to: 'c', value: 3 },
    { from: 'b', to: 'd', value: 4 },
    { from: 'c', to: 'd', value: 3 },
  ]
  const layers = layoutSankey(nodes, links)
  assert.equal(layers.length, 3)
  assert.deepEqual(layers[0].map((node) => node.id), ['a'])
  assert.deepEqual(layers[1].map((node) => node.id).sort(), ['b', 'c'])
  assert.deepEqual(layers[2].map((node) => node.id), ['d'])
  assert.equal(layers[0][0].value, 8)
  assert.equal(layers[2][0].value, 7)
  assert.equal(layers[1].find((node) => node.id === 'b').value, 5)
})

test('sankey keeps disconnected sources at layer zero', () => {
  const layers = layoutSankey([{ id: 'x', label: 'X' }, { id: 'y', label: 'Y' }], [])
  assert.equal(layers.length, 1)
  assert.deepEqual(layers[0].map((node) => node.id).sort(), ['x', 'y'])
})

test('tree leaves are consecutive and parents center over children', () => {
  const root = {
    label: 'root',
    children: [
      { label: 'a', children: [{ label: 'a1' }, { label: 'a2' }] },
      { label: 'b' },
    ],
  }
  const { nodes, leaves, maxDepth } = layoutTree(root)
  assert.equal(leaves, 3)
  assert.equal(maxDepth, 2)
  const byLabel = new Map(nodes.map((node) => [node.label, node]))
  assert.equal(byLabel.get('a1').x, 0)
  assert.equal(byLabel.get('a2').x, 1)
  assert.equal(byLabel.get('b').x, 2)
  assert.equal(byLabel.get('a').x, 0.5)
  assert.equal(byLabel.get('root').x, 1.25)
  assert.equal(byLabel.get('a1').parent, 'a')
  assert.equal(byLabel.get('root').parent, null)
})
