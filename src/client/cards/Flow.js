/* SPDX-License-Identifier: MIT */

import React from 'react'
import { readTokens } from '../theme.js'
import { useThemeVersion } from '../use-theme.js'

const h = React.createElement

function truncate(text, limit) {
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text
}

function layerize(nodes, edges) {
  const indegree = new Map(nodes.map((node) => [node.id, 0]))
  const outgoing = new Map(nodes.map((node) => [node.id, []]))
  for (const edge of edges) {
    indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1)
    outgoing.get(edge.from)?.push(edge.to)
  }
  const layers = []
  let current = nodes.filter((node) => indegree.get(node.id) === 0).map((node) => node.id)
  const seen = new Set()
  while (current.length > 0) {
    layers.push(current)
    const next = []
    for (const id of current) {
      seen.add(id)
      for (const to of outgoing.get(id) ?? []) {
        indegree.set(to, (indegree.get(to) ?? 0) - 1)
        if (indegree.get(to) === 0) next.push(to)
      }
    }
    current = [...new Set(next)]
  }
  const remaining = nodes.filter((node) => !seen.has(node.id)).map((node) => node.id)
  if (remaining.length > 0) layers.push(remaining)
  return layers
}

/** Layered DAG: nodes as boxes, edges as arrows, labels from the spec. */
export function Flow({ spec }) {
  useThemeVersion()
  const tokens = readTokens()
  const { nodes, edges } = spec.data
  if (nodes.length === 0) return null

  const W = 640
  const boxW = 128
  const boxH = 46
  const gapX = 30
  const gapY = 58
  const layers = layerize(nodes, edges)
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const boxPosition = new Map()
  const H = 20 + layers.length * (boxH + gapY)

  const boxes = layers.flatMap((layer, layerIndex) => {
    const totalW = layer.length * boxW + (layer.length - 1) * gapX
    const startX = (W - totalW) / 2
    return layer.map((id, index) => {
      const node = byId.get(id)
      const x = startX + index * (boxW + gapX)
      const y = 20 + layerIndex * (boxH + gapY)
      boxPosition.set(id, { x, y })
      return h('g', { key: `node-${id}` },
        h('rect', {
          x, y, width: boxW, height: boxH, rx: 8,
          fill: tokens.surfaceMuted, stroke: tokens.border,
        }),
        h('text', {
          x: x + boxW / 2, y: y + 19,
          textAnchor: 'middle', fill: tokens.text, fontSize: 11, fontWeight: 600,
        }, truncate(node.label, 16)),
        node.detail
          ? h('text', {
              x: x + boxW / 2, y: y + 34,
              textAnchor: 'middle', fill: tokens.muted, fontSize: 9.5,
            }, truncate(node.detail, 20))
          : null,
        h('title', null, `${node.label}${node.detail ? ` — ${node.detail}` : ''}`))
    })
  })

  const arrows = edges.map((edge, index) => {
    const from = boxPosition.get(edge.from)
    const to = boxPosition.get(edge.to)
    if (!from || !to) return null
    const x1 = from.x + boxW / 2
    const y1 = from.y + boxH
    const x2 = to.x + boxW / 2
    const y2 = to.y
    const midY = (y1 + y2) / 2
    return h('g', { key: `edge-${index}` },
      h('path', {
        d: `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2 - 6}`,
        fill: 'none', stroke: tokens.idle, strokeWidth: 1.4,
        markerEnd: 'url(#iv-arrow)',
      }),
      edge.label
        ? h('text', {
            x: (x1 + x2) / 2, y: midY - 4,
            textAnchor: 'middle', fill: tokens.muted, fontSize: 9,
          }, truncate(edge.label, 18))
        : null)
  })

  return h('svg', {
    viewBox: `0 0 ${W} ${H}`,
    width: '100%',
    role: 'img',
    'aria-label': `${spec.title} (flow)`,
  },
  h('defs', null,
    h('marker', {
      id: 'iv-arrow', viewBox: '0 0 10 10', refX: 8, refY: 5,
      markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse',
    }, h('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: tokens.idle }))),
  arrows, boxes)
}
