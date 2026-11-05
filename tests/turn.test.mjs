/* SPDX-License-Identifier: MIT */
import test from 'node:test'
import assert from 'node:assert/strict'
import { visualTurnDefinition, latestTurnVisual } from '../src/client/turn.js'

const META = { version: 3, kind: 'bar', title: 't', data: { labels: ['a'], series: [] } }

function event(type, data, seq = 1, surfaceOp) {
  return { type, seq, time: 0, data, ...(surfaceOp === undefined ? {} : { surfaceOp }) }
}

test('turn definition matches turn boundaries and append tool results only', () => {
  const definition = visualTurnDefinition()
  assert.deepEqual(definition.match(event('turn/start', { turn: 2 })), { id: '2', role: 'start' })
  assert.deepEqual(
    definition.match(event('tool/result', { turn: 2, message: { source: { callId: 'c' }, isError: false }, meta: META }, 5, 'append')),
    { id: '2', role: 'update' },
  )
  assert.equal(definition.match(event('tool/result', { turn: 2, message: {} , meta: META }, 5)), null)
  assert.equal(definition.match(event('assistant/message', { turn: 2 }, 6, 'append')), null)
})

test('turn definition records settled visuals and rejects errors/non-visuals', () => {
  const definition = visualTurnDefinition()
  const context = { state: definition.start({}, { event: event('turn/start', { turn: 1 }) }) }
  context.state = definition.update(context, {
    event: event('tool/result', { turn: 1, message: { source: { callId: 'a' }, isError: false }, meta: META }, 4, 'append'),
  })
  context.state = definition.update(context, {
    event: event('tool/result', { turn: 1, message: { source: { callId: 'b' }, isError: true }, meta: META }, 5, 'append'),
  })
  context.state = definition.update(context, {
    event: event('tool/result', { turn: 1, message: { source: { callId: 'c' }, isError: false }, meta: { kind: 'text' } }, 6, 'append'),
  })
  assert.equal(context.state.visuals.length, 1)
  assert.equal(context.state.visuals[0].seq, 4)
  const location = definition.buildLocationData(context, 'turn', undefined)
  assert.equal(location.kind, 'turn')
  assert.equal(location.turn, 1)
  assert.equal(location.value.visuals.length, 1)
})

test('latestTurnVisual honours the closing bound and collapses edits', () => {
  const data = { visuals: [{ seq: 2, spec: META }, { seq: 7, spec: { ...META, title: 'edited' } }] }
  assert.equal(latestTurnVisual(data, 6).spec.title, 't')
  assert.equal(latestTurnVisual(data, 8).spec.title, 'edited')
  assert.equal(latestTurnVisual(undefined, 8), undefined)
  assert.equal(latestTurnVisual({ visuals: [] }, 8), undefined)
})
