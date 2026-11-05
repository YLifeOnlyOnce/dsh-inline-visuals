/* SPDX-License-Identifier: MIT */

import {
  Chart, BarController, BarElement, CategoryScale, LinearScale,
  LineController, LineElement, PointElement, Filler,
  PieController, ArcElement, DoughnutController,
  RadarController, RadialLinearScale,
  ScatterController, Tooltip, Legend,
} from 'chart.js'
import { fmt } from './format.js'
import { palette, toAlpha } from './theme.js'

Chart.register(
  BarController, BarElement, CategoryScale, LinearScale,
  LineController, LineElement, PointElement, Filler,
  PieController, ArcElement, DoughnutController,
  RadarController, RadialLinearScale,
  ScatterController, Tooltip, Legend,
)

/** Kinds rendered by Chart.js (canvas); everything else is hand-written SVG/HTML. */
export const CANVAS_KINDS = new Set(['bar', 'line', 'area', 'pie', 'doughnut', 'scatter', 'radar', 'waterfall'])

function legendDisplay(style, defaultDisplay) {
  if (style.legend === 'none') return false
  if (style.legend === 'bottom' || style.legend === 'top') return true
  return defaultDisplay
}

function legendPosition(style) {
  return style.legend === 'top' ? 'top' : 'bottom'
}

function baseOptions(tokens, style, defaultLegend) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 250 },
    plugins: {
      legend: {
        display: legendDisplay(style, defaultLegend),
        position: legendPosition(style),
        labels: { color: tokens.muted, boxWidth: 8, boxHeight: 8, usePointStyle: true, font: { size: 11 } },
      },
      tooltip: {
        backgroundColor: tokens.surface,
        titleColor: tokens.text,
        bodyColor: tokens.muted,
        borderColor: tokens.border,
        borderWidth: 1,
        padding: 8,
        bodyFont: { size: 11 },
        titleFont: { size: 11 },
      },
    },
  }
}

function gridStyle(style) {
  return style.grid ? {} : { display: false }
}

function cartesianScales(tokens, spec, style) {
  const unit = spec.data.unit
  const horizontal = style.orientation === 'horizontal'
  const category = {
    grid: { ...gridStyle(style), color: tokens.border, drawTicks: false },
    border: { color: tokens.border },
    ticks: { color: tokens.muted, font: { size: 10 }, maxRotation: 0, autoSkip: true },
  }
  const linear = {
    grid: { ...gridStyle(style), color: tokens.border, drawTicks: false },
    border: { color: tokens.border },
    ticks: { color: tokens.muted, font: { size: 10 }, callback: (value) => fmt(Number(value), unit) },
  }
  const scales = horizontal
    ? { x: { ...linear, stacked: style.stacked }, y: { ...category, stacked: style.stacked } }
    : { x: { ...category, stacked: style.stacked }, y: { ...linear, stacked: style.stacked } }
  return scales
}

function seriesDatasets(spec, tokens, style, colors) {
  return spec.data.series.map((entry, index) => ({
    label: entry.name,
    data: entry.values,
    borderColor: colors[index % colors.length],
    backgroundColor: colors[index % colors.length],
    pointBackgroundColor: colors[index % colors.length],
    pointBorderColor: tokens.surface,
    borderWidth: 2,
    pointRadius: style.points ? 2.5 : 0,
    pointHoverRadius: style.points ? 4 : 2,
    tension: style.curve === 'linear' ? 0 : 0.35,
    ...(style.curve === 'step' ? { stepped: 'middle', tension: 0 } : {}),
  }))
}

/** Small local plugin: draw value labels when `style.values` is on. */
function valueLabels(tokens, spec, style) {
  const unit = spec.data.unit
  return {
    id: 'iv-value-labels',
    afterDatasetsDraw(chart) {
      const { ctx } = chart
      ctx.save()
      ctx.fillStyle = tokens.text
      ctx.font = '10px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      const horizontal = style.orientation === 'horizontal'
      for (const dataset of chart.data.datasets) {
        const meta = chart.getDatasetMeta(chart.data.datasets.indexOf(dataset))
        if (meta.hidden) continue
        const points = meta.data
        if (points.length > 40) continue
        points.forEach((element, index) => {
          const raw = dataset.data[index]
          const value = Array.isArray(raw) ? raw[1] : raw
          if (typeof value !== 'number' || !Number.isFinite(value)) return
          const text = fmt(value, unit)
          if (horizontal) {
            ctx.textAlign = 'left'
            ctx.textBaseline = 'middle'
            ctx.fillText(text, element.x + 6, element.y)
            ctx.textAlign = 'center'
            ctx.textBaseline = 'bottom'
          } else {
            ctx.fillText(text, element.x, element.y - 6)
          }
        })
      }
      ctx.restore()
    },
  }
}

