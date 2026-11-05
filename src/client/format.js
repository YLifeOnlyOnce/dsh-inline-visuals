/* SPDX-License-Identifier: MIT */

/** Compact number formatting shared by the card footer and the chart tooltips. */
export function fmt(value, unit) {
  const rounded = Math.abs(value) >= 1000 ? Math.round(value) : Math.round(value * 100) / 100
  return unit ? `${rounded}${unit}` : String(rounded)
}
