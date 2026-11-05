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

function waterfallLines(data) {
  let running = 0
  const lines = data.labels.map((label, index) => {
    const value = data.values[index] ?? 0
    running += value
    const sign = value > 0 ? '+' : ''
    return `- ${label}: ${sign}${fmt(value, data.unit)} (→ ${fmt(running, data.unit)})`
  })
  lines.push(`- ${data.totalLabel ?? 'Total'}: ${fmt(running, data.unit)}`)
  return lines
}

function heatmapLines(data) {
  const head = `| | ${data.columns.join(' | ')} |`
  const rule = `| --- | ${data.columns.map(() => '---').join(' | ')} |`
  const body = data.rows.slice(0, MAX_LINES).map((row, rowIndex) => {
    const cells = data.columns.map((_, columnIndex) => {
      const value = data.values[rowIndex]?.[columnIndex]
      return value === undefined ? '' : fmt(value, data.unit)
    })
    return `| ${row} | ${cells.join(' | ')} |`
  })
  if (data.rows.length > MAX_LINES) body.push(`| … | (${data.rows.length - MAX_LINES} more rows) |`)
  return [head, rule, ...body]
}

function flowLines(data) {
  const byId = new Map(data.nodes.map((node) => [node.id, node]))
  const lines = data.nodes.slice(0, MAX_LINES).map((node) =>
    `- ${node.label}${node.detail ? ` — ${node.detail}` : ''}`)
  if (data.nodes.length > MAX_LINES) lines.push(`- … (${data.nodes.length - MAX_LINES} more nodes)`)
  if (data.edges.length > 0) {
    lines.push('', ...data.edges.slice(0, MAX_LINES).map((edge) =>
      `- ${byId.get(edge.from)?.label ?? edge.from} → ${byId.get(edge.to)?.label ?? edge.to}${edge.label ? ` (${edge.label})` : ''}`))
  }
  return lines
}

function curveLines(data) {
  const lines = []
  if (data.auc !== undefined) lines.push(`- AUC: ${fmt(data.auc)}`)
  lines.push(...data.points.slice(0, MAX_LINES).map((point) => `- (${fmt(point.x)}, ${fmt(point.y)})${point.label ? ` ${point.label}` : ''}`))
  if (data.points.length > MAX_LINES) lines.push(`- … (${data.points.length - MAX_LINES} more)`)
  return lines
}

function confusionLines(data) {
  const { labels, matrix } = data
  const total = matrix.flat().reduce((sum, value) => sum + value, 0)
  const correct = matrix.reduce((sum, row, index) => sum + (row[index] ?? 0), 0)
  const accuracy = total > 0 ? correct / total : 0
  const lines = [`- accuracy: ${Math.round(accuracy * 1000) / 10}% (${correct}/${total})`]
  labels.forEach((label, index) => {
    const row = matrix[index] ?? []
    const rowTotal = row.reduce((sum, value) => sum + value, 0)
    const recall = rowTotal > 0 ? (row[index] ?? 0) / rowTotal : 0
    lines.push(`- ${label}: recall ${Math.round(recall * 1000) / 10}% (n=${rowTotal})`)
  })
  return lines
}

function histogramLines(data) {
  return data.bins.map((bin) => `- [${fmt(bin.start)}, ${fmt(bin.end)}): ${bin.count}`)
}

function leaderboardLines(data) {
  const head = `| model | ${data.metrics.map((metric) => metric.label).join(' | ')} |`
  const rule = `| --- | ${data.metrics.map(() => '---').join(' | ')} |`
  const best = data.metrics.map((metric, index) => {
    const values = data.rows.map((row) => row.values[index] ?? 0)
    return metric.better === 'down' ? Math.min(...values) : Math.max(...values)
  })
  const body = data.rows.map((row) => {
    const cells = data.metrics.map((metric, index) => {
      const value = row.values[index] ?? 0
      const text = `${metric.better === 'down' ? '' : ''}${fmt(value, metric.unit)}`
      return value === best[index] ? `**${text}**` : text
    })
    return `| ${row.name} | ${cells.join(' | ')} |`
  })
  return [head, rule, ...body]
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
  waterfall: waterfallLines,
  heatmap: heatmapLines,
  flow: flowLines,
  curve: curveLines,
  confusion: confusionLines,
  histogram: histogramLines,
  leaderboard: leaderboardLines,
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
