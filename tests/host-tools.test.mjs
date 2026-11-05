/* SPDX-License-Identifier: MIT */
import test from 'node:test'
import assert from 'node:assert/strict'
import * as mod from '../src/host/index.js'

function capture() {
  const tools = new Map()
  const ctx = {
    tools: { register: (definition) => { tools.set(definition.name, definition); return () => {} } },
    effect: (callback) => callback(),
  }
  mod.apply(ctx)
  return tools
}

test('registers show_visual and edit_visual', () => {
  const tools = capture()
  assert.deepEqual([...tools.keys()], ['show_visual', 'edit_visual'])
  assert.ok(tools.get('show_visual').parameters.properties.style, 'show_visual exposes style')
})

test('show_visual normalizes a style-aware spec', async () => {
  const tools = capture()
  const value = await tools.get('show_visual').execute({
    kind: 'bar',
    title: 't',
    data: { labels: ['a'], series: [{ name: 's', values: [1] }] },
    style: { orientation: 'horizontal' },
  })
  assert.equal(value.style.orientation, 'horizontal')
  assert.equal(value.version, 3)
})

test('edit_visual patches the latest visual in the session', async () => {
  const tools = capture()
  const previous = await tools.get('show_visual').execute({
    kind: 'bar',
    title: 'orig',
    data: { labels: ['a'], series: [{ name: 's', values: [1] }] },
  })
  const session = {
    ownEvents: () => [{ type: 'tool/result', data: { message: { source: { callId: 'c1' } }, meta: previous } }],
  }
  const next = await tools.get('edit_visual').execute({ patch: { title: 'changed', style: { stacked: true } } }, { agent: { session } })
  assert.equal(next.title, 'changed')
  assert.equal(next.style.stacked, true)
  assert.deepEqual(next.data, previous.data)
})

test('edit_visual rejects when there is nothing to edit', async () => {
  const tools = capture()
  const session = { ownEvents: () => [] }
  await assert.rejects(
    () => tools.get('edit_visual').execute({ patch: { title: 'x' } }, { agent: { session } }),
    /no previous visual/,
  )
})
