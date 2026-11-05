/* SPDX-License-Identifier: MIT */

import React from 'react'
import { fmt } from '../format.js'
import { readTokens } from '../theme.js'
import { useThemeVersion } from '../use-theme.js'

const h = React.createElement

function bestValues(metrics, rows) {
  return metrics.map((metric, index) => {
    const values = rows.map((row) => row.values[index] ?? 0)
    return metric.better === 'down' ? Math.min(...values) : Math.max(...values)
  })
}

/** Model/metric leaderboard: best value per metric is highlighted. */
export function Leaderboard({ spec }) {
  useThemeVersion()
  const tokens = readTokens()
  const { metrics, rows } = spec.data
  const best = bestValues(metrics, rows)

  const head = [
    h('th', {
      key: 'model',
      style: { textAlign: 'left', padding: '8px 10px', color: tokens.muted, fontSize: '11px', borderBottom: `1px solid ${tokens.border}` },
    }, 'model'),
    ...metrics.map((metric, index) => h('th', {
      key: `metric-${index}`,
      style: { textAlign: 'center', padding: '8px 10px', color: tokens.muted, fontSize: '11px', borderBottom: `1px solid ${tokens.border}`, whiteSpace: 'nowrap' },
    }, `${metric.label}${metric.unit ? ` (${metric.unit})` : ''}${metric.better === 'down' ? ' ↓' : ' ↑'}`)),
  ]

  const body = rows.map((row, rowIndex) => h('tr', { key: `row-${rowIndex}` },
    h('td', {
      style: { textAlign: 'left', padding: '8px 10px', fontSize: '12.5px', color: tokens.text, borderBottom: rowIndex === rows.length - 1 ? 'none' : `1px solid ${tokens.border}` },
    }, row.name),
    ...metrics.map((metric, index) => {
      const value = row.values[index] ?? 0
      const isBest = value === best[index]
      return h('td', {
        key: `cell-${rowIndex}-${index}`,
        style: {
          textAlign: 'center',
          padding: '8px 10px',
          fontSize: '12.5px',
          fontVariantNumeric: 'tabular-nums',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          color: isBest ? tokens.success : tokens.text,
          fontWeight: isBest ? 600 : 400,
          borderBottom: rowIndex === rows.length - 1 ? 'none' : `1px solid ${tokens.border}`,
        },
      }, fmt(value, metric.unit))
    })))

  return h('div', { style: { overflowX: 'auto' } },
    h('table', { style: { borderCollapse: 'collapse', width: '100%' } },
      h('thead', null, h('tr', null, head)),
      h('tbody', null, body)))
}
