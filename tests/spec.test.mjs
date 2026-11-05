/* SPDX-License-Identifier: MIT */
import test from 'node:test'
import assert from 'node:assert/strict'
import { isSupportedSpec } from '../src/client/spec.js'

const base = { kind: 'bar', title: 't', data: { labels: ['a'], series: [] } }

test('accepts every current and historical spec version', () => {
  for (const version of [1, 2, 3]) {
    assert.equal(isSupportedSpec({ ...base, version }), true, `v${version}`)
  }
})

test('rejects values that are not visual specs', () => {
  assert.equal(isSupportedSpec(undefined), false)
  assert.equal(isSupportedSpec(null), false)
  assert.equal(isSupportedSpec({}), false)
  assert.equal(isSupportedSpec({ ...base }), false)
  assert.equal(isSupportedSpec({ ...base, version: 0 }), false)
  assert.equal(isSupportedSpec({ ...base, version: '3' }), false)
  assert.equal(isSupportedSpec({ version: 3, kind: 'bar' }), false)
})
