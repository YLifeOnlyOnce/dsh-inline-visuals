/* SPDX-License-Identifier: MIT */

const VERSION_FLOOR = 1

/**
 * Decide whether a persisted `tool/result.meta` value can be rendered.
 * Forward-compatible: every spec version from 1 upward is accepted, because
 * later versions only added kinds/fields; historical v1/v2 specs keep replaying.
 * @param spec - candidate meta from the tool result.
 * @returns true when the value looks like a visual spec this renderer understands.
 */
export function isSupportedSpec(spec) {
  return Boolean(
    spec
    && typeof spec === 'object'
    && Number.isInteger(spec.version)
    && spec.version >= VERSION_FLOOR
    && typeof spec.kind === 'string'
    && spec.data !== null
    && typeof spec.data === 'object',
  )
}
