/* SPDX-License-Identifier: MIT */
import test from 'node:test'
import assert from 'node:assert/strict'
import { findPreviousSpec } from '../src/host/history.js'

const META = { version: 3, kind: 'bar', title: 't', data: { labels: ['a'], series: [] } }

function event(callId, meta) {
  return { type: 'tool/result', data: { message: { source: { kind: 'tool', callId } }, meta } }
}

test('finds the latest visual spec and supports call ids', () => {
  const session = {
    ownEvents: () => [
      { type: 'turn/start', data: {} },
      event('first', META),
      { type: 'tool/result', data: { message: { source: { callId: 'other' } }, meta: { kind: 'table' } } },
      event('second', { ...META, kind: 'line' }),
    ],
  }
  assert.equal(findPreviousSpec(session, undefined).kind, 'line')
  assert.equal(findPreviousSpec(session, 'last').kind, 'line')
  assert.equal(findPreviousSpec(session, 'first').kind, 'bar')
  assert.equal(findPreviousSpec(session, 'missing'), undefined)
})

test('tolerates empty or unusual sessions', () => {
  assert.equal(findPreviousSpec(undefined), undefined)
  assert.equal(findPreviousSpec({ events: [] }, 'last'), undefined)
  assert.equal(findPreviousSpec({ ownEvents: () => [] }, 'last'), undefined)
})


test('flow specs are found like any other kind', () => {
  const flow = { version: 3, kind: 'flow', title: 'f', data: { nodes: [{ id: 'a', label: 'A' }], edges: [] } }
  const session = { ownEvents: () => [event('c1', flow)] }
  assert.equal(findPreviousSpec(session, 'last').kind, 'flow')
})
