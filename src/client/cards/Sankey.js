/* SPDX-License-Identifier: MIT */

import React from 'react'
import { fmt } from '../format.js'
import { layoutSankey } from '../layout.js'
import { palette, readTokens, toAlpha } from '../theme.js'
import { useThemeVersion } from '../use-theme.js'

const h = React.createElement

/** Sankey diagram: layered nodes with flow-width Bezier bands. */
export function Sankey({ spec }) {
  useThemeVersion()
  const tokens = readTokens()
  const { nodes, links } = spec.data
  if (nodes.length === 0) return null
  const layers = layoutSankey(nodes, links)
  const W = 640
  const H = 280
  const pad = { top: 12, bottom: 12, left: 16, right: 16 }
  const nodeW = 12
  const gap = 8

  const totals = layers.map((layer) => layer.reduce((sum, node) => sum + node.value, 0))
  const maxTotal = Math.max(1, ...totals)
  const scale = (H - pad.top - pad.bottom - Math.max(0, layers.length - 1) * 0) / maxTotal
  const layerX = (index) => layers.length === 1
    ? pad.left
    : pad.left + (index * (W - pad.left - pad.right - nodeW)) / (layers.length - 1)

  const byId = new Map()
  const positioned = layers.map((layer, layerIndex) => {
    const x = layerX(layerIndex)
    let y = pad.top
    return layer.map((node) => {
      const height = Math.max(2, node.value * scale)
      const placed = { ...node, x, y, height }
      byId.set(node.id, placed)
      y += height + gap
      return placed
    })
  })

  const colors = palette(tokens, spec.style?.palette ?? 'default')
  const sourceColor = new Map()
  let colorIndex = 0
  for (const layer of positioned) {
    for (const node of layer) {
      sourceColor.set(node.id, colors[colorIndex % colors.length])
      colorIndex += 1
    }
  }

  const outOffset = new Map(nodes.map((node) => [node.id, 0]))
  const inOffset = new Map(nodes.map((node) => [node.id, 0]))
  const bands = links.map((link, index) => {
    const source = byId.get(link.from)
    const target = byId.get(link.to)
    if (!source || !target) return null
    const thickness = Math.max(1, link.value * scale)
    const sourceOffset = outOffset.get(link.from) ?? 0
    const targetOffset = inOffset.get(link.to) ?? 0
    outOffset.set(link.from, sourceOffset + link.value)
    inOffset.set(link.to, targetOffset + link.value)
    const x1 = source.x + nodeW
    const y1 = source.y + sourceOffset * scale
    const x2 = target.x
    const y2 = target.y + targetOffset * scale
    const mid = (x1 + x2) / 2
    return h('path', {
      key: `band-${index}`,
      d: `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2} `
        + `L ${x2} ${y2 + thickness} C ${mid} ${y2 + thickness}, ${mid} ${y1 + thickness}, ${x1} ${y1 + thickness} Z`,
      fill: toAlpha(sourceColor.get(link.from) ?? tokens.accent, 0.32),
      stroke: 'none',
    },
    h('title', null, `${link.from} → ${link.to}: ${fmt(link.value)}`))
  })

  const rects = positioned.flatMap((layer) => layer.map((node) => h('g', { key: `node-${node.id}` },
    h('rect', { x: node.x, y: node.y, width: nodeW, height: node.height, rx: 2, fill: sourceColor.get(node.id) ?? tokens.accent }),
    h('text', {
      x: layers.findIndex((candidate) => candidate.some((entry) => entry.id === node.id)) === layers.length - 1
        ? node.x - 6
        : node.x + nodeW + 6,
      y: node.y + Math.min(node.height, 12) / 2 + 9,
      textAnchor: layers.findIndex((candidate) => candidate.some((entry) => entry.id === node.id)) === layers.length - 1 ? 'end' : 'start',
      fill: tokens.text,
      fontSize: 10,
    }, node.label.length > 12 ? `${node.label.slice(0, 11)}…` : node.label),
    h('title', null, `${node.label}: in ${fmt(node.inflow)} / out ${fmt(node.outflow)}`))))

  return h('svg', {
    viewBox: `0 0 ${W} ${H}`,
    width: '100%',
    role: 'img',
    'aria-label': `${spec.title} (sankey)`,
  }, bands, rects)
}
