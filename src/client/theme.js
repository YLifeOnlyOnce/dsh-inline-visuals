/* SPDX-License-Identifier: MIT */

const NAMES = {
  surface: '--dsw-alias-bg-layer-1',
  surfaceMuted: '--dsw-alias-bg-layer-2',
  border: '--dsw-alias-border-l1',
  text: '--dsw-alias-label-primary',
  muted: '--dsw-alias-label-secondary',
  accent: '--dsw-alias-brand-primary',
  success: '--dsw-alias-state-success-primary',
  warn: '--dsw-alias-state-warn-primary',
  error: '--dsw-alias-state-error-primary',
  idle: '--dsw-alias-state-idle-primary',
}

const FALLBACK = {
  surface: '#ffffff',
  surfaceMuted: '#f3f4f6',
  border: '#e5e7eb',
  text: '#1f2328',
  muted: '#8b929c',
  accent: '#1f6feb',
  success: '#1a7f37',
  warn: '#9a6700',
  error: '#cf222e',
  idle: '#d9dee5',
}

/** Resolve the host theme tokens once per render; unknown or missing tokens use fallbacks. */
export function readTokens() {
  const resolved = { ...FALLBACK }
  if (typeof document === 'undefined' || !document.documentElement) return resolved
  const style = getComputedStyle(document.documentElement)
  for (const [key, token] of Object.entries(NAMES)) {
    const value = style.getPropertyValue(token).trim()
    if (value) resolved[key] = value
  }
  return resolved
}

/** Series palette derived from semantic tokens (same order in light and dark). */
export function palette(tokens) {
  return [tokens.accent, tokens.success, tokens.warn, tokens.error, tokens.idle]
}

/** Convert a CSS color (hex or rgb/rgba) to an rgba with the requested alpha. */
export function toAlpha(color, alpha) {
  const value = color.trim()
  if (/^#[0-9a-f]{6}$/i.test(value)) {
    const r = parseInt(value.slice(1, 3), 16)
    const g = parseInt(value.slice(3, 5), 16)
    const b = parseInt(value.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    const r = parseInt(value[1] + value[1], 16)
    const g = parseInt(value[2] + value[2], 16)
    const b = parseInt(value[3] + value[3], 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  const rgb = value.match(/^rgba?\(([^)]+)\)$/)
  if (rgb) {
    const [r, g, b] = rgb[1].split(',').map((part) => Number.parseFloat(part))
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return `rgba(31, 111, 235, ${alpha})`
}
