/* SPDX-License-Identifier: MIT */

function cell(value) {
  const text = value === undefined || value === null ? '' : String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function rowsToCsv(rows) {
  return rows.map((row) => row.map(cell).join(',')).join('\n')
}

/**
 * Serialize a visual's data to CSV for spreadsheets. Presentation styles are ignored.
 * @param spec - normalized visual spec.
 * @returns CSV text, or undefined for kinds without a tabular form.
 */
export function toCsv(spec) {
  const data = spec.data
  switch (spec.kind) {
    case 'bar':
    case 'line':
    case 'area':
    case 'radar': {
      const header = ['label', ...data.series.map((entry) => entry.name)]
      const rows = data.labels.map((label, index) => [label, ...data.series.map((entry) => entry.values[index] ?? '')])
      return rowsToCsv([header, ...rows])
    }
    case 'pie':
    case 'doughnut':
      return rowsToCsv([['label', 'value'], ...data.slices.map((slice) => [slice.label, slice.value])])
    case 'scatter':
      return rowsToCsv([['x', 'y', 'label'], ...data.points.map((point) => [point.x, point.y, point.label ?? ''])])
    case 'waterfall': {
      const rows = []
      let running = 0
      data.labels.forEach((label, index) => {
        const value = data.values[index] ?? 0
        running += value
        rows.push([label, value, running])
      })
      return rowsToCsv([['label', 'delta', 'cumulative'], ...rows])
    }
    case 'compare':
      return rowsToCsv([data.columns, ...data.rows])
    case 'timeline':
      return rowsToCsv([['at', 'label', 'detail'], ...data.items.map((item) => [item.at ?? '', item.label, item.detail ?? ''])])
    case 'gantt':
      return rowsToCsv([['label', 'start', 'end'], ...data.tasks.map((task) => [task.label, task.start, task.end])])
    case 'metrics':
      return rowsToCsv([['label', 'value', 'delta', 'trend'], ...data.items.map((item) => [item.label, item.value, item.delta ?? '', item.trend ?? ''])])
    case 'heatmap':
      return rowsToCsv([[''], ...data.rows.map((row, index) => [row, ...(data.values[index] ?? [])])].map((row, index) => index === 0 ? ['row', ...data.columns] : row))
    case 'flow':
      return rowsToCsv([['from', 'to', 'label'], ...data.edges.map((edge) => [edge.from, edge.to, edge.label ?? ''])])
    case 'curve':
      return rowsToCsv([['x', 'y', 'label'], ...data.points.map((point) => [point.x, point.y, point.label ?? ''])])
    case 'confusion':
      return rowsToCsv([['label', ...data.labels], ...data.labels.map((label, index) => [label, ...(data.matrix[index] ?? [])])])
    case 'histogram':
      return rowsToCsv([['start', 'end', 'count'], ...data.bins.map((bin) => [bin.start, bin.end, bin.count])])
    case 'leaderboard':
      return rowsToCsv([
        ['model', ...data.metrics.map((metric) => metric.label)],
        ...data.rows.map((row) => [row.name, ...row.values]),
      ])
    default:
      return undefined
  }
}
