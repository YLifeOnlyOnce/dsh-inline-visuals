/* SPDX-License-Identifier: MIT */

import { KINDS, LIMITS } from './limits.js'
import { normalizeStyle } from './style.js'

function str(value, field, limit = LIMITS.text) {
  if (typeof value !== 'string') throw new TypeError(`${field} must be a string`)
  const trimmed = value.trim()
  if (trimmed.length === 0) throw new TypeError(`${field} must not be empty`)
  return trimmed.length > limit ? `${trimmed.slice(0, limit)}…` : trimmed
}

function optStr(value, field, limit = LIMITS.text) {
  if (value === undefined || value === null) return undefined
  return str(value, field, limit)
}

function finite(value, field) {
  const n = typeof value === 'string' ? Number(value) : value
  if (typeof n !== 'number' || !Number.isFinite(n)) throw new TypeError(`${field} must be a finite number`)
  return n
}

function optObject(value, field) {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${field} must be an object`)
  return value
}

function seriesData(data, kind) {
  optObject(data, `${kind}.data`)
  if (!Array.isArray(data.labels) || !Array.isArray(data.series)) {
    throw new TypeError(`${kind}.data needs \`labels\` and \`series\` arrays`)
  }
  const labels = data.labels.slice(0, LIMITS.labels).map((l, i) => str(l, `labels[${i}]`, 60))
  if (labels.length === 0) throw new TypeError('data.labels must not be empty')
  const series = data.series.slice(0, LIMITS.series).map((entry, index) => {
    if (entry === null || typeof entry !== 'object') throw new TypeError(`series[${index}] must be an object`)
    if (!Array.isArray(entry.values)) throw new TypeError(`series[${index}].values must be an array`)
    return {
      name: str(entry.name, `series[${index}].name`, 60),
      values: entry.values.slice(0, labels.length).map((v, i) => finite(v, `series[${index}].values[${i}]`)),
    }
  })
  const unit = optStr(data.unit, 'data.unit', 16)
  return {
    labels,
    series,
    ...(unit === undefined ? {} : { unit }),
  }
}

function slicesData(data, kind) {
  optObject(data, `${kind}.data`)
  if (!Array.isArray(data.slices)) throw new TypeError(`${kind}.data needs a \`slices\` array`)
  const slices = data.slices.slice(0, LIMITS.slices).map((slice, index) => {
    if (slice === null || typeof slice !== 'object') throw new TypeError(`slices[${index}] must be an object`)
    return {
      label: str(slice.label, `slices[${index}].label`, 60),
      value: finite(slice.value, `slices[${index}].value`),
    }
  })
  if (slices.length === 0) throw new TypeError('data.slices must not be empty')
  const unit = optStr(data.unit, 'data.unit', 16)
  return { slices, ...(unit === undefined ? {} : { unit }) }
}

function scatterData(data) {
  optObject(data, 'scatter.data')
  if (!Array.isArray(data.points)) throw new TypeError('scatter.data needs a `points` array')
  const points = data.points.slice(0, LIMITS.points).map((point, index) => {
    if (point === null || typeof point !== 'object') throw new TypeError(`points[${index}] must be an object`)
    return {
      x: finite(point.x, `points[${index}].x`),
      y: finite(point.y, `points[${index}].y`),
      ...(optStr(point.label, `points[${index}].label`, 60) === undefined
        ? {}
        : { label: optStr(point.label, `points[${index}].label`, 60) }),
    }
  })
  const xLabel = optStr(data.xLabel, 'data.xLabel', 40)
  const yLabel = optStr(data.yLabel, 'data.yLabel', 40)
  return {
    points,
    ...(xLabel === undefined ? {} : { xLabel }),
    ...(yLabel === undefined ? {} : { yLabel }),
  }
}

function compareData(data) {
  optObject(data, 'compare.data')
  if (!Array.isArray(data.columns) || !Array.isArray(data.rows)) {
    throw new TypeError('compare.data needs `columns` and `rows` arrays')
  }
  const columns = data.columns.slice(0, LIMITS.columns).map((c, i) => str(c, `columns[${i}]`, 60))
  if (columns.length === 0) throw new TypeError('compare.data.columns must not be empty')
  const rows = data.rows.slice(0, LIMITS.rows).map((row, rowIndex) => {
    if (!Array.isArray(row)) throw new TypeError(`rows[${rowIndex}] must be an array`)
    return row.slice(0, columns.length).map((cell, i) => String(cell).slice(0, LIMITS.text))
  })
  return { columns, rows }
}

