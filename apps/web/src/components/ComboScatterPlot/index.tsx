import {
  Chart as ChartJS,
  ChartOptions,
  Element,
  LinearScale,
  Plugin,
  PointElement,
  ScatterController,
  Tooltip,
} from 'chart.js'
import zoomPlugin from 'chartjs-plugin-zoom'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Scatter } from 'react-chartjs-2'
import { Select } from '~/components/ui/Select'
import { allUnavailableCombos } from '~/screens/Player/utils'
import { cn, formatNumber, pluralize } from '~/utils'
import {
  ComboHighlight,
  ComboPoint,
  countCombosInView,
  getComboPoints,
  getWinRateGuides,
  matchesComboHighlight,
  ScatterMetric,
} from './data'

ChartJS.register(ScatterController, LinearScale, PointElement, Tooltip)

const preferredElement = <T extends { element: Element }>(items: T[]) =>
  items.find(
    ({ element }) => element instanceof PointElement && element.options.borderWidth === 2,
  ) ??
  items.find(
    ({ element }) => element instanceof PointElement && element.options.borderWidth === 1,
  ) ??
  items[0]

const comboAnnotations: Plugin<'scatter'> = {
  id: 'combo-annotations',
  beforeDatasetsDraw(chart) {
    const dataset = chart.data.datasets[0]
    if (
      dataset?.label !== 'Wins' ||
      !dataset.data.some((point) => point && typeof point === 'object' && (point.y ?? 0) > 0)
    )
      return

    const {
      ctx,
      scales: { x, y },
      chartArea,
    } = chart
    ctx.save()
    ctx.beginPath()
    ctx.rect(chartArea.left, chartArea.top, chartArea.width, chartArea.height)
    ctx.clip()
    ctx.strokeStyle = String(chart.options.borderColor)
    ctx.fillStyle = String(chart.options.color)
    ctx.font = '12px sans-serif'
    ctx.lineWidth = 1

    const labels: Array<{ x: number; y: number; width: number }> = []
    for (const guide of getWinRateGuides(x.max, y.max, {
      minGames: x.min,
      minWins: y.min,
    }).reverse()) {
      const endX = x.getPixelForValue(guide.games)
      const endY = y.getPixelForValue(guide.wins)
      ctx.beginPath()
      ctx.moveTo(x.getPixelForValue(guide.startGames), y.getPixelForValue(guide.startWins))
      ctx.lineTo(endX, endY)
      ctx.stroke()

      const label = `${formatNumber(guide.rate * 100, { maximumSignificantDigits: 3 })}%`
      const width = ctx.measureText(label).width
      const labelX = Math.min(endX + 4, chartArea.right - width - 4)
      const labelY = Math.max(chartArea.top + 12, endY <= chartArea.top + 1 ? endY + 17 : endY - 8)
      const overlaps = labels.some(
        (other) =>
          labelX < other.x + other.width + 8 &&
          labelX + width + 8 > other.x &&
          Math.abs(labelY - other.y) < 20,
      )
      if (!overlaps) {
        ctx.fillText(label, labelX, labelY)
        labels.push({ x: labelX, y: labelY, width })
      }
    }
    ctx.restore()
  },
  afterDatasetsDraw(chart) {
    // Keep highlighted dots and the selection above overlaps without reordering the data.
    const { ctx, chartArea } = chart
    ctx.save()
    ctx.beginPath()
    ctx.rect(chartArea.left - 8, chartArea.top - 8, chartArea.width + 16, chartArea.height + 16)
    ctx.clip()
    for (const borderWidth of [1, 2]) {
      for (const point of chart.getDatasetMeta(0).data) {
        if (point instanceof PointElement && point.options.borderWidth === borderWidth) {
          point.draw(ctx, chartArea)
        }
      }
    }
    ctx.restore()
  },
}

const defaultColors = {
  point: '#2563eb',
  text: '#111827',
  grid: '#e5e7eb',
  muted: '#6b7280',
  tooltip: '#111827',
  tooltipText: '#ffffff',
}

const formatRate = (rate: number) => `${formatNumber(rate * 100, { maximumFractionDigits: 2 })}%`

