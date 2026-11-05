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
export const CANVAS_KINDS = new Set(['bar', 'line', 'area', 'pie', 'doughnut', 'scatter', 'radar'])

/**
 * Create a Chart.js instance for one card. Kept beside the config builder so the
 * renderer, the demo generator and tests all go through the same construction path.
 * @param canvas - target canvas element.
 * @param spec - normalized visual spec.
 * @param tokens - resolved theme tokens.
 * @returns the Chart.js instance (caller owns destroy()).
 */
export function createChart(canvas, spec, tokens) {
  return new Chart(canvas, buildChartConfig(spec, tokens))
}

function baseOptions(tokens) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 250 },
    plugins: {
      legend: {
        display: false,
        position: 'bottom',
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

function cartesianScales(tokens, spec) {
  const unit = spec.data.unit
  return {
    x: {
      grid: { color: tokens.border, drawTicks: false },
      border: { color: tokens.border },
      ticks: { color: tokens.muted, font: { size: 10 }, maxRotation: 0, autoSkip: true },
    },
    y: {
      grid: { color: tokens.border, drawTicks: false },
      border: { color: tokens.border },
      ticks: { color: tokens.muted, font: { size: 10 }, callback: (value) => fmt(Number(value), unit) },
    },
  }
}

function seriesDatasets(spec, tokens) {
  const colors = palette(tokens)
  return spec.data.series.map((entry, index) => ({
    label: entry.name,
    data: entry.values,
    borderColor: colors[index % colors.length],
    backgroundColor: colors[index % colors.length],
    pointBackgroundColor: colors[index % colors.length],
    pointBorderColor: tokens.surface,
    borderWidth: 2,
    pointRadius: 2.5,
    pointHoverRadius: 4,
    tension: 0.3,
  }))
}

/**
 * Translate one normalized spec into a Chart.js configuration. Pure: same spec + tokens
 * produce the same config, which keeps the renderer deterministic and testable.
 * @param spec - normalized visual spec.
 * @param tokens - resolved theme tokens from {@link readTokens}.
 * @returns a Chart.js configuration object.
 */
export function buildChartConfig(spec, tokens) {
  const options = baseOptions(tokens)
  const colors = palette(tokens)
  const kind = spec.kind

  if (kind === 'bar') {
    options.scales = cartesianScales(tokens, spec)
    options.plugins.legend.display = spec.data.series.length > 1
    options.plugins.tooltip.callbacks = {
      label: (context) => `${context.dataset.label}: ${fmt(context.parsed.y, spec.data.unit)}`,
    }
    return {
      type: 'bar',
      data: {
        labels: spec.data.labels,
        datasets: seriesDatasets(spec, tokens).map((dataset) => ({
          ...dataset,
          borderRadius: 4,
          maxBarThickness: 28,
          borderWidth: 0,
          pointRadius: 0,
        })),
      },
      options,
    }
  }

  if (kind === 'line' || kind === 'area') {
    options.scales = cartesianScales(tokens, spec)
    options.plugins.legend.display = spec.data.series.length > 1
    options.plugins.tooltip.callbacks = {
      label: (context) => `${context.dataset.label}: ${fmt(context.parsed.y, spec.data.unit)}`,
    }
    return {
      type: 'line',
      data: {
        labels: spec.data.labels,
        datasets: seriesDatasets(spec, tokens).map((dataset, index) => ({
          ...dataset,
          fill: kind === 'area',
          backgroundColor: kind === 'area'
            ? toAlpha(colors[index % colors.length], 0.18)
            : toAlpha(colors[index % colors.length], 0),
          pointRadius: kind === 'area' ? 0 : 2.5,
        })),
      },
      options,
    }
  }

  if (kind === 'pie' || kind === 'doughnut') {
    const values = spec.data.slices.map((slice) => slice.value)
    const total = values.reduce((sum, value) => sum + Math.max(0, value), 0)
    options.plugins.legend.display = true
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
    options.scales = {
      x: {
        type: 'linear',
        grid: { color: tokens.border, drawTicks: false },
        border: { color: tokens.border },
        ticks: { color: tokens.muted, font: { size: 10 } },
        title: spec.data.xLabel
          ? { display: true, text: spec.data.xLabel, color: tokens.muted, font: { size: 10 } }
          : undefined,
      },
      y: {
        type: 'linear',
        grid: { color: tokens.border, drawTicks: false },
        border: { color: tokens.border },
        ticks: { color: tokens.muted, font: { size: 10 } },
        title: spec.data.yLabel
          ? { display: true, text: spec.data.yLabel, color: tokens.muted, font: { size: 10 } }
          : undefined,
      },
    }
    options.plugins.legend.display = false
    options.plugins.tooltip.callbacks = {
      label: (context) => {
        const point = context.raw
        return point.label ? point.label : `(${fmt(point.x)}, ${fmt(point.y)})`
      },
    }
    return {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'points',
          data: spec.data.points,
          backgroundColor: toAlpha(tokens.accent, 0.85),
          borderColor: tokens.surface,
          borderWidth: 1.5,
          pointRadius: 4,
          pointHoverRadius: 6,
        }],
      },
      options,
    }
  }

  if (kind === 'radar') {
    options.scales = {
      r: {
        grid: { color: tokens.border },
        angleLines: { color: tokens.border },
        pointLabels: { color: tokens.muted, font: { size: 10 } },
        ticks: { display: false },
        suggestedMin: 0,
      },
    }
    options.plugins.legend.display = spec.data.series.length > 1
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
          pointRadius: 2.5,
        })),
      },
      options,
    }
  }

  throw new Error(`unsupported chart kind: ${kind}`)
}
