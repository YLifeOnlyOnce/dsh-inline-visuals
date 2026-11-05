/**
 * Deterministic checks for the `show_visual` host half. Run with:
 *   node tests/normalize.test.mjs
 * No test framework or dependencies: the module is plain ESM.
 */
import * as mod from '../index.js'

let definition
const ctx = {
  tools: { register: (candidate) => { definition = candidate; return () => {} } },
  effect: (callback) => callback(),
}

mod.apply(ctx)
if (!definition || definition.name !== 'show_visual') throw new Error('show_visual was not registered')

const lossless = (value) => {
  const round = JSON.parse(JSON.stringify(value))
  if (JSON.stringify(round) !== JSON.stringify(value)) throw new Error('value is not lossless JSON: ' + JSON.stringify(value))
  return round
}

// Optional fields must not leave `undefined` behind: the registry rejects non-lossless JSON.
let value = await definition.execute({ kind: 'timeline', title: 't', data: { items: [{ label: 'a' }, { label: 'b' }] } })
lossless(value)
value = lossless(await definition.execute({ kind: 'bar', title: 'b', data: { labels: ['x'], series: [{ name: 's', values: [1] }] } }))
value = lossless(await definition.execute({ kind: 'compare', title: 'c', data: { columns: ['a', 'b'], rows: [['1', '2']] } }))
value = lossless(await definition.execute({ kind: 'line', title: 'l', data: { labels: ['x'], series: [{ name: 's', values: [1] }], unit: '%' } }))

// Clipping keeps meta small.
value = lossless(await definition.execute({
  kind: 'bar',
  title: 'many',
  data: { labels: Array.from({ length: 99 }, (_, i) => 'L' + i), series: [{ name: 's', values: Array.from({ length: 99 }, (_, i) => i) }] },
}))
if (value.data.labels.length !== 40) throw new Error('labels were not clipped')
if (value.data.series[0].values.length !== 40) throw new Error('values were not clipped')

// Unknown kinds reject with a readable message.
let rejected = false
try {
  await definition.execute({ kind: 'pie', title: 'x', data: {} })
} catch (error) {
  rejected = /kind must be one of/.test(String(error.message))
}
if (!rejected) throw new Error('unknown kind was not rejected')

// Contract: meta projection preserves the value; render returns model-facing text.
const meta = definition.output.presentationMeta(null, value)
if (JSON.stringify(meta) !== JSON.stringify(value)) throw new Error('presentationMeta changed the value')
const blocks = definition.output.render(null, value)
if (!Array.isArray(blocks) || blocks[0].type !== 'text' || !blocks[0].text.includes('bar')) {
  throw new Error('render returned unexpected content blocks')
}

console.log('normalize.test.mjs: all checks passed')
