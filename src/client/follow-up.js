/* SPDX-License-Identifier: MIT */

function fmt(value, unit) {
  const rounded = Math.abs(value) >= 1000 ? Math.round(value) : Math.round(value * 100) / 100
  return unit ? `${rounded}${unit}` : String(rounded)
}

/**
 * Build the prompt inserted when a user clicks a data point to ask about it.
 * Pure so the interaction is testable without a browser.
 * @param spec - the visual the point belongs to.
 * @param pick - `{ label, series, value }` from the clicked element.
 * @param locale - `zh` or `en` copy.
 * @returns a short follow-up prompt.
 */
export function buildFollowUp(spec, pick, locale = 'zh') {
  const unit = spec.data.unit ?? ''
  const value = typeof pick.value === 'number' ? fmt(pick.value, unit) : String(pick.value ?? '')
  const series = pick.series && pick.series !== spec.title ? `（${pick.series}）` : ''
  const at = pick.label ? `「${pick.label}${series}」` : ''
  if (locale === 'en') {
    const seriesText = pick.series ? ` (${pick.series})` : ''
    return `In the visual "${spec.title}", explain ${pick.label ?? 'the selected point'}${seriesText} = ${value}. `
      + 'What drives it and what should I do next?'
  }
  return `关于「${spec.title}」里的${at}数据点（${value}），展开分析一下：为什么会这样、下一步该怎么做？`
}