function regression(points) {
  const n = points.length
  if (n < 2) return null
  const sumX = points.reduce((sum, point) => sum + point.x, 0)
  const sumY = points.reduce((sum, point) => sum + point.y, 0)
  const sumXY = points.reduce((sum, point) => sum + point.x * point.y, 0)
  const sumXX = points.reduce((sum, point) => sum + point.x * point.x, 0)
  const denominator = n * sumXX - sumX * sumX
  if (denominator === 0) return null
  const slope = (n * sumXY - sumX * sumY) / denominator
  const intercept = (sumY - slope * sumX) / n
  const xs = points.map((point) => point.x)
  return { from: { x: Math.min(...xs), y: slope * Math.min(...xs) + intercept }, to: { x: Math.max(...xs), y: slope * Math.max(...xs) + intercept } }
}

/**
 * Translate one normalized spec into a Chart.js configuration. Pure: same spec + tokens
 * produce the same config, which keeps the renderer deterministic and testable.
 * @param spec - normalized visual spec.
 * @param tokens - resolved theme tokens from {@link readTokens}.
 * @returns a Chart.js configuration object.
 */
export function buildChartConfig(spec, tokens) {
  const style = spec.style ?? {}
  const colors = palette(tokens, style.palette)
  const kind = spec.kind

  if (kind === 'bar') {
    const options = baseOptions(tokens, style, spec.data.series.length > 1)
    options.indexAxis = style.orientation === 'horizontal' ? 'y' : 'x'
    options.scales = cartesianScales(tokens, spec, style)
    options.plugins.tooltip.callbacks = {
      label: (context) => `${context.dataset.label}: ${fmt(context.parsed[style.orientation === 'horizontal' ? 'x' : 'y'], spec.data.unit)}`,
    }
    return {
      type: 'bar',
      data: {
        labels: spec.data.labels,
        datasets: seriesDatasets(spec, tokens, style, colors).map((dataset) => ({
          ...dataset,
          borderRadius: 4,
          maxBarThickness: 28,
          borderWidth: 0,
          pointRadius: 0,
        })),
      },
      options,
      plugins: style.values ? [valueLabels(tokens, spec, style)] : [],
    }
  }

  if (kind === 'line' || kind === 'area') {
    const options = baseOptions(tokens, style, spec.data.series.length > 1)
    options.scales = cartesianScales(tokens, spec, style)
    options.plugins.tooltip.callbacks = {
      label: (context) => `${context.dataset.label}: ${fmt(context.parsed.y, spec.data.unit)}`,
    }
    return {
      type: 'line',
      data: {
        labels: spec.data.labels,
        datasets: seriesDatasets(spec, tokens, style, colors).map((dataset, index) => ({
          ...dataset,
          fill: kind === 'area',
          backgroundColor: kind === 'area'
            ? toAlpha(colors[index % colors.length], 0.18)
            : toAlpha(colors[index % colors.length], 0),
        })),
      },
      options,
      plugins: style.values ? [valueLabels(tokens, spec, style)] : [],
    }
  }

  if (kind === 'waterfall') {
    let running = 0
    const labels = [...spec.data.labels]
    const data = spec.data.values.map((value) => {
      const start = running
      running += value
      return [start, running]
    })
    labels.push(spec.data.totalLabel ?? 'Total')
    data.push([0, running])
    const signColors = spec.data.values.map((value) => (value >= 0 ? tokens.success : tokens.error))
    signColors.push(tokens.accent)
    const options = baseOptions(tokens, style, false)
    options.scales = {
      x: { grid: { display: false }, border: { color: tokens.border }, ticks: { color: tokens.muted, font: { size: 10 }, maxRotation: 0, autoSkip: true } },
      y: {
        grid: { ...gridStyle(style), color: tokens.border, drawTicks: false },
        border: { color: tokens.border },
        ticks: { color: tokens.muted, font: { size: 10 }, callback: (value) => fmt(Number(value), spec.data.unit) },
      },
    }
    options.plugins.tooltip.callbacks = {
      label: (context) => {
        const raw = context.raw
        const delta = Array.isArray(raw) ? raw[1] - raw[0] : raw
        return `${fmt(delta, spec.data.unit)}`
      },
    }
    return {
      type: 'bar',
      data: { labels, datasets: [{ label: 'delta', data, backgroundColor: signColors, borderRadius: 3, maxBarThickness: 34 }] },
      options,
      plugins: style.values ? [valueLabels(tokens, spec, style)] : [],
    }
  }

  if (kind === 'pie' || kind === 'doughnut') {
    const values = spec.data.slices.map((slice) => slice.value)
    const total = values.reduce((sum, value) => sum + Math.max(0, value), 0)
    const options = baseOptions(tokens, style, true)
    options.plugins.tooltip.callbacks = {
      label: (context) => {
        const value = Number(context.parsed) || 0
        const share = total > 0 ? Math.round((Math.max(0, value) / total) * 100) : 0
        return `${context.label}: ${fmt(value, spec.data.unit)} (${share}%)`
      },
    }
    return {
      type: kind,
      data: {
        labels: spec.data.slices.map((slice) => slice.label),
        datasets: [{
          data: values,
          backgroundColor: spec.data.slices.map((_, index) => colors[index % colors.length]),
          borderColor: tokens.surface,
          borderWidth: 2,
          hoverOffset: 6,
        }],
      },
      options,
    }
  }

  if (kind === 'scatter') {
    const options = baseOptions(tokens, style, false)
    options.scales = {
      x: {
        type: 'linear',
        grid: { ...gridStyle(style), color: tokens.border, drawTicks: false },
        border: { color: tokens.border },
        ticks: { color: tokens.muted, font: { size: 10 } },
        title: spec.data.xLabel ? { display: true, text: spec.data.xLabel, color: tokens.muted, font: { size: 10 } } : undefined,
      },
      y: {
        type: 'linear',
        grid: { ...gridStyle(style), color: tokens.border, drawTicks: false },
        border: { color: tokens.border },
        ticks: { color: tokens.muted, font: { size: 10 } },
        title: spec.data.yLabel ? { display: true, text: spec.data.yLabel, color: tokens.muted, font: { size: 10 } } : undefined,
      },
    }
    options.plugins.tooltip.callbacks = {
      label: (context) => {
        const point = context.raw
        return point.label ? point.label : `(${fmt(point.x)}, ${fmt(point.y)})`
      },
    }
    const datasets = [{
      label: 'points',
      data: spec.data.points,
      backgroundColor: toAlpha(tokens.accent, 0.85),
      borderColor: tokens.surface,
      borderWidth: 1.5,
      pointRadius: style.points ? 4 : 2,
      pointHoverRadius: 6,
    }]
    if (style.trendLine) {
      const fit = regression(spec.data.points)
      if (fit) {
        datasets.push({
          label: 'trend',
          type: 'line',
          data: [fit.from, fit.to],
          borderColor: tokens.warn,
          borderWidth: 1.5,
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false,
        })
      }
    }
    return { type: 'scatter', data: { datasets }, options }
  }

  if (kind === 'radar') {
    const options = baseOptions(tokens, style, spec.data.series.length > 1)
    options.scales = {
      r: {
        grid: { color: tokens.border },
        angleLines: { color: tokens.border },
        pointLabels: { color: tokens.muted, font: { size: 10 } },
        ticks: { display: false },
        suggestedMin: 0,
      },
    }
    options.plugins.tooltip.callbacks = {
      label: (context) => `${context.dataset.label}: ${fmt(context.parsed.r, spec.data.unit)}`,
    }
    return {
      type: 'radar',
      data: {
        labels: spec.data.labels,
        datasets: spec.data.series.map((entry, index) => ({
          label: entry.name,
          data: entry.values,
          borderColor: colors[index % colors.length],
          backgroundColor: toAlpha(colors[index % colors.length], 0.15),
          pointBackgroundColor: colors[index % colors.length],
          borderWidth: 2,
          pointRadius: style.points ? 2.5 : 0,
        })),
      },
      options,
    }
  }

  throw new Error(`unsupported chart kind: ${kind}`)
}

/**
 * Create a Chart.js instance for one card.
 * @param canvas - target canvas element.
 * @param spec - normalized visual spec.
 * @param tokens - resolved theme tokens.
 * @param handlers - optional `onClick(event, elements)` and `reduceMotion` (accessibility).
 * @returns the Chart.js instance (caller owns destroy()).
 */
export function createChart(canvas, spec, tokens, handlers = {}) {
  const config = buildChartConfig(spec, tokens)
  config.options.onClick = handlers.onClick
  if (handlers.reduceMotion) config.options.animation = { duration: 0 }
  return new Chart(canvas, config)
}
