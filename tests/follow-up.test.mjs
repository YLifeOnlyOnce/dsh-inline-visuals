/* SPDX-License-Identifier: MIT */
import test from 'node:test'
import assert from 'node:assert/strict'
import { buildFollowUp } from '../src/client/follow-up.js'

const SPEC = {
  kind: 'bar',
  title: '命中率对比',
  data: { labels: ['LRU', 'LFU'], series: [{ name: 'hit', values: [82, 91] }], unit: '%' },
}

test('follow-up prompt carries label, series and value (zh)', () => {
  const text = buildFollowUp(SPEC, { label: 'LFU', series: 'hit', value: 91 }, 'zh')
  assert.match(text, /命中率对比/)
  assert.match(text, /LFU/)
  assert.match(text, /hit/)
  assert.match(text, /91%/)
})

test('follow-up prompt in English', () => {
  const text = buildFollowUp(SPEC, { label: 'LFU', series: 'hit', value: 91 }, 'en')
  assert.match(text, /In the visual "命中率对比"/)
  assert.match(text, /LFU \(hit\) = 91%/)
})
