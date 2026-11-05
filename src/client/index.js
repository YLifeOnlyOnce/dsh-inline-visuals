/* SPDX-License-Identifier: MIT */

import React from 'react'
import { InlineVisual } from './cards/InlineVisual.js'
import { COPY, NS, fallbackCopy } from './locale.js'

const h = React.createElement

/** Keep one crashing card from blanking the whole chat row. */
class Boundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return h('div', {
        style: {
          border: '1px solid var(--dsw-alias-state-error-primary)',
          borderRadius: '10px',
          padding: '12px 14px',
          color: 'var(--dsw-alias-state-error-primary)',
          fontSize: '12px',
        },
      }, `inline-visuals: ${String(this.state.error?.message ?? this.state.error)}`)
    }
    return this.props.children
  }
}

const plugin = {
  inject: ['slots', 'locale'],
  apply(ctx) {
    let translate = ((copy = fallbackCopy()) => (key) => copy[key] || key)()
    try {
      ctx.effect(() => ctx.locale.register(NS, { zh: COPY.zh, en: COPY.en }), 'inline-visuals: copy')
      const bound = ctx.locale.bind(NS)
      translate = (key) => {
        const value = bound(key)
        return typeof value === 'string' && value.length > 0 ? value : key
      }
    } catch (error) {
      console.warn('inline-visuals: locale unavailable, using browser language', error)
    }
    const View = (props) => h(Boundary, null, h(InlineVisual, Object.assign({}, props, { t: translate })))
    ctx.slots.inject('tool.call.toolview', () => ctx.slots.register({
      name: 'tool.call.toolview',
      key: 'show_visual',
    }, View))
  },
}

export default plugin
