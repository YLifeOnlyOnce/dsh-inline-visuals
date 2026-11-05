/* SPDX-License-Identifier: MIT */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

/**
 * Smoke test for the generated browser artifact: evaluate client.js in a VM with a stub
 * module loader, then call the plugin's apply() against a stub client context. This catches
 * a broken build wrapper (wrong export shape, missing loader id, unresolved imports) without
 * needing a browser.
 */
test('client.js registers the tool view through the Harness module loader', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  let captured = null
  const window = {
    __ModuleLoader__: {
      load({ id, factory }) {
        captured = { id, factory }
      },
    },
  }
  const sandbox = { window, console, setTimeout, clearTimeout }
  vm.createContext(sandbox)
  vm.runInContext(source, sandbox, { filename: 'client.js' })

  assert.ok(captured, 'client.js must call window.__ModuleLoader__.load')
  assert.equal(captured.id, 'dsh-inline-visuals')

  const react = {
    createElement: (...args) => ({ args }),
    useState: (initial) => [initial, () => {}],
    useEffect: () => {},
    useRef: (value) => ({ current: value }),
    Component: class {
      constructor(props) { this.props = props; this.state = {} }
      static getDerivedStateFromError() { return { error: new Error('boom') } }
      render() { return this.props.children }
    },
  }
  const exported = captured.factory((name) => {
    if (name === 'react') return react
    throw new Error(`unexpected external require: ${name}`)
  })
  assert.equal(typeof exported.apply, 'function')
  assert.deepEqual(Array.from(exported.inject), ['slots', 'locale'])

  const views = []
  const ctx = {
    effect: (fn) => fn(),
    locale: { register: () => () => {}, bind: () => (key) => key },
    slots: {
      inject: (key, callback) => {
        assert.equal(key, 'tool.call.toolview')
        const disposer = callback()
        assert.equal(typeof disposer, 'function')
      },
      register: (options) => {
        views.push(options.key)
        return () => {}
      },
    },
  }
  exported.apply(ctx)
  assert.deepEqual(views, ['show_visual', 'edit_visual'])
})
