/* SPDX-License-Identifier: MIT */

import React from 'react'
import { layoutTree } from '../layout.js'
import { readTokens } from '../theme.js'
import { useThemeVersion } from '../use-theme.js'

const h = React.createElement

function truncate(text, limit) {
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text
}

/** Hierarchy diagram: tidy tree with orthogonal connectors. */
export function Tree({ spec }) {
  useThemeVersion()
  const tokens = readTokens()
  const { nodes, leaves, maxDepth } = layoutTree(spec.data.root)
  const nodeW = 132
  const nodeH = 34
  const gapX = 14
  const gapY = 62
  const pad = 16
  const W = pad * 2 + Math.max(1, leaves) * (nodeW + gapX)
  const H = pad * 2 + (maxDepth + 1) * nodeH + maxDepth * (gapY - nodeH)
  const x = (leaf) => pad + leaf * (nodeW + gapX)
  const y = (depth) => pad + depth * gapY

  const connectors = nodes.filter((node) => node.parent !== null).map((node, index) => {
    const parent = nodes.find((candidate) => candidate.label === node.parent && candidate.depth === node.depth - 1)
    if (!parent) return null
    const px = x(parent.x) + nodeW / 2
    const py = y(parent.depth) + nodeH
    const cx = x(node.x) + nodeW / 2
    const cy = y(node.depth)
    const midY = py + (cy - py) / 2
    return h('path', {
      key: `edge-${index}`,
      d: `M ${px} ${py} V ${midY} H ${cx} V ${cy}`,
      fill: 'none',
      stroke: tokens.border,
      strokeWidth: 1.4,
    })
  })

  const boxes = nodes.map((node, index) => h('g', { key: `node-${index}` },
    h('rect', {
      x: x(node.x), y: y(node.depth), width: nodeW, height: nodeH, rx: 8,
      fill: node.depth === 0 ? tokens.surfaceMuted : tokens.surface,
      stroke: node.depth === 0 ? tokens.accent : tokens.border,
    }),
    h('text', {
      x: x(node.x) + nodeW / 2, y: y(node.depth) + 15,
      textAnchor: 'middle', fill: tokens.text, fontSize: 11,
    }, truncate(node.label, 16)),
    node.detail
      ? h('text', {
          x: x(node.x) + nodeW / 2, y: y(node.depth) + 27,
          textAnchor: 'middle', fill: tokens.muted, fontSize: 9,
        }, truncate(node.detail, 18))
      : null,
    h('title', null, `${node.label}${node.detail ? ` — ${node.detail}` : ''}`)))

  return h('svg', {
    viewBox: `0 0 ${W} ${H}`,
    width: '100%',
    role: 'img',
    'aria-label': `${spec.title} (tree)`,
  }, connectors, boxes)
}