function timelineData(data) {
  optObject(data, 'timeline.data')
  if (!Array.isArray(data.items)) throw new TypeError('timeline.data needs an `items` array')
  const items = data.items.slice(0, LIMITS.items).map((item, index) => {
    if (item === null || typeof item !== 'object') throw new TypeError(`items[${index}] must be an object`)
    const at = optStr(item.at, `items[${index}].at`, 40)
    const detail = optStr(item.detail, `items[${index}].detail`)
    return {
      ...(at === undefined ? {} : { at }),
      label: str(item.label, `items[${index}].label`, 120),
      ...(detail === undefined ? {} : { detail }),
    }
  })
  return { items }
}

function ganttData(data) {
  optObject(data, 'gantt.data')
  if (!Array.isArray(data.tasks)) throw new TypeError('gantt.data needs a `tasks` array')
  const tasks = data.tasks.slice(0, LIMITS.tasks).map((task, index) => {
    if (task === null || typeof task !== 'object') throw new TypeError(`tasks[${index}] must be an object`)
    const start = finite(task.start, `tasks[${index}].start`)
    const end = finite(task.end, `tasks[${index}].end`)
    if (end < start) throw new TypeError(`tasks[${index}].end must be >= start`)
    return {
      label: str(task.label, `tasks[${index}].label`, 80),
      start,
      end,
      ...(optStr(task.group, `tasks[${index}].group`, 40) === undefined
        ? {}
        : { group: optStr(task.group, `tasks[${index}].group`, 40) }),
    }
  })
  const unit = optStr(data.unit, 'data.unit', 16)
  return { tasks, ...(unit === undefined ? {} : { unit }) }
}

function metricsData(data) {
  optObject(data, 'metrics.data')
  if (!Array.isArray(data.items)) throw new TypeError('metrics.data needs an `items` array')
  const items = data.items.slice(0, LIMITS.metrics).map((item, index) => {
    if (item === null || typeof item !== 'object') throw new TypeError(`items[${index}] must be an object`)
    const delta = optStr(item.delta, `items[${index}].delta`, 40)
    const trend = item.trend === 'up' || item.trend === 'down' || item.trend === 'flat' ? item.trend : undefined
    return {
      label: str(item.label, `items[${index}].label`, 60),
      value: str(String(item.value), `items[${index}].value`, 40),
      ...(delta === undefined ? {} : { delta }),
      ...(trend === undefined ? {} : { trend }),
    }
  })
  const unit = optStr(data.unit, 'data.unit', 16)
  return { items, ...(unit === undefined ? {} : { unit }) }
}

function waterfallData(data) {
  optObject(data, 'waterfall.data')
  if (!Array.isArray(data.labels) || !Array.isArray(data.values)) {
    throw new TypeError('waterfall.data needs `labels` and `values` arrays')
  }
  const labels = data.labels.slice(0, LIMITS.labels).map((label, i) => str(label, `labels[${i}]`, 60))
  if (labels.length === 0) throw new TypeError('data.labels must not be empty')
  const values = data.values.slice(0, labels.length).map((value, i) => finite(value, `values[${i}]`))
  const unit = optStr(data.unit, 'data.unit', 16)
  const totalLabel = optStr(data.totalLabel, 'data.totalLabel', 40)
  return {
    labels,
    values,
    ...(unit === undefined ? {} : { unit }),
    ...(totalLabel === undefined ? {} : { totalLabel }),
  }
}

function heatmapData(data) {
  optObject(data, 'heatmap.data')
  if (!Array.isArray(data.rows) || !Array.isArray(data.columns) || !Array.isArray(data.values)) {
    throw new TypeError('heatmap.data needs `rows`, `columns` and `values` arrays')
  }
  const rows = data.rows.slice(0, LIMITS.matrixRows).map((row, i) => str(row, `rows[${i}]`, 40))
  const columns = data.columns.slice(0, LIMITS.matrixColumns).map((column, i) => str(column, `columns[${i}]`, 40))
  if (rows.length === 0 || columns.length === 0) throw new TypeError('heatmap rows/columns must not be empty')
  const values = data.values.slice(0, rows.length).map((row, rowIndex) => {
    if (!Array.isArray(row)) throw new TypeError(`values[${rowIndex}] must be an array`)
    return row.slice(0, columns.length).map((value, columnIndex) => finite(value, `values[${rowIndex}][${columnIndex}]`))
  })
  const unit = optStr(data.unit, 'data.unit', 16)
  return { rows, columns, values, ...(unit === undefined ? {} : { unit }) }
}

