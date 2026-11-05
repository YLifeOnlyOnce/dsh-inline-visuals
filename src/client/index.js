/* SPDX-License-Identifier: MIT */

import React from 'react'
import { InlineVisual } from './cards/InlineVisual.js'
import { COPY, NS, fallbackCopy } from './locale.js'
import { visualTurnDefinition } from './turn.js'
import { TurnVisual } from './turn-card.js'

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
  inject: ['slots', 'locale', 'uiConversation'],
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
    const localeCode = translate('copy') === COPY.zh.copy ? 'zh' : 'en'
    const View = (props) => h(Boundary, null, h(InlineVisual, Object.assign({}, props, { t: translate, localeCode })))
    ctx.slots.inject('tool.call.toolview', () => {
      // show_visual renders a new visual; edit_visual renders the patched one.
      const disposers = ['show_visual', 'edit_visual'].map((key) => ctx.slots.register({
        name: 'tool.call.toolview',
        key,
      }, View))
      return () => {
        for (const dispose of disposers) dispose?.()
      }
    })

    // Publish settled visuals per Turn and render the final one in the answer
    // body (turn tail), so figures are visible outside the collapsible Tool group.
    ctx.effect(() => ctx.uiConversation.events.register(visualTurnDefinition()), 'inline-visuals: turn definition')
    ctx.slots.inject('conversation.chat.turnTail', () => ctx.slots.register({
      name: 'conversation.chat.turnTail',
      id: 'inline-visuals',
      order: 30,
      locale: NS,
    }, TurnVisual))
  },
}

export default plugin
