/* SPDX-License-Identifier: MIT */

const MAX_LINES = 12

function fmt(value, unit) {
  const rounded = Math.abs(value) >= 1000 ? Math.round(value) : Math.round(value * 100) / 100
  return unit ? `${rounded}${unit}` : String(rounded)
}

function seriesLines(data) {
  const { labels, series, unit } = data
  const lines = labels.slice(0, MAX_LINES).map((label, index) => {
    const cells = series.map((entry) => `${entry.name}=${fmt(entry.values[index] ?? 0, unit)}`)
    return `- ${label}: ${cells.join(', ')}`
  })
  if (labels.length > MAX_LINES) lines.push(`- … (${labels.length - MAX_LINES} more)`)
  return lines
}

function sliceLines(data) {
  const total = data.slices.reduce((sum, slice) => sum + Math.max(0, slice.value), 0)
  return data.slices.map((slice) => {
    const share = total > 0 ? Math.round((Math.max(0, slice.value) / total) * 100) : 0
    return `- ${slice.label}: ${fmt(slice.value, data.unit)} (${share}%)`
  })
}

function scatterLines(data) {
  const { points } = data
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const lines = [
    `- ${points.length} points; x ${fmt(Math.min(...xs))}..${fmt(Math.max(...xs))}; y ${fmt(Math.min(...ys))}..${fmt(Math.max(...ys))}`,
  ]
  points.slice(0, MAX_LINES).forEach((point) => {
    lines.push(`- (${fmt(point.x)}, ${fmt(point.y)})${point.label ? ` ${point.label}` : ''}`)
  })
  if (points.length > MAX_LINES) lines.push(`- … (${points.length - MAX_LINES} more)`)
  return lines
}

function compareLines(data) {
  const { columns, rows } = data
  const head = `| ${columns.join(' | ')} |`
  const rule = `| ${columns.map(() => '---').join(' | ')} |`
  const body = rows.slice(0, MAX_LINES).map((row) => `| ${columns.map((_, i) => row[i] ?? '').join(' | ')} |`)
  if (rows.length > MAX_LINES) body.push(`| … (${rows.length - MAX_LINES} more rows) |`)
  return [head, rule, ...body]
}

function timelineLines(data) {
  return data.items.map((item) => `- ${item.at ? `[${item.at}] ` : ''}${item.label}${item.detail ? ` — ${item.detail}` : ''}`)
}

function ganttLines(data) {
  return data.tasks.map((task) => `- ${task.label}: ${fmt(task.start, data.unit)}–${fmt(task.end, data.unit)}`)
}

function metricLines(data) {
  return data.items.map((item) => {
    const arrow = item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : item.trend === 'flat' ? '→' : ''
    const delta = item.delta ? ` (${arrow}${item.delta})` : ''
    return `- ${item.label}: ${item.value}${data.unit ?? ''}${delta}`
  })
}

const BODIES = {
  bar: seriesLines,
  line: seriesLines,
  area: seriesLines,
  radar: seriesLines,
  pie: sliceLines,
  doughnut: sliceLines,
  scatter: scatterLines,
  compare: compareLines,
  timeline: timelineLines,
  gantt: ganttLines,
  metrics: metricLines,
}

/**
 * Model-facing text fallback for clients that cannot render the card (TUI, exports,
 * copy-paste, logs). Kept compact: at most {@link MAX_LINES} body lines.
 * @param spec - normalized visual spec.
 * @returns a plain-text summary.
 */
export function renderText(spec) {
  const lines = [spec.title]
  if (spec.subtitle) lines.push(spec.subtitle)
  lines.push(...BODIES[spec.kind](spec.data))
  if (spec.note) lines.push('', spec.note)
  return lines.join('\n')
}