function flowData(data) {
  optObject(data, 'flow.data')
  if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
    throw new TypeError('flow.data needs `nodes` and `edges` arrays')
  }
  const nodes = data.nodes.slice(0, LIMITS.nodes).map((node, index) => {
    if (node === null || typeof node !== 'object') throw new TypeError(`nodes[${index}] must be an object`)
    const id = str(node.id, `nodes[${index}].id`, 40)
    const detail = optStr(node.detail, `nodes[${index}].detail`)
    return {
      id,
      label: str(node.label ?? id, `nodes[${index}].label`, 80),
      ...(detail === undefined ? {} : { detail }),
    }
  })
  if (nodes.length === 0) throw new TypeError('flow.data.nodes must not be empty')
  const ids = new Set(nodes.map((node) => node.id))
  if (ids.size !== nodes.length) throw new TypeError('flow.data.nodes ids must be unique')
  const edges = data.edges.slice(0, LIMITS.edges).map((edge, index) => {
    if (edge === null || typeof edge !== 'object') throw new TypeError(`edges[${index}] must be an object`)
    const from = str(edge.from, `edges[${index}].from`, 40)
    const to = str(edge.to, `edges[${index}].to`, 40)
    if (!ids.has(from) || !ids.has(to)) throw new TypeError(`edges[${index}] references an unknown node`)
    const label = optStr(edge.label, `edges[${index}].label`, 60)
    return { from, to, ...(label === undefined ? {} : { label }) }
  })
  // Reject cycles: the renderer draws layered DAGs only.
  const indegree = new Map(nodes.map((node) => [node.id, 0]))
  const outgoing = new Map(nodes.map((node) => [node.id, []]))
  for (const edge of edges) {
    indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1)
    outgoing.get(edge.from)?.push(edge.to)
  }
  const queue = [...indegree.entries()].filter(([, degree]) => degree === 0).map(([id]) => id)
  let visited = 0
  while (queue.length > 0) {
    const id = queue.shift()
    visited += 1
    for (const next of outgoing.get(id) ?? []) {
      indegree.set(next, (indegree.get(next) ?? 0) - 1)
      if (indegree.get(next) === 0) queue.push(next)
    }
  }
  if (visited !== nodes.length) throw new TypeError('flow.data.edges must form a DAG without cycles')
  return { nodes, edges }
}

const NORMALIZERS = {
  bar: seriesData,
  line: seriesData,
  area: seriesData,
  radar: seriesData,
  pie: slicesData,
  doughnut: slicesData,
  scatter: (data) => scatterData(data),
  compare: (data) => compareData(data),
  timeline: (data) => timelineData(data),
  gantt: (data) => ganttData(data),
  metrics: (data) => metricsData(data),
  waterfall: (data) => waterfallData(data),
  heatmap: (data) => heatmapData(data),
  flow: (data) => flowData(data),
}

/**
 * Validate and clip one model-supplied spec into the canonical persisted value.
 * @param input - frozen tool arguments.
 * @returns the normalized spec declared by the tool's output schema.
 */
export function normalize(input) {
  if (input === null || typeof input !== 'object') throw new TypeError('show_visual expects one object argument')
  const kind = input.kind
  if (!KINDS.includes(kind)) throw new TypeError(`kind must be one of ${KINDS.join(', ')}`)
  const title = str(input.title, 'title', 120)
  const data = input.data
  if (data === null || typeof data !== 'object') throw new TypeError('data must be an object')
  const subtitle = optStr(input.subtitle, 'subtitle', 160)
  const note = optStr(input.note, 'note')
  return {
    version: 3,
    kind,
    title,
    ...(subtitle === undefined ? {} : { subtitle }),
    ...(note === undefined ? {} : { note }),
    style: normalizeStyle(input.style),
    data: NORMALIZERS[kind](data),
  }
}
