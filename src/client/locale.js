/* SPDX-License-Identifier: MIT */

export const NS = 'inlineVisuals'

export const COPY = {
  zh: {
    copy: '复制数据',
    copied: '已复制',
    showData: '查看数据',
    hideData: '隐藏数据',
    exportPng: '导出 PNG',
    loading: '正在渲染可视化…',
    empty: '没有可渲染的数据',
    unknown: '未知图型',
  },
  en: {
    copy: 'Copy data',
    copied: 'Copied',
    showData: 'Show data',
    hideData: 'Hide data',
    exportPng: 'Export PNG',
    loading: 'Rendering visual…',
    empty: 'No data to render',
    unknown: 'Unknown visual kind',
  },
}

/** Copy pack for the host locale; falls back to the browser language in plain-JS mode. */
export function fallbackCopy() {
  const language = typeof navigator === 'undefined' ? 'en' : navigator.language || 'en'
  return /^zh/i.test(language) ? COPY.zh : COPY.en
}
