/* SPDX-License-Identifier: MIT */

import React, { useEffect, useRef, useState } from 'react'
import { CANVAS_KINDS } from '../chart-config.js'
import { readTokens } from '../theme.js'
import { useThemeVersion } from '../use-theme.js'
import { fmt } from '../format.js'
import { buildFollowUp } from '../follow-up.js'
import { toCsv } from '../csv.js'
import { ChartCanvas } from './ChartCanvas.js'
import { Compare } from './Compare.js'
import { Flow } from './Flow.js'
import { Gantt } from './Gantt.js'
import { Heatmap } from './Heatmap.js'
import { Metrics } from './Metrics.js'
import { Timeline } from './Timeline.js'

const h = React.createElement

function ChartBody({ spec, t }) {
  if (spec.kind === 'compare') return h(Compare, { spec })
  if (spec.kind === 'timeline') return h(Timeline, { spec })
  if (spec.kind === 'gantt') return h(Gantt, { spec })
  if (spec.kind === 'heatmap') return h(Heatmap, { spec })
  if (spec.kind === 'metrics') return h(Metrics, { spec })
  if (CANVAS_KINDS.has(spec.kind)) {
    const height = spec.style?.height ?? (spec.kind === 'pie' || spec.kind === 'doughnut' ? 260 : 240)
    return h(ChartCanvas, { spec, height })
  }
  return h('div', { style: { fontSize: '12px' } }, t('unknown'))
}

function buttonStyle(tokens) {
  return {
    border: `1px solid ${tokens.border}`,
    borderRadius: '6px',
    background: 'transparent',
    color: tokens.muted,
    fontSize: '12px',
    padding: '3px 8px',
    cursor: 'pointer',
  }
}

/**
 * The whole card. `props.phase` is `preparing` | `start` | `result`; only the settled
 * result carries `block.meta`, the persisted visual spec.
 */
export function InlineVisual(props) {
  const t = props.t
  const spec = props.phase === 'result' && props.block ? props.block.meta : undefined
  const [showData, setShowData] = useState(false)
  const [copied, setCopied] = useState(false)
  const [csvCopied, setCsvCopied] = useState(false)
  const [picked, setPicked] = useState(null)
  const figureRef = useRef(null)
  useThemeVersion()
  const tokens = readTokens()
  const signature = spec ? JSON.stringify({ kind: spec.kind, data: spec.data, style: spec.style }) : ''
  useEffect(() => setPicked(null), [signature])

  if (props.phase !== 'result') {
    return h('div', {
      style: {
        border: `1px dashed ${tokens.border}`,
        borderRadius: '10px',
        padding: '14px 16px',
        color: tokens.muted,
        fontSize: '13px',
      },
    }, t('loading'))
  }

  // Version 1 (v0.1) specs keep rendering: replay compatibility matters more than strictness.
  if (!spec || typeof spec !== 'object' || (spec.version !== 1 && spec.version !== 2)) {
    return h('div', {
      style: {
        border: `1px solid ${tokens.border}`,
        borderRadius: '10px',
        background: tokens.surface,
        padding: '14px 16px',
        color: tokens.muted,
        fontSize: '13px',
      },
    }, t('empty'))
  }

  const onCopy = () => {
    const payload = JSON.stringify(spec, null, 2)
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(payload).then(() => setCopied(true), () => {})
    }
  }

  const onExport = () => {
    const figure = figureRef.current
    const canvas = figure ? figure.querySelector('canvas') : null
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `${(spec.title || 'visual').replace(/[^\w\u4e00-\u9fa5-]+/g, '-')}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const style = spec.style ?? {}
  const canExport = CANVAS_KINDS.has(spec.kind)
  const hasSvg = !CANVAS_KINDS.has(spec.kind) && ['heatmap', 'flow', 'gantt'].includes(spec.kind)
  const onCopyCsv = () => {
    const csv = toCsv(spec)
    if (!csv || typeof navigator === 'undefined' || !navigator.clipboard) return
    navigator.clipboard.writeText(csv).then(() => setCsvCopied(true), () => {})
  }
  const onExportSvg = () => {
    const figure = figureRef.current
    const svg = figure ? figure.querySelector('svg') : null
    if (!svg || typeof XMLSerializer === 'undefined') return
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' })
    const link = document.createElement('a')
    link.download = `${(spec.title || 'visual').replace(/[^\w\u4e00-\u9fa5-]+/g, '-')}.svg`
    link.href = URL.createObjectURL(blob)
    link.click()
    URL.revokeObjectURL(link.href)
  }
  const onAsk = () => {
    const input = props.inputActions
    if (!input || !picked || typeof input.captureInsertion !== 'function') return
    const text = buildFollowUp(spec, picked, props.localeCode === 'en' ? 'en' : 'zh')
    const span = input.captureInsertion()
    input.insertText(text, span)
    input.persistDraft?.()
    setPicked(null)
  }

  return h('figure', {
    ref: figureRef,
    style: {
      margin: '4px 0',
      padding: style.density === 'compact' ? '10px 12px' : '14px 16px',
      border: `1px solid ${tokens.border}`,
      borderRadius: '10px',
      background: tokens.surface,
      color: tokens.text,
      fontFamily: 'inherit',
      fontSize: '13px',
    },
  },
  h('figcaption', null,
    h('div', {
      style: { display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' },
    },
    h('strong', { style: { fontSize: '14px', fontWeight: 600 } }, spec.title),
    spec.subtitle
      ? h('span', { style: { color: tokens.muted, fontSize: '12px' } }, spec.subtitle)
      : null)),
  h(ChartBody, { spec, t, onPick: setPicked }),
  picked
    ? h('div', {
        style: {
          display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
          marginTop: '8px', padding: '6px 10px', borderRadius: '8px',
          background: tokens.surfaceMuted, color: tokens.muted, fontSize: '12px',
        },
      },
      h('span', null, `${t('picked')}: ${picked.label ?? ''}${picked.series ? ` · ${picked.series}` : ''}${typeof picked.value === 'number' ? ` = ${fmt(picked.value, spec.data.unit)}` : ''}`),
      h('button', { type: 'button', onClick: onAsk, style: buttonStyle(tokens) }, t('ask')))
    : null,
  spec.note
    ? h('p', { style: { margin: '10px 0 0', color: tokens.muted, fontSize: '12px' } }, spec.note)
    : null,
  showData
    ? h('pre', {
        style: {
          margin: '10px 0 0',
          padding: '10px',
          overflow: 'auto',
          maxHeight: '220px',
          borderRadius: '8px',
          background: tokens.surfaceMuted,
          color: tokens.muted,
          fontSize: '11px',
        },
      }, JSON.stringify(spec.data, null, 2))
    : null,
  h('div', { style: { display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' } },
    h('button', { type: 'button', onClick: onCopy, style: buttonStyle(tokens) }, copied ? t('copied') : t('copy')),
    h('button', { type: 'button', onClick: onCopyCsv, style: buttonStyle(tokens) }, csvCopied ? t('copied') : t('copyCsv')),
    h('button', {
      type: 'button',
      'aria-pressed': showData,
      onClick: () => setShowData((value) => !value),
      style: buttonStyle(tokens),
    }, showData ? t('hideData') : t('showData')),
    canExport
      ? h('button', { type: 'button', onClick: onExport, style: buttonStyle(tokens) }, t('exportPng'))
      : null,
    hasSvg
      ? h('button', { type: 'button', onClick: onExportSvg, style: buttonStyle(tokens) }, t('exportSvg'))
      : null))
}
