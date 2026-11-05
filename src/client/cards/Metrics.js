/* SPDX-License-Identifier: MIT */

import React from 'react'
import { readTokens } from '../theme.js'
import { useThemeVersion } from '../use-theme.js'

const h = React.createElement

const TREND_COLOR = { up: 'success', down: 'error', flat: 'muted' }
const TREND_ARROW = { up: '↑', down: '↓', flat: '→' }

/** KPI tiles: label, large value, optional delta with a semantic trend color. */
export function Metrics({ spec }) {
  useThemeVersion()
  const tokens = readTokens()
  const { items, unit } = spec.data
  const tiles = items.map((item, index) => {
    const trend = item.trend || 'flat'
    const color = tokens[TREND_COLOR[trend]] || tokens.muted
    const delta = item.delta
      ? h('span', {
          style: { color, fontSize: '12px', marginLeft: '6px' },
        }, `${TREND_ARROW[trend]} ${item.delta}`)
      : null
    return h('div', {
      key: `metric-${index}`,
      style: {
        flex: '1 1 140px',
        minWidth: '120px',
        padding: '12px 14px',
        border: `1px solid ${tokens.border}`,
        borderRadius: '10px',
        background: tokens.surfaceMuted,
      },
    },
    h('div', { style: { color: tokens.muted, fontSize: '11px', marginBottom: '6px' } }, item.label),
    h('div', { style: { color: tokens.text, fontSize: '22px', fontWeight: 600, lineHeight: 1.1 } },
      item.value,
      unit ? h('span', { style: { fontSize: '12px', fontWeight: 400, color: tokens.muted, marginLeft: '4px' } }, unit) : null,
      delta))
  })
  return h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '10px' } }, tiles)
}
