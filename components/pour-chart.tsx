'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts'
import type { BrewStep } from '@/lib/types'

interface PourChartProps {
  steps: BrewStep[]
  totalWater: number
}

type ChartPoint = {
  time: number
  water: number
  stepIndex?: number
  stepLabel?: string
  deltaWater?: number
}

function StepDot(props: { cx?: number; cy?: number; payload?: ChartPoint }) {
  const { cx, cy, payload } = props

  if (cx == null || cy == null || !payload?.stepIndex) {
    return null
  }

  return (
    <g>
      <circle cx={cx} cy={cy} r={9} fill="var(--background)" stroke="var(--chart-2)" strokeWidth={2} />
      <text
        x={cx}
        y={cy + 0.5}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={10}
        fontWeight={700}
        fill="var(--chart-2)"
      >
        {payload.stepIndex}
      </text>
    </g>
  )
}

export function PourChart({ steps, totalWater }: PourChartProps) {
  const sortedSteps = [...steps].sort((a, b) => a.time - b.time)
  const normalizedSteps = sortedSteps.length > 0 && sortedSteps[0]?.time !== 0
    ? [{ time: 0, water: 0 }, ...sortedSteps]
    : sortedSteps
  const chartData: ChartPoint[] = normalizedSteps.map((step, index, list) => {
    const isStartPoint = index === 0 && step.time === 0 && step.water === 0

    if (isStartPoint) {
      return {
        time: step.time,
        water: step.water,
      }
    }

    const previousWater = index > 0 ? list[index - 1]?.water ?? 0 : 0
    const stepIndex = sortedSteps.findIndex((target) => target.time === step.time && target.water === step.water) + 1

    return {
      time: step.time,
      water: step.water,
      stepIndex,
      stepLabel: `#${stepIndex}`,
      deltaWater: step.water - previousWater,
    }
  })

  return (
    <div className="rounded-xl bg-card p-4 shadow-sm">
      <h4 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Pour Profile
      </h4>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            type="number"
            domain={[0, 'dataMax']}
            tickFormatter={(v) => `${v}s`}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, totalWater]}
            tickFormatter={(v) => `${v}g`}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
          <Tooltip
            formatter={(value, name, item) => {
              if (name === 'water') {
                const point = item.payload as ChartPoint
                const stepLabel = point.stepIndex ? `Step #${point.stepIndex}` : 'Start'
                const deltaLabel = typeof point.deltaWater === 'number' ? ` (+${Math.max(point.deltaWater, 0)}g)` : ''
                return [`${value}g${deltaLabel}`, stepLabel]
              }

              return [value, name]
            }}
            labelFormatter={(label) => `${label}s`}
          />
          <Area
            type="monotone"
            dataKey="water"
            stroke="none"
            fill="url(#waterGradient)"
          />
          <Line
            type="monotone"
            dataKey="water"
            stroke="var(--chart-2)"
            strokeWidth={2}
            dot={<StepDot />}
            activeDot={{ r: 10, strokeWidth: 2, stroke: 'var(--chart-2)', fill: 'var(--background)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <p className="mt-3 text-xs text-muted-foreground">
        ドット内の番号が抽出ステップ順です（例: #1, #2...）。
      </p>
    </div>
  )
}
