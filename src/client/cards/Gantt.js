/* SPDX-License-Identifier: MIT */

import React from 'react'
import { fmt } from '../format.js'
import { palette, readTokens } from '../theme.js'
import { useThemeVersion } from '../use-theme.js'

const h = React.createElement

function truncate(text, limit) {
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text
}

/** Dependency-free SVG gantt: numeric timeline, one bar per task, three axis ticks. */
export function Gantt({ spec }) {
  useThemeVersion()
  const tokens = readTokens()
  const { tasks, unit } = spec.data
  if (tasks.length === 0) return null

  const W = 640
  const labelW = 150
  const right = 20
  const top = 26
  const rowH = 30
  const H = top + tasks.length * rowH + 24
  const min = Math.min(...tasks.map((task) => task.start))
  const max = Math.max(...tasks.map((task) => task.end))
  const span = max - min || 1
  const x = (value) => labelW + ((value - min) / span) * (W - labelW - right)
  const colors = palette(tokens)

  const ticks = [0, 0.5, 1].map((ratio) => min + span * ratio)
  const grid = ticks.map((value, index) => {
    const gx = x(value)
    return h('g', { key: `grid-${index}` },
      h('line', {
        x1: gx, x2: gx, y1: top - 8, y2: H - 20,
        stroke: tokens.border, strokeDasharray: index === 0 ? '0' : '3 4',
      }),
      h('text', {
        x: gx, y: H - 6, textAnchor: 'middle', fill: tokens.muted, fontSize: 10,
      }, fmt(value, unit)))
  })

  const rows = tasks.map((task, index) => {
    const y = top + index * rowH
    const x1 = x(task.start)
    const x2 = Math.max(x1 + 3, x(task.end))
    return h('g', { key: `task-${index}` },
      h('text', {
        x: labelW - 10, y: y + 16, textAnchor: 'end', fill: tokens.text, fontSize: 11,
      }, truncate(task.label, 16)),
      h('rect', {
        x: x1, y: y + 5, width: x2 - x1, height: 14, rx: 3,
        fill: colors[index % colors.length],
      }),
      h('title', null, `${task.label}: ${fmt(task.start, unit)} – ${fmt(task.end, unit)}`))
  })

  return h('svg', {
    viewBox: `0 0 ${W} ${H}`,
    width: '100%',
    role: 'img',
    'aria-label': `${spec.title} (gantt)`,
  }, grid, rows)
}
