/* SPDX-License-Identifier: MIT */

import React from 'react'
import { fmt } from '../format.js'
import { palette, readTokens, toAlpha } from '../theme.js'
import { useThemeVersion } from '../use-theme.js'

const h = React.createElement

/** Confusion matrix: row-normalized color, diagonal highlighted, accuracy in the caption. */
export function Confusion({ spec }) {
  useThemeVersion()
  const tokens = readTokens()
  const { labels, matrix } = spec.data
  const n = labels.length
  if (n === 0) return null

  const W = 560
  const labelW = 96
  const headerH = 26
  const cell = Math.min(46, (W - labelW - 8) / n)
  const H = headerH + n * cell + 10
  const base = palette(tokens, spec.style?.palette ?? 'default')[0]
  const total = matrix.flat().reduce((sum, value) => sum + value, 0)
  const correct = matrix.reduce((sum, row, index) => sum + (row[index] ?? 0), 0)
  const accuracy = total > 0 ? Math.round((correct / total) * 1000) / 10 : 0

  const header = labels.map((label, index) => h('text', {
    key: `col-${index}`,
    x: labelW + cell * (index + 0.5),
    y: 17,
    textAnchor: 'middle',
    fill: tokens.muted,
    fontSize: 10,
  }, label.length > 8 ? `${label.slice(0, 7)}…` : label))

  const rowLabels = labels.map((label, index) => h('text', {
    key: `row-${index}`,
    x: labelW - 10,
    y: headerH + cell * index + cell / 2 + 4,
    textAnchor: 'end',
    fill: tokens.text,
    fontSize: 11,
  }, label.length > 12 ? `${label.slice(0, 11)}…` : label))

  const cells = matrix.flatMap((row, rowIndex) => row.map((value, columnIndex) => {
    const rowTotal = row.reduce((sum, entry) => sum + entry, 0)
    const share = rowTotal > 0 ? value / rowTotal : 0
    const diagonal = rowIndex === columnIndex
    return h('g', { key: `cell-${rowIndex}-${columnIndex}` },
      h('rect', {
        x: labelW + cell * columnIndex + 1,
        y: headerH + cell * rowIndex + 1,
        width: cell - 2,
        height: cell - 2,
        rx: 4,
        fill: toAlpha(base, 0.06 + share * 0.84),
        stroke: diagonal ? tokens.accent : tokens.border,
        strokeWidth: diagonal ? 1.5 : 1,
      }),
      h('text', {
        x: labelW + cell * (columnIndex + 0.5),
        y: headerH + cell * rowIndex + cell / 2 - 2,
        textAnchor: 'middle',
        fill: share > 0.55 ? '#ffffff' : tokens.text,
        fontSize: 11,
        fontWeight: diagonal ? 600 : 400,
      }, fmt(value)),
      h('text', {
        x: labelW + cell * (columnIndex + 0.5),
        y: headerH + cell * rowIndex + cell / 2 + 12,
        textAnchor: 'middle',
        fill: share > 0.55 ? 'rgba(255,255,255,.85)' : tokens.muted,
        fontSize: 9,
      }, `${Math.round(share * 100)}%`),
      h('title', null, `true ${labels[rowIndex]} → pred ${labels[columnIndex]}: ${value} (${Math.round(share * 100)}%)`))
  }))

  return h('div', null,
    h('svg', {
      viewBox: `0 0 ${W} ${H}`,
      width: '100%',
      role: 'img',
      'aria-label': `${spec.title} (confusion matrix)`,
    }, header, rowLabels, cells),
    h('div', { style: { marginTop: '6px', color: tokens.muted, fontSize: '11px' } },
      `accuracy ${accuracy}% · ${correct}/${total}`))
}
