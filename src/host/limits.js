/* SPDX-License-Identifier: MIT */

/** Visual kinds understood by the Host normalizer and the Client renderer. */
export const KINDS = [
  'bar', 'line', 'area', 'pie', 'doughnut', 'scatter', 'radar',
  'compare', 'timeline', 'gantt', 'metrics',
]

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
  text: 240,
}
