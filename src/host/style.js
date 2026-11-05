/* SPDX-License-Identifier: MIT */

import { PALETTES, STYLE_DEFAULTS } from './limits.js'

const LEGENDS = ['auto', 'bottom', 'top', 'none']
const DENSITIES = ['compact', 'normal']
const ORIENTATIONS = ['vertical', 'horizontal']
const CURVES = ['linear', 'smooth', 'step']
const SCALES = ['linear', 'log']

function oneOf(value, allowed, field) {
  if (value === undefined) return undefined
  if (!allowed.includes(value)) throw new TypeError(`${field} must be one of ${allowed.join(', ')}`)
  return value
}

function bool(value, field) {
  if (value === undefined) return undefined
  if (typeof value !== 'boolean') throw new TypeError(`${field} must be a boolean`)
  return value
}

/**
 * Validate the optional `style` block and fill defaults. Style only affects
 * presentation; it never changes the data or the persisted semantics.
 * @param raw - model-supplied style object (may be undefined).
 * @returns a complete style object.
 */
export function normalizeStyle(raw) {
  if (raw === undefined || raw === null) return { ...STYLE_DEFAULTS }
  if (typeof raw !== 'object' || Array.isArray(raw)) throw new TypeError('style must be an object')
  const style = { ...STYLE_DEFAULTS }

  const palette = oneOf(raw.palette, PALETTES, 'style.palette')
  if (palette !== undefined) style.palette = palette
  const legend = oneOf(raw.legend, LEGENDS, 'style.legend')
  if (legend !== undefined) style.legend = legend
  const density = oneOf(raw.density, DENSITIES, 'style.density')
  if (density !== undefined) style.density = density
  const orientation = oneOf(raw.orientation, ORIENTATIONS, 'style.orientation')
  if (orientation !== undefined) style.orientation = orientation
  const curve = oneOf(raw.curve, CURVES, 'style.curve')
  if (curve !== undefined) style.curve = curve
  const values = bool(raw.values, 'style.values')
  if (values !== undefined) style.values = values
  const grid = bool(raw.grid, 'style.grid')
  if (grid !== undefined) style.grid = grid
  const stacked = bool(raw.stacked, 'style.stacked')
  if (stacked !== undefined) style.stacked = stacked
  const points = bool(raw.points, 'style.points')
  if (points !== undefined) style.points = points
  const trendLine = bool(raw.trendLine, 'style.trendLine')
  if (trendLine !== undefined) style.trendLine = trendLine
  const xScale = oneOf(raw.xScale, SCALES, 'style.xScale')
  if (xScale !== undefined) style.xScale = xScale
  const yScale = oneOf(raw.yScale, SCALES, 'style.yScale')
  if (yScale !== undefined) style.yScale = yScale
  const errorBars = bool(raw.errorBars, 'style.errorBars')
  if (errorBars !== undefined) style.errorBars = errorBars
  const baseline = bool(raw.baseline, 'style.baseline')
  if (baseline !== undefined) style.baseline = baseline
  if (raw.smoothing !== undefined) {
    if (typeof raw.smoothing !== 'number' || !Number.isFinite(raw.smoothing)) {
      throw new TypeError('style.smoothing must be a finite number')
    }
    style.smoothing = Math.min(0.9, Math.max(0, raw.smoothing))
  }

  if (raw.height !== undefined) {
    if (typeof raw.height !== 'number' || !Number.isFinite(raw.height)) {
      throw new TypeError('style.height must be a finite number')
    }
    style.height = Math.min(420, Math.max(160, Math.round(raw.height)))
  }
  return style
}
