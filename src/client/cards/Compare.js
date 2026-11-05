/* SPDX-License-Identifier: MIT */

import React from 'react'
import { readTokens } from '../theme.js'
import { useThemeVersion } from '../use-theme.js'

const h = React.createElement

function cellStyle(tokens, index) {
  return {
    textAlign: index === 0 ? 'left' : 'center',
    padding: '8px 12px',
    fontSize: '13px',
    color: tokens.text,
    borderBottom: `1px solid ${tokens.border}`,
  }
}

/** Comparison table; keeps native table semantics for screen readers. */
export function Compare({ spec }) {
  useThemeVersion()
  const tokens = readTokens()
  const { columns, rows } = spec.data
  const head = columns.map((column, index) => h('th', {
    key: `th-${index}`,
    style: {
      textAlign: index === 0 ? 'left' : 'center',
      padding: '8px 12px',
      fontWeight: 600,
      fontSize: '12px',
      color: tokens.muted,
      borderBottom: `1px solid ${tokens.border}`,
      whiteSpace: 'nowrap',
    },
  }, column))
  const body = rows.map((row, rowIndex) => h('tr', { key: `row-${rowIndex}` },
    columns.map((_, columnIndex) => h('td', {
      key: `cell-${rowIndex}-${columnIndex}`,
      style: {
        ...cellStyle(tokens, columnIndex),
        borderBottom: rowIndex === rows.length - 1 ? 'none' : `1px solid ${tokens.border}`,
      },
    }, row[columnIndex] === undefined ? '' : String(row[columnIndex])))))
  return h('div', { style: { overflowX: 'auto' } },
    h('table', { style: { borderCollapse: 'collapse', width: '100%' } },
      h('thead', null, h('tr', null, head)),
      h('tbody', null, body)))
}
