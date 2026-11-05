/* SPDX-License-Identifier: MIT */

import { KINDS } from '../host/limits.js'
import { isSupportedSpec } from './spec.js'

/** Conversation turn-data key this plugin publishes. */
export const VISUAL_TURN_KIND = 'inline-visuals'

const VISUAL_KINDS = new Set(KINDS)

function isVisualMeta(meta) {
  return isSupportedSpec(meta) && VISUAL_KINDS.has(meta.kind)
}

/**
 * Turn Definition that records the visuals settled in one Turn.
 *
 * It publishes no Chat node: the Turn tail's list entry reads the recorded specs
 * and renders the final figure beneath the answer prose, outside the collapsible
 * Tool group. Only append-origin `tool/result` events count, so landed
 * replacements do not duplicate the transcript.
 * @returns the Conversation node definition for the `inline-visuals` turn data.
 */
export function visualTurnDefinition() {
  return {
    kind: VISUAL_TURN_KIND,
    match: (event) => {
      if (event.type === 'turn/start') return { id: String(event.data.turn), role: 'start' }
      if (event.type === 'tool/result' && event.surfaceOp === 'append') {
        return { id: String(event.data.turn), role: 'update' }
      }
      return null
    },
    start: (_context, match) => {
      if (match.event.type !== 'turn/start') throw new Error('inline-visuals turn data requires turn/start')
      return { turn: match.event.data.turn, visuals: [] }
    },
    update: (context, match) => {
      if (match.event.type !== 'tool/result') return context.state
      const meta = match.event.data.meta
      if (!isVisualMeta(meta)) return context.state
      if (match.event.data.message?.isError === true) return context.state
      return {
        ...context.state,
        visuals: [...context.state.visuals, { seq: match.event.seq, spec: meta }],
      }
    },
    buildLocationData: (context, scope, previous) => {
      if (scope !== 'turn' || context.state === undefined) return null
      const value = { visuals: context.state.visuals }
      if (previous?.kind === 'turn'
        && previous.turn === context.state.turn
        && previous.key === VISUAL_TURN_KIND
        && previous.value?.visuals === value.visuals) return previous
      return { kind: 'turn', turn: context.state.turn, key: VISUAL_TURN_KIND, value }
    },
  }
}

/**
 * Pick the figure a completed Turn should show in its answer body.
 * The latest settled visual wins, so repeated `edit_visual` revisions collapse
 * into one final figure instead of a history of intermediate charts.
 * @param data - the turn's published `inline-visuals` data (if any).
 * @param bound - the Turn's closing sequence (or the owner's sequence).
 * @returns the latest visual settled at or before the bound, or undefined.
 */
export function latestTurnVisual(data, bound) {
  if (data === undefined || data === null || !Array.isArray(data.visuals)) return undefined
  let latest
  for (const item of data.visuals) {
    if (item.seq > bound) continue
    latest = item
  }
  return latest
}
