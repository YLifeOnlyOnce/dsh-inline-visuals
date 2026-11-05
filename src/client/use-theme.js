/* SPDX-License-Identifier: MIT */

import { useEffect, useState } from 'react'

/** Re-render subscribed components when the page theme (class/style/data-theme or OS scheme) changes. */
export function useThemeVersion() {
  const [version, setVersion] = useState(0)
  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    const bump = () => setVersion((value) => value + 1)
    const observer = new MutationObserver(bump)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] })
    const query = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : undefined
    query?.addEventListener?.('change', bump)
    return () => {
      observer.disconnect()
      query?.removeEventListener?.('change', bump)
    }
  }, [])
  return version
}
