/* SPDX-License-Identifier: MIT */

import React from 'react'
import { readTokens } from '../theme.js'
import { useThemeVersion } from '../use-theme.js'

const h = React.createElement

/** Vertical timeline / step list. */
export function Timeline({ spec }) {
  useThemeVersion()
  const tokens = readTokens()
  const { items } = spec.data
  if (items.length === 0) return null
  const rows = items.map((item, index) => {
    const dot = h('span', {
      style: {
        flex: '0 0 auto',
        marginTop: '6px',
        width: '9px',
        height: '9px',
        borderRadius: '50%',
        background: index === items.length - 1 ? tokens.accent : tokens.idle,
      },
    })
    const at = h('span', {
      style: {
        flex: '0 0 auto',
        minWidth: '56px',
        color: tokens.muted,
        fontSize: '12px',
        fontVariantNumeric: 'tabular-nums',
      },
    }, item.at || '')
    const label = h('span', { style: { display: 'block', color: tokens.text, fontSize: '13px' } }, item.label)
    const detail = item.detail
      ? h('span', { style: { display: 'block', color: tokens.muted, fontSize: '12px', marginTop: '2px' } }, item.detail)
      : null
    return h('li', {
      key: `item-${index}`,
      style: {
        display: 'flex',
        gap: '12px',
        padding: '8px 0',
        borderBottom: index === items.length - 1 ? 'none' : `1px solid ${tokens.border}`,
      },
    }, dot, at, h('span', { style: { flex: '1 1 auto', minWidth: 0 } }, label, detail))
  })
  return h('ol', { style: { listStyle: 'none', margin: 0, padding: 0 } }, rows)
}
