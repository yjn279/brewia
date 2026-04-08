'use client'

import type { ReactNode } from 'react'
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts'
import type { BrewStep } from '@/lib/types'

interface PourChartProps {
  steps: BrewStep[]
  totalWater: number
  children?: ReactNode
}

export function PourChart({ steps, totalWater, children }: PourChartProps) {
  const sortedSteps = [...steps].sort((a, b) => a.time - b.time)
  const chartData = sortedSteps.length > 0 && sortedSteps[0]?.time !== 0
    ? [{ time: 0, water: 0 }, ...sortedSteps]
    : sortedSteps

  return (
    <div className="rounded-xl bg-card p-4 shadow-sm">
      <h4 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Pour Profile
      </h4>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            tickFormatter={(v) => `${v}s`}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
          />
          <YAxis
            domain={[0, totalWater]}
            tickFormatter={(v) => `${v}g`}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            width={40}
          />
          <Area
            type="monotone"
            dataKey="water"
            stroke="none"
            fill="url(#waterGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
      {children}
    </div>
  )
}
