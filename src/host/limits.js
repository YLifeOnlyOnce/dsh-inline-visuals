/* SPDX-License-Identifier: MIT */

/** Visual kinds understood by the Host normalizer and the Client renderer. */
export const KINDS = [
  'bar', 'line', 'area', 'pie', 'doughnut', 'scatter', 'radar', 'waterfall', 'heatmap',
  'compare', 'timeline', 'gantt', 'metrics',
]

/** Named palettes; the Client resolves them against host theme tokens. */
export const PALETTES = ['default', 'mono', 'cool', 'warm', 'success']

/** Per-kind presentation options the model may set through `style`. */
export const STYLE_DEFAULTS = {
  palette: 'default',
  legend: 'auto',
  height: 240,
  density: 'normal',
  values: false,
  grid: true,
  orientation: 'vertical',
  stacked: false,
  curve: 'smooth',
  points: true,
  trendLine: false,
}

/** Upper bounds that keep a card readable and its persisted meta small. */
export const LIMITS = {
  labels: 40,
  series: 6,
  rows: 30,
  columns: 8,
  items: 30,
  tasks: 20,
  metrics: 12,
  slices: 12,
  points: 240,
  matrixRows: 12,
  matrixColumns: 12,
  text: 240,
}
