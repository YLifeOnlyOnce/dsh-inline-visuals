/* SPDX-License-Identifier: MIT */

import React, { useEffect, useRef } from 'react'
import { createChart } from '../chart-config.js'
import { readTokens } from '../theme.js'
import { useThemeVersion } from '../use-theme.js'

const h = React.createElement

/**
 * Chart.js wrapper: rebuilds when the spec (data AND style) or the resolved theme changes,
 * destroys on unmount, and reports clicked data points for the follow-up interaction.
 */
export function ChartCanvas({ spec, height = 240, onPick }) {
  const canvasRef = useRef(null)
  const onPickRef = useRef(onPick)
  onPickRef.current = onPick
  const themeVersion = useThemeVersion()
  const tokens = readTokens()
  const reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  // Style is part of the signature: edit_visual can change style without touching data.
  const signature = JSON.stringify({ kind: spec.kind, data: spec.data, style: spec.style }) + `|${themeVersion}`

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const chart = createChart(canvas, spec, tokens, {
      reduceMotion,
      onClick: (event, elements) => {
        const handler = onPickRef.current
        const hit = elements && elements[0]
        if (!handler || !hit) return undefined
        const instance = event && event.chart ? event.chart : chart
        const dataset = instance.data.datasets[hit.datasetIndex]
        const raw = dataset ? dataset.data[hit.index] : undefined
        const value = Array.isArray(raw) ? raw[1] - raw[0] : (typeof raw === 'number' ? raw : raw?.y)
        const label = instance.data.labels ? instance.data.labels[hit.index] : undefined
        handler({ label: label === undefined ? undefined : String(label), series: dataset?.label, value })
        return undefined
      },
    })
    canvas.setAttribute('role', 'img')
    canvas.setAttribute('aria-label', `${spec.title} (${spec.kind})`)
    return () => chart.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  return h('div', { style: { position: 'relative', height: `${height}px`, width: '100%' } },
    h('canvas', { ref: canvasRef }))
}
