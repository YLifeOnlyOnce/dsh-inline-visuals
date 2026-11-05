/* SPDX-License-Identifier: MIT */

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function merge(base, patch) {
  const next = isPlainObject(base) ? { ...base } : {}
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) {
      delete next[key]
    } else if (isPlainObject(value)) {
      next[key] = merge(next[key], value)
    } else {
      next[key] = value
    }
  }
  return next
}

/**
 * Apply a partial visual spec onto a previous one: nested objects merge, arrays
 * replace (so a new `labels`/`series` wins wholesale), `null` deletes a key.
 * @param previous - the normalized spec being revised.
 * @param patch - model-supplied partial spec.
 * @returns the merged candidate, still to be validated by normalize().
 */
export function applyPatch(previous, patch) {
  if (!isPlainObject(previous)) throw new TypeError('previous visual spec is required')
  if (!isPlainObject(patch)) throw new TypeError('patch must be an object')
  return merge(previous, patch)
}