export default function ComboScatterPlot({
  stats,
  races,
  classes,
  metric,
  highlight,
}: {
  stats: Parameters<typeof getComboPoints>[0]
  races: Parameters<typeof getComboPoints>[1]
  classes: Parameters<typeof getComboPoints>[2]
  metric: ScatterMetric
  highlight?: ComboHighlight
}) {
  const { resolvedTheme } = useTheme()
  const [colors, setColors] = useState(defaultColors)
  const [selectedCombo, setSelectedCombo] = useState('')
  const [isZoomed, setIsZoomed] = useState(false)
  const [visible, setVisible] = useState<{ points: ComboPoint[]; count: number }>()
  const chartRef = useRef<ChartJS<'scatter', ComboPoint[]> | null>(null)
  const selectId = useId()
  const points = useMemo(
    () => getComboPoints(stats, races, classes, metric),
    [stats, races, classes, metric],
  )
  const selected = points.find((point) => point.combo === selectedCombo)
  const visibleCount = visible?.points === points ? visible.count : points.length
  const highlighted = points.map((point) => matchesComboHighlight(point.combo, highlight))
  const hasHighlight = Boolean(highlight?.abbr)
  const highlightName =
    highlight?.name ??
    (highlight?.dimension === 'race' ? races : classes).find(
      (item) => item.abbr === highlight?.abbr,
    )?.name ??
    highlight?.abbr

  const syncViewport = useCallback(
    ({ chart }: { chart: ChartJS }) => {
      const { x, y } = chart.scales
      const count = countCombosInView(points, { x, y })
      setIsZoomed(chart.isZoomedOrPanned())
      setVisible((current) =>
        current?.points === points && current.count === count ? current : { points, count },
      )
    },
    [points],
  )

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const styles = getComputedStyle(document.documentElement)
      const color = (token: string, fallback: string) =>
        styles.getPropertyValue(token).trim() || fallback
      setColors({
        point: color('--link', defaultColors.point),
        text: color('--chart-text', defaultColors.text),
        grid: color('--chart-grid', defaultColors.grid),
        muted: color('--muted-foreground', defaultColors.muted),
        tooltip: color('--tooltip', defaultColors.tooltip),
        tooltipText: color('--tooltip-foreground', defaultColors.tooltipText),
      })
    })
    return () => cancelAnimationFrame(frame)
  }, [resolvedTheme])

  // Keep options stable when selecting a point: replacing scales discards the current zoom.
  const options = useMemo<ChartOptions<'scatter'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      color: colors.text,
      borderColor: colors.muted,
      layout: { padding: 8 },
      interaction: { mode: 'nearest', intersect: false },
      onClick: (_event, elements) => {
        const element = preferredElement(elements)
        if (element) setSelectedCombo(points[element.index].combo)
      },
      scales: {
        x: {
          type: 'linear',
          min: 0,
          suggestedMax: Math.max(1, ...points.map((point) => point.x)) * 1.05,
          title: { display: true, text: 'Games played', color: colors.text },
          ticks: { color: colors.text, precision: 0, maxTicksLimit: 6, includeBounds: false },
          grid: { color: colors.grid },
          border: { color: colors.grid },
        },
        y: {
          min: 0,
          ...(metric === 'winRate'
            ? { max: 100 }
            : { suggestedMax: Math.max(1, ...points.map((point) => point.y)) * 1.1 }),
          title: {
            display: true,
            text: metric === 'wins' ? 'Wins' : 'Win rate (%)',
            color: colors.text,
          },
          ticks: {
            color: colors.text,
            precision: metric === 'wins' ? 0 : 2,
            maxTicksLimit: 6,
            includeBounds: false,
            callback: (value) => (metric === 'winRate' ? `${value}%` : formatNumber(Number(value))),
          },
          grid: { color: colors.grid },
          border: { color: colors.grid },
        },
      },
      plugins: {
        legend: { display: false },
        zoom: {
          limits: {
            x: { min: 0, max: 'original', minRange: 1 },
            y: { min: 0, max: 'original', minRange: metric === 'winRate' ? 0.1 : 1 },
          },
          pan: {
            enabled: true,
            mode: 'xy',
            modifierKey: 'shift',
            onPan: syncViewport,
            onPanComplete: syncViewport,
          },
          zoom: {
            mode: 'xy',
            drag: {
              enabled: true,
              threshold: 8,
              borderColor: colors.point,
              borderWidth: 1,
              backgroundColor: 'transparent',
              drawTime: 'afterDatasetsDraw',
            },
            wheel: { enabled: true, modifierKey: 'ctrl' },
            pinch: { enabled: true },
            onZoom: syncViewport,
            onZoomComplete: syncViewport,
          },
        },
        tooltip: {
          // Several combinations can have exactly the same coordinates.
          filter: (item, _index, items) => item === preferredElement(items),
          backgroundColor: colors.tooltip,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          displayColors: false,
          callbacks: {
            title: (items) => {
              const point = items[0]?.raw as ComboPoint | undefined
              return point ? `${point.combo} — ${point.name}` : ''
            },
            label: ({ raw }) => {
              const point = raw as ComboPoint
              return [
                `${formatNumber(point.wins)} ${pluralize('win', point.wins)} / ${formatNumber(point.games)} ${pluralize('game', point.games)}`,
                `Win rate: ${formatRate(point.winRate)}`,
                ...(point.maxXl != null ? [`Best XL: ${point.maxXl}`] : []),
                ...(point.gamesToFirstWin
                  ? [
                      `First win after ${point.gamesToFirstWin} ${pluralize('game', point.gamesToFirstWin)}`,
                    ]
                  : []),
                ...(allUnavailableCombos[point.combo] ? ['Combo is not normally playable'] : []),
              ]
            },
          },
        },
      },
    }),
    [colors, metric, points, syncViewport],
  )

  useEffect(() => {
    // React Chart.js applies the new data/options before this effect runs.
    chartRef.current?.resetZoom('none')
    setIsZoomed(false)
  }, [options])

  const zoom = (amount: number) => {
    const chart = chartRef.current
    if (!chart) return
    const focalPoint = selected
      ? {
          x: chart.scales.x.getPixelForValue(selected.x),
          y: chart.scales.y.getPixelForValue(selected.y),
        }
      : undefined
    const area = chart.chartArea
    const selectedIsVisible =
      focalPoint &&
      focalPoint.x >= area.left &&
      focalPoint.x <= area.right &&
      focalPoint.y >= area.top &&
      focalPoint.y <= area.bottom
    chart.zoom({ x: amount, y: amount, ...(selectedIsVisible ? { focalPoint } : {}) })
  }

  if (!points.length) {
    return (
      <p className="text-muted-foreground py-12 text-center">
        No played combinations for these filters.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <div role="group" aria-label="Chart zoom" className="flex gap-1">
          <button
            type="button"
            aria-label="Zoom in"
            className="bg-surface-emphasis hover:bg-surface-hover rounded-sm px-3 py-1"
            onClick={() => zoom(1.5)}
          >
            +
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            className="bg-surface-emphasis hover:bg-surface-hover rounded-sm px-3 py-1 disabled:opacity-40"
            disabled={!isZoomed}
            onClick={() => zoom(0)}
          >
            −
          </button>
          <button
            type="button"
            className="bg-surface-emphasis hover:bg-surface-hover rounded-sm px-3 py-1 disabled:opacity-40"
            disabled={!isZoomed}
            onClick={() => chartRef.current?.resetZoom('none')}
          >
            Reset zoom
          </button>
        </div>
        <span role="status" className="text-muted-foreground">
          {formatNumber(visibleCount)} of {formatNumber(points.length)}{' '}
          {pluralize('combo', points.length)} in view
        </span>
      </div>
      <p className="text-muted-foreground text-sm">
        Drag a box to zoom · Shift-drag to pan · Ctrl-scroll or pinch to zoom
      </p>
      {hasHighlight && (
        <p role="status" className="text-muted-foreground text-sm">
          Highlight: <span className="text-foreground font-medium">{highlightName}</span>
          {!highlighted.some(Boolean) && ' — no matching combos in these filters.'}
        </p>
      )}
      <div className="relative h-80 sm:h-96">
        <Scatter<ComboPoint[]>
          ref={chartRef}
          options={options}
          plugins={[zoomPlugin, comboAnnotations]}
          data={{
            datasets: [
              {
                label: metric === 'wins' ? 'Wins' : 'Win rate',
                data: points,
                clip: 8,
                backgroundColor: points.map((point, index) =>
                  hasHighlight && !highlighted[index] && point.combo !== selected?.combo
                    ? colors.muted
                    : colors.point,
                ),
                borderColor: colors.text,
                pointRadius: points.map((point, index) =>
                  point.combo === selected?.combo ? 7 : highlighted[index] ? 5 : 4,
                ),
                pointBorderWidth: points.map((point, index) =>
                  point.combo === selected?.combo ? 2 : highlighted[index] ? 1 : 0,
                ),
                pointHoverRadius: 7,
                pointHitRadius: 12,
              },
            ],
          }}
          role="img"
          aria-label={`Games played versus ${metric === 'wins' ? 'wins' : 'win rate'} for ${points.length} combinations. Use Inspect combination below for individual values.`}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <label htmlFor={selectId}>Inspect combination</label>
        <Select
          id={selectId}
          value={selected?.combo ?? ''}
          className="max-w-full min-w-0"
          onChange={(event) => setSelectedCombo(event.target.value)}
        >
          <option value="">Choose a combo</option>
          {points.map((point) => (
            <option key={point.combo} value={point.combo}>
              {point.combo} — {point.name}
            </option>
          ))}
        </Select>
      </div>
      <p
        aria-live="polite"
        className={cn('min-h-10 text-sm', !selected && 'text-muted-foreground')}
      >
        {selected && (
          <>
            <span className="font-medium">{selected.combo}</span>: {formatNumber(selected.wins)}{' '}
            {pluralize('win', selected.wins)} / {formatNumber(selected.games)}{' '}
            {pluralize('game', selected.games)} · {formatRate(selected.winRate)} win rate
            {selected.maxXl != null && ` · best XL ${selected.maxXl}`}
            {selected.gamesToFirstWin
              ? ` · first win after ${selected.gamesToFirstWin} ${pluralize('game', selected.gamesToFirstWin)}`
              : ''}
            {allUnavailableCombos[selected.combo] && ' · combo is not normally playable'}
          </>
        )}
      </p>
    </div>
  )
}
