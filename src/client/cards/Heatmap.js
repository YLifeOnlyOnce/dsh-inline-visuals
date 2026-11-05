/* SPDX-License-Identifier: MIT */

import React from 'react'
import { fmt } from '../format.js'
import { palette, readTokens, toAlpha } from '../theme.js'
import { useThemeVersion } from '../use-theme.js'

const h = React.createElement

/** Matrix heatmap: color intensity from the accent palette, value text inside cells. */
export function Heatmap({ spec }) {
  useThemeVersion()
  const tokens = readTokens()
  const { rows, columns, values, unit } = spec.data
  if (rows.length === 0 || columns.length === 0) return null

  const W = 640
  const labelW = 104
  const headerH = 26
  const cellH = 26
  const cellW = (W - labelW - 8) / columns.length
  const H = headerH + rows.length * cellH + 8
  const flat = values.flat()
  const max = Math.max(...flat, 0)
  const min = Math.min(...flat, 0)
  const span = max - min || 1
  const base = palette(tokens, spec.style?.palette ?? 'default')[0]

  const header = columns.map((column, index) => h('text', {
    key: `col-${index}`,
    x: labelW + cellW * (index + 0.5),
    y: 17,
    textAnchor: 'middle',
    fill: tokens.muted,
    fontSize: 10,
  }, column.length > 10 ? `${column.slice(0, 9)}…` : column))

  const rowLabels = rows.map((row, index) => h('text', {
    key: `row-${index}`,
    x: labelW - 10,
    y: headerH + cellH * index + 17,
    textAnchor: 'end',
    fill: tokens.text,
    fontSize: 11,
  }, row.length > 14 ? `${row.slice(0, 13)}…` : row))

  const cells = rows.flatMap((row, rowIndex) => columns.map((_, columnIndex) => {
    const value = values[rowIndex]?.[columnIndex] ?? 0
    const ratio = (value - min) / span
    const fill = toAlpha(base, 0.08 + ratio * 0.82)
    const color = ratio > 0.55 ? '#ffffff' : tokens.text
    return h('g', { key: `cell-${rowIndex}-${columnIndex}` },
      h('rect', {
        x: labelW + cellW * columnIndex + 1,
        y: headerH + cellH * rowIndex + 1,
        width: cellW - 2,
        height: cellH - 2,
        rx: 3,
        fill,
      }),
      h('text', {
        x: labelW + cellW * (columnIndex + 0.5),
        y: headerH + cellH * rowIndex + 17,
        textAnchor: 'middle',
        fill: color,
        fontSize: 10,
      }, fmt(value, unit)),
      h('title', null, `${row} × ${columns[columnIndex]}: ${fmt(value, unit)}`))
  }))

  return h('svg', {
    viewBox: `0 0 ${W} ${H}`,
    width: '100%',
    role: 'img',
    'aria-label': `${spec.title} (heatmap)`,
  }, header, rowLabels, cells)
}
