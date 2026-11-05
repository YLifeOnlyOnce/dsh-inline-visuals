/* SPDX-License-Identifier: MIT */

import { KINDS } from './limits.js'

// Single source of truth: adding a kind must not require editing the history lookup.
const VISUAL_KINDS = new Set(KINDS)

function isVisualMeta(meta) {
  return meta !== null && typeof meta === 'object' && VISUAL_KINDS.has(meta.kind) && meta.data !== undefined
}

/**
 * Find the most recent visual spec in one agent session, or one specific call id.
 * The visual specs live on durable `tool/result` events, so this survives reloads.
 * @param session - the owning agent's session.
 * @param target - `undefined`/`'last'` for the latest visual, otherwise a tool call id.
 * @returns the persisted spec, or undefined when none exists.
 */
export function findPreviousSpec(session, target) {
  if (session === undefined || session === null) return undefined
  const events = typeof session.ownEvents === 'function' ? session.ownEvents() : session.events
  if (!Array.isArray(events)) return undefined
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index]
    if (event?.type !== 'tool/result') continue
    const meta = event.data?.meta
    if (!isVisualMeta(meta)) continue
    if (target !== undefined && target !== null && target !== 'last') {
      const callId = event.data?.message?.source?.callId
      if (callId !== target) continue
    }
    return meta
  }
  return undefined
}
