/* SPDX-License-Identifier: MIT */
/**
 * Browser half of `@community/dsh-inline-visuals`.
 *
 * Registers one renderer in the keyed `tool.call.toolview` slot for the wire tool name
 * `show_visual`. The visual spec arrives as `block.meta` on the durable tool result, so a
 * reloaded, reopened, or forked session renders the same card without re-running the model.
 *
 * Only `react` is required from the browser module table; colors come from host theme tokens.
 */
window.__ModuleLoader__.load({
  id: '@community/dsh-inline-visuals',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    /** Theme-token palette keeps charts legible in light and dark themes. */
    const PALETTE = [
      'var(--dsw-alias-brand-primary)',
      'var(--dsw-alias-state-success-primary)',
      'var(--dsw-alias-state-warn-primary)',
      'var(--dsw-alias-state-error-primary)',
      'var(--dsw-alias-state-idle-primary)',
    ]

    const TOKENS = {
      surface: 'var(--dsw-alias-bg-layer-1)',
      border: 'var(--dsw-alias-border-l1)',
      text: 'var(--dsw-alias-label-primary)',
      muted: 'var(--dsw-alias-label-secondary)',
      accent: 'var(--dsw-alias-brand-primary)',
      idle: 'var(--dsw-alias-state-idle-primary)',
    }

    const COPY = {
      zh: {
        copy: '复制数据',
        copied: '已复制',
        showData: '查看数据',
        hideData: '隐藏数据',
        empty: '没有可渲染的数据',
        loading: '正在渲染可视化…',
        units: '',
      },
      en: {
        copy: 'Copy data',
        copied: 'Copied',
        showData: 'Show data',
        hideData: 'Hide data',
        empty: 'No data to render',
        loading: 'Rendering visual…',
        units: '',
      },
    }

    function pickCopy(locale) {
      return typeof locale === 'string' && /^zh/i.test(locale) ? COPY.zh : COPY.en
    }

    function fmt(value, unit) {
      const text = Math.abs(value) >= 100 ? String(Math.round(value)) : String(Math.round(value * 100) / 100)
      return unit ? text + unit : text
    }

    function legend(series) {
      if (series.length <= 1 && !series[0]) return null
      return h('div', {
        style: {
          display: 'flex', flexWrap: 'wrap', gap: '12px',
          margin: '2px 0 10px', color: TOKENS.muted, fontSize: '12px',
        },
      }, series.map((entry, index) => h('span', {
        key: entry.name + index,
        style: { display: 'inline-flex', alignItems: 'center', gap: '6px' },
      }, h('span', {
        style: {
          width: '8px', height: '8px', borderRadius: '2px',
          background: PALETTE[index % PALETTE.length],
        },
      }), entry.name)))
    }

    function emptyState(t) {
      return h('div', { style: { color: TOKENS.muted, fontSize: '13px', padding: '12px 0' } }, t('empty'))
    }

    /** Grouped bar chart; supports negative values around a zero baseline. */
    function BarChart({ spec, t }) {
      const data = spec.data || {}
      const labels = Array.isArray(data.labels) ? data.labels : []
      const series = Array.isArray(data.series) ? data.series : []
      if (labels.length === 0 || series.length === 0) return emptyState(t)
      const W = 640
      const H = 240
      const P = { left: 44, right: 12, top: 14, bottom: 46 }
      const plotW = W - P.left - P.right
      const plotH = H - P.top - P.bottom
      const values = series.reduce((all, entry) => all.concat(entry.values || []), [])
      const top = Math.max(0, ...values)
      const bottom = Math.min(0, ...values)
      const span = top - bottom || 1
      const groupW = plotW / labels.length
      const barW = Math.max(3, Math.min(26, (groupW - 10) / series.length))
      const y = value => P.top + plotH - ((value - bottom) / span) * plotH
      const zeroY = y(0)
      const grid = [0, 0.5, 1].map(ratio => {
        const value = bottom + span * ratio
        const gy = y(value)
        return h('g', { key: 'grid-' + ratio },
          h('line', {
            x1: P.left, x2: W - P.right, y1: gy, y2: gy,
            stroke: TOKENS.border, strokeWidth: 1, strokeDasharray: ratio === 0 ? '0' : '3 4',
          }),
          h('text', {
            x: P.left - 8, y: gy + 4, textAnchor: 'end',
            fill: TOKENS.muted, fontSize: 10,
          }, fmt(value, data.unit)))
      })
      const groups = labels.map((label, labelIndex) => {
        const startX = P.left + groupW * labelIndex + (groupW - barW * series.length) / 2
        const bars = series.map((entry, seriesIndex) => {
          const value = entry.values && typeof entry.values[labelIndex] === 'number' ? entry.values[labelIndex] : 0
          const topY = Math.min(y(value), zeroY)
          const height = Math.max(1, Math.abs(zeroY - y(value)))
          return h('rect', {
            key: 'bar-' + labelIndex + '-' + seriesIndex,
            x: startX + seriesIndex * barW,
            y: topY,
            width: Math.max(2, barW - 3),
            height,
            rx: 2,
            fill: PALETTE[seriesIndex % PALETTE.length],
          })
        })
        const xText = P.left + groupW * labelIndex + groupW / 2
        const short = label.length > 10 ? label.slice(0, 9) + '…' : label
        return h('g', { key: 'group-' + labelIndex }, bars,
          h('text', {
            x: xText, y: H - P.bottom + 18, textAnchor: 'middle',
            fill: TOKENS.muted, fontSize: 10,
          }, short))
      })
      return h('svg', {
        viewBox: '0 0 ' + W + ' ' + H,
        width: '100%', role: 'img',
        'aria-label': (spec.title || 'bar chart') + ': ' + labels.join(', '),
      }, grid, groups,
        h('line', {
          x1: P.left, x2: W - P.right, y1: zeroY, y2: zeroY,
          stroke: TOKENS.border, strokeWidth: 1,
        }))
    }

    /** Multi-series line chart with dots and a light area fill for one series. */
    function LineChart({ spec, t }) {
      const data = spec.data || {}
      const labels = Array.isArray(data.labels) ? data.labels : []
      const series = Array.isArray(data.series) ? data.series : []
      if (labels.length === 0 || series.length === 0) return emptyState(t)
      const W = 640
      const H = 240
      const P = { left: 44, right: 14, top: 16, bottom: 42 }
      const plotW = W - P.left - P.right
      const plotH = H - P.top - P.bottom
      const values = series.reduce((all, entry) => all.concat(entry.values || []), [])
      const top = Math.max(0, ...values)
      const bottom = Math.min(0, ...values)
      const span = top - bottom || 1
      const x = index => labels.length === 1
        ? P.left + plotW / 2
        : P.left + (plotW * index) / (labels.length - 1)
      const y = value => P.top + plotH - ((value - bottom) / span) * plotH
      const grid = [0, 0.5, 1].map(ratio => {
        const value = bottom + span * ratio
        const gy = y(value)
        return h('g', { key: 'grid-' + ratio },
          h('line', {
            x1: P.left, x2: W - P.right, y1: gy, y2: gy,
            stroke: TOKENS.border, strokeWidth: 1, strokeDasharray: ratio === 0 ? '0' : '3 4',
          }),
          h('text', { x: P.left - 8, y: gy + 4, textAnchor: 'end', fill: TOKENS.muted, fontSize: 10 }, fmt(value, data.unit)))
      })
      const paths = series.map((entry, seriesIndex) => {
        const color = PALETTE[seriesIndex % PALETTE.length]
        const points = (entry.values || []).map((value, index) => x(index) + ',' + y(value))
        return h('g', { key: 'series-' + seriesIndex },
          h('polyline', {
            points: points.join(' '),
            fill: 'none', stroke: color, strokeWidth: 2,
            strokeLinejoin: 'round', strokeLinecap: 'round',
          }),
          (entry.values || []).map((value, index) => h('circle', {
            key: 'dot-' + seriesIndex + '-' + index,
            cx: x(index), cy: y(value), r: 3, fill: color,
          })))
      })
      const labelsRow = labels.map((label, index) => h('text', {
        key: 'label-' + index,
        x: x(index), y: H - P.bottom + 18, textAnchor: 'middle',
        fill: TOKENS.muted, fontSize: 10,
      }, label.length > 10 ? label.slice(0, 9) + '…' : label))
      return h('svg', {
        viewBox: '0 0 ' + W + ' ' + H,
        width: '100%', role: 'img',
        'aria-label': (spec.title || 'line chart') + ': ' + labels.join(', '),
      }, grid, paths, labelsRow)
    }

    function CompareTable({ spec, t }) {
      const data = spec.data || {}
      const columns = Array.isArray(data.columns) ? data.columns : []
      const rows = Array.isArray(data.rows) ? data.rows : []
      if (columns.length === 0) return emptyState(t)
      const th = columns.map((column, index) => h('th', {
        key: 'th-' + index,
        style: {
          textAlign: index === 0 ? 'left' : 'center',
          padding: '8px 12px', fontWeight: 600, fontSize: '12px',
          color: TOKENS.muted, borderBottom: '1px solid ' + TOKENS.border,
          whiteSpace: 'nowrap',
        },
      }, column))
      const body = rows.map((row, rowIndex) => h('tr', { key: 'row-' + rowIndex },
        columns.map((_, columnIndex) => h('td', {
          key: 'cell-' + rowIndex + '-' + columnIndex,
          style: {
            textAlign: columnIndex === 0 ? 'left' : 'center',
            padding: '8px 12px', fontSize: '13px', color: TOKENS.text,
            borderBottom: rowIndex === rows.length - 1 ? 'none' : '1px solid ' + TOKENS.border,
          },
        }, row[columnIndex] === undefined ? '' : String(row[columnIndex])))))
      return h('div', { style: { overflowX: 'auto' } },
        h('table', { style: { borderCollapse: 'collapse', width: '100%' } },
          h('thead', null, h('tr', null, th)),
          h('tbody', null, body)))
    }

    function Timeline({ spec, t }) {
      const data = spec.data || {}
      const items = Array.isArray(data.items) ? data.items : []
      if (items.length === 0) return emptyState(t)
      const rows = items.map((item, index) => {
        const dot = h('span', {
          style: {
            flex: '0 0 auto', marginTop: '5px', width: '9px', height: '9px',
            borderRadius: '50%', background: index === items.length - 1 ? TOKENS.accent : TOKENS.idle,
          },
        })
        const at = h('span', {
          style: {
            flex: '0 0 auto', minWidth: '56px', color: TOKENS.muted,
            fontSize: '12px', fontVariantNumeric: 'tabular-nums',
          },
        }, item.at || '')
        const label = h('span', { style: { display: 'block', color: TOKENS.text, fontSize: '13px' } }, item.label)
        const detail = item.detail
          ? h('span', { style: { display: 'block', color: TOKENS.muted, fontSize: '12px', marginTop: '2px' } }, item.detail)
          : null
        return h('li', {
          key: 'item-' + index,
          style: {
            display: 'flex', gap: '12px', padding: '8px 0',
            borderBottom: index === items.length - 1 ? 'none' : '1px solid ' + TOKENS.border,
          },
        }, dot, at, h('span', { style: { flex: '1 1 auto', minWidth: 0 } }, label, detail))
      })
      return h('ol', { style: { listStyle: 'none', margin: 0, padding: 0 } }, rows)
    }

    function ChartBody({ spec, t }) {
      if (spec.kind === 'bar') return h(BarChart, { spec, t })
      if (spec.kind === 'line') return h(LineChart, { spec, t })
      if (spec.kind === 'compare') return h(CompareTable, { spec, t })
      if (spec.kind === 'timeline') return h(Timeline, { spec, t })
      return emptyState(t)
    }

    /**
     * The whole card. `props.phase` is `preparing` | `start` | `result`; only the settled
     * result carries `block.meta`, the persisted visual spec.
     */
    function InlineVisual(props) {
      const t = props.t
      const spec = props.phase === 'result' && props.block ? props.block.meta : undefined
      const [showData, setShowData] = React.useState(false)
      const [copied, setCopied] = React.useState(false)

      if (props.phase !== 'result') {
        return h('div', {
          style: {
            border: '1px dashed ' + TOKENS.border, borderRadius: '10px',
            padding: '14px 16px', color: TOKENS.muted, fontSize: '13px',
          },
        }, t('loading'))
      }

      if (!spec || typeof spec !== 'object' || spec.version !== 1) {
        return h('div', {
          style: {
            border: '1px solid ' + TOKENS.border, borderRadius: '10px',
            background: TOKENS.surface, padding: '14px 16px',
            color: TOKENS.muted, fontSize: '13px',
          },
        }, t('empty'))
      }

      const onCopy = () => {
        const payload = JSON.stringify(spec, null, 2)
        const done = () => setCopied(true)
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(payload).then(done, () => {})
        }
      }

      const data = spec.data || {}
      const series = Array.isArray(data.series) ? data.series : []
      return h('figure', {
        style: {
          margin: '4px 0', padding: '14px 16px',
          border: '1px solid ' + TOKENS.border, borderRadius: '10px',
          background: TOKENS.surface, color: TOKENS.text,
          fontFamily: 'inherit', fontSize: '13px',
        },
      },
      h('figcaption', null,
        h('div', {
          style: {
            display: 'flex', alignItems: 'baseline', gap: '8px',
            flexWrap: 'wrap', marginBottom: '10px',
          },
        }, h('strong', { style: { fontSize: '14px', fontWeight: 600 } }, spec.title),
        spec.subtitle ? h('span', { style: { color: TOKENS.muted, fontSize: '12px' } }, spec.subtitle) : null),
        series.length > 0 ? legend(series) : null),
      h(ChartBody, { spec, t }),
      spec.note ? h('p', {
        style: { margin: '10px 0 0', color: TOKENS.muted, fontSize: '12px' },
      }, spec.note) : null,
      showData ? h('pre', {
        style: {
          margin: '10px 0 0', padding: '10px', overflow: 'auto',
          maxHeight: '220px', borderRadius: '8px',
          background: 'var(--dsw-alias-bg-layer-2)',
          color: TOKENS.muted, fontSize: '11px',
        },
      }, JSON.stringify(spec.data, null, 2)) : null,
      h('div', {
        style: { display: 'flex', gap: '8px', marginTop: '10px' },
      },
      h('button', {
        type: 'button',
        onClick: onCopy,
        style: {
          border: '1px solid ' + TOKENS.border, borderRadius: '6px',
          background: 'transparent', color: TOKENS.muted,
          fontSize: '12px', padding: '3px 8px', cursor: 'pointer',
        },
      }, copied ? t('copied') : t('copy')),
      h('button', {
        type: 'button',
        'aria-pressed': showData,
        onClick: () => setShowData(value => !value),
        style: {
          border: '1px solid ' + TOKENS.border, borderRadius: '6px',
          background: 'transparent', color: TOKENS.muted,
          fontSize: '12px', padding: '3px 8px', cursor: 'pointer',
        },
      }, showData ? t('hideData') : t('showData'))))
    }

    /** Keep one crashing card from blanking the whole chat row. */
    class Boundary extends React.Component {
      constructor(props) {
        super(props)
        this.state = { error: null }
      }

      static getDerivedStateFromError(error) {
        return { error }
      }

      render() {
        if (this.state.error) {
          return h('div', {
            style: {
              border: '1px solid var(--dsw-alias-state-error-primary)',
              borderRadius: '10px', padding: '12px 14px',
              color: 'var(--dsw-alias-state-error-primary)', fontSize: '12px',
            },
          }, 'inline-visuals: ' + String(this.state.error && this.state.error.message ? this.state.error.message : this.state.error))
        }
        return this.props.children
      }
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        const NS = 'inlineVisuals'
        let copy = pickCopy(typeof navigator === 'undefined' ? 'en' : navigator.language)
        try {
          ctx.effect(() => ctx.locale.register(NS, { zh: COPY.zh, en: COPY.en }), 'inline-visuals: copy')
          const bound = ctx.locale.bind(NS)
          copy = COPY.zh
          const translate = key => {
            const value = bound(key)
            return typeof value === 'string' && value.length > 0 ? value : key
          }
          const t = key => translate(key)
          const View = props => h(Boundary, null, h(InlineVisual, Object.assign({}, props, { t })))
          ctx.slots.inject('tool.call.toolview', () => ctx.slots.register({
            name: 'tool.call.toolview',
            key: 'show_visual',
          }, View))
          return
        } catch (error) {
          console.warn('inline-visuals: locale unavailable, using navigator.language', error)
        }
        const t = key => copy[key] || key
        const View = props => h(Boundary, null, h(InlineVisual, Object.assign({}, props, { t })))
        ctx.slots.inject('tool.call.toolview', () => ctx.slots.register({
          name: 'tool.call.toolview',
          key: 'show_visual',
        }, View))
      },
    }
  },
})
