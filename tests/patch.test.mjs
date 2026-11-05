/* SPDX-License-Identifier: MIT */
import test from 'node:test'
import assert from 'node:assert/strict'
import { applyPatch } from '../src/host/patch.js'

const SPEC = {
  version: 3,
  kind: 'bar',
  title: 't',
  style: { palette: 'default', orientation: 'vertical', stacked: false },
  data: { labels: ['a', 'b'], series: [{ name: 's', values: [1, 2] }] },
}

test('nested objects merge and arrays replace', () => {
  const next = applyPatch(SPEC, {
    style: { orientation: 'horizontal' },
    data: { labels: ['x', 'y', 'z'] },
  })
  assert.equal(next.style.orientation, 'horizontal')
  assert.equal(next.style.palette, 'default')
  assert.deepEqual(next.data.labels, ['x', 'y', 'z'])
  assert.deepEqual(next.data.series, SPEC.data.series, 'untouched fields survive')
  assert.equal(SPEC.style.orientation, 'vertical', 'previous spec is not mutated')
})

test('null deletes a key and scalars replace', () => {
  const next = applyPatch(SPEC, { title: 'new', style: { stacked: null } })
  assert.equal(next.title, 'new')
  assert.equal('stacked' in next.style, false)
})

test('invalid patches reject', () => {
  assert.throws(() => applyPatch(SPEC, null), /patch must be an object/)
  assert.throws(() => applyPatch(null, {}), /previous visual spec/)
})
