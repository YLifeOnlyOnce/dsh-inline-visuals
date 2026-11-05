/* SPDX-License-Identifier: MIT */

import React, { useEffect, useRef } from 'react'
import { createChart } from '../chart-config.js'
import { readTokens } from '../theme.js'
import { useThemeVersion } from '../use-theme.js'

const h = React.createElement

/** Chart.js wrapper: rebuilds when the spec or the resolved theme changes, destroys on unmount. */
export function ChartCanvas({ spec, height = 240 }) {
  const canvasRef = useRef(null)
  const themeVersion = useThemeVersion()
  const tokens = readTokens()
  const signature = `${spec.kind}|${JSON.stringify(spec.data)}|${themeVersion}`

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const chart = createChart(canvas, spec, tokens)
    canvas.setAttribute('role', 'img')
    canvas.setAttribute('aria-label', `${spec.title} (${spec.kind})`)
    return () => chart.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  return h('div', { style: { position: 'relative', height: `${height}px`, width: '100%' } },
    h('canvas', { ref: canvasRef }))
}
