/* SPDX-License-Identifier: MIT */

import React from 'react'
import { readTokens } from '../theme.js'
import { useThemeVersion } from '../use-theme.js'

const h = React.createElement

const TONE_TOKEN = { default: 'border', success: 'success', warn: 'warn', error: 'error' }

function Card({ card, tokens }) {
  return h('div', {
    style: {
      background: tokens.surface,
      border: `1px solid ${tokens.border}`,
      borderLeft: `3px solid ${tokens[TONE_TOKEN[card.tone ?? 'default']] ?? tokens.border}`,
      borderRadius: '8px',
      padding: '8px',
      marginBottom: '6px',
    },
  },
  h('div', { style: { color: tokens.text, fontSize: '12.5px', fontWeight: 500, lineHeight: 1.3 } }, card.title),
  card.detail
    ? h('div', { style: { color: tokens.muted, fontSize: '11px', marginTop: '3px' } }, card.detail)
    : null,
  card.tags && card.tags.length > 0
    ? h('div', { style: { display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '5px' } },
        card.tags.map((tag, index) => h('span', {
          key: index,
          style: { fontSize: '10px', padding: '1px 6px', borderRadius: '999px', background: tokens.surfaceMuted, color: tokens.muted },
        }, tag)))
    : null)
}

/** Kanban board: columns of cards with optional tags and semantic tone. */
export function Kanban({ spec }) {
  useThemeVersion()
  const tokens = readTokens()
  return h('div', {
    style: { display: 'flex', gap: '10px', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: '2px' },
  }, spec.data.columns.map((column, columnIndex) => h('div', {
    key: columnIndex,
    style: { flex: '0 0 180px', minWidth: '150px', background: tokens.surfaceMuted, borderRadius: '10px', padding: '8px' },
  },
  h('div', {
    style: { display: 'flex', justifyContent: 'space-between', color: tokens.muted, fontSize: '11px', marginBottom: '6px' },
  }, h('span', null, column.title), h('span', null, String(column.cards.length))),
  column.cards.length === 0
    ? h('div', { style: { color: tokens.muted, fontSize: '11px', padding: '6px 2px' } }, '—')
    : column.cards.map((card, cardIndex) => h(Card, { key: cardIndex, card, tokens })))))
}
