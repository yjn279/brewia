'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts'
import type { BrewStep } from '@/lib/types'

interface PourChartProps {
  steps: BrewStep[]
  totalWater: number
}

export function PourChart({ steps, totalWater }: PourChartProps) {
  const sortedSteps = [...steps].sort((a, b) => a.time - b.time)
  const chartData = sortedSteps.length > 0 && sortedSteps[0]?.time !== 0
    ? [{ time: 0, water: 0 }, ...sortedSteps]
    : sortedSteps

  return (
    <div className="rounded-xl bg-card p-4 shadow-sm">
      <h4 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Pour Profile
      </h4>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
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
          <Area
            type="monotone"
            dataKey="water"
            stroke="var(--chart-2)"
            strokeWidth={2}
            fill="url(#waterGradient)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
