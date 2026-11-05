/* SPDX-License-Identifier: MIT */

import React from 'react'
import { InlineVisual } from './cards/InlineVisual.js'
import { COPY } from './locale.js'
import { VISUAL_TURN_KIND, latestTurnVisual } from './turn.js'

const h = React.createElement

/**
 * Turn-tail entry: renders the Turn's final visual beneath the answer prose,
 * so the figure is part of the reply body rather than only the Tool group.
 */
export function TurnVisual(props) {
  const translate = typeof props.t === 'function' ? props.t : (key) => COPY.en[key] || key
  const data = props.turn?.data?.get?.(VISUAL_TURN_KIND)
  const bound = props.turn?.end?.seq ?? props.seq ?? Number.POSITIVE_INFINITY
  const latest = latestTurnVisual(data, bound)
  if (latest === undefined) return null
  const localeCode = translate('copy') === COPY.zh.copy ? 'zh' : 'en'
  return h('div', { style: { marginTop: '10px' } }, h(InlineVisual, {
    phase: 'result',
    block: { meta: latest.spec },
    t: translate,
    localeCode,
    inputActions: props.inputActions,
  }))
}
