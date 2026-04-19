'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Bean, BrewWithBean, Flavor } from '@/lib/types'
import { COUNTRY_FLAGS } from '@/lib/types'
import { Loader2, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { BrewStep } from '@/lib/types'

interface NewBrewFormProps {
  mode?: "create" | "edit"
  initialBeanId?: string
  initialBrew?: BrewWithBean
  beans: Bean[]
  flavors: Flavor[]
}

const STEP_TIME_INTERVAL = 5
const STEP_WATER_INTERVAL = 5
const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Exceptional']
const CHART_PLOT_PADDING = {
  top: 20,
  right: 12,
  bottom: 0,
  left: 8,
}

export function NewBrewForm({ mode = "create", initialBeanId, initialBrew, beans, flavors }: NewBrewFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedBean, setSelectedBean] = useState(initialBrew?.beanId ?? initialBeanId)
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>(initialBrew?.flavors.map((flavor) => flavor.id) ?? [])
  const [notes, setNotes] = useState(initialBrew?.notes ?? '')
  
  // Brew parameters
  const [beanWeight, setBeanWeight] = useState(initialBrew ? String(initialBrew.beanWeight) : '')
  const [waterWeight, setWaterWeight] = useState(initialBrew ? String(initialBrew.waterWeight) : '')
  const [waterTemp, setWaterTemp] = useState(initialBrew?.waterTemp != null ? String(initialBrew.waterTemp) : '')
  const [grindSize, setGrindSize] = useState(initialBrew?.beanGrind != null ? String(initialBrew.beanGrind) : '')
  const [brewTime, setBrewTime] = useState(initialBrew && initialBrew.steps.length > 0 ? String(initialBrew.steps[initialBrew.steps.length - 1]?.time ?? '') : '')
  const [stepInputs, setStepInputs] = useState<Array<{ time: string; water: string }>>(
    initialBrew && initialBrew.steps.length > 0
      ? initialBrew.steps.map((step) => ({ time: String(step.time), water: String(step.water) }))
      : [{ time: '', water: '' }]
  )
  
  // Ratings
  const [aroma, setAroma] = useState([initialBrew?.aroma ?? 4])
  const [acidity, setAcidity] = useState([initialBrew?.acidity ?? 3])
  const [sweetness, setSweetness] = useState([initialBrew?.sweetness ?? 4])
  const [body, setBody] = useState([initialBrew?.body ?? 3])
  const [overall, setOverall] = useState([initialBrew?.overall ?? 4])

  // "Record later" toggle: ON iff in edit mode with overall === 0
  const [recordLater, setRecordLater] = useState(
    initialBrew !== undefined ? initialBrew.overall === 0 : false
  )

  const handleRecordLaterToggle = (checked: boolean) => {
    // When toggling OFF: if every rating is currently 0, reset to defaults
    if (!checked) {
      if (aroma[0] === 0 && acidity[0] === 0 && sweetness[0] === 0 && body[0] === 0 && overall[0] === 0) {
        setAroma([4])
        setAcidity([3])
        setSweetness([4])
        setBody([3])
        setOverall([4])
      }
    }
    setRecordLater(checked)
  }

  const toggleFlavor = (flavorId: string) => {
    setSelectedFlavors((prev) =>
      prev.includes(flavorId)
        ? prev.filter((id) => id !== flavorId)
        : [...prev, flavorId]
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!selectedBean) {
        return
      }

      const isEdit = mode === 'edit' && initialBrew
      const response = await fetch(isEdit ? `/api/brews/${initialBrew.id}` : '/api/brews', {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          beanId: selectedBean,
          beanWeight: parseFloat(beanWeight),
          beanGrind: grindSize ? parseFloat(grindSize) : '',
          waterWeight: parseFloat(waterWeight),
          waterTemp: waterTemp ? parseFloat(waterTemp) : '',
          steps,
          aroma: recordLater ? 0 : aroma[0],
          acidity: recordLater ? 0 : acidity[0],
          sweetness: recordLater ? 0 : sweetness[0],
          body: recordLater ? 0 : body[0],
          overall: recordLater ? 0 : overall[0],
          notes,
          flavorIds: recordLater ? [] : selectedFlavors,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save brew')
      }

      if (isEdit) {
        router.push(`/brews/${initialBrew.id}`)
        router.refresh()
        return
      }

      const { id } = (await response.json()) as { id: string }
      router.push(`/brews/${id}`)
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate ratio
  const ratio = beanWeight && waterWeight 
    ? (parseFloat(waterWeight) / parseFloat(beanWeight)).toFixed(1)
    : '-'

  const totalWater = Math.max(parseFloat(waterWeight) || 0, 300)
  const totalTime = Math.max(parseFloat(brewTime) || 0, 300)
  const snapToInterval = (value: number, interval: number) =>
    Math.round(value / interval) * interval
  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max)

  const steps = useMemo(
    () =>
      stepInputs
        .map((row) => ({
          time: Number(row.time),
          water: Number(row.water),
        }))
        .filter((row) => Number.isFinite(row.time) && Number.isFinite(row.water))
        .map((row) => ({
          time: clamp(snapToInterval(row.time, STEP_TIME_INTERVAL), 0, totalTime),
          water: clamp(snapToInterval(row.water, STEP_WATER_INTERVAL), 0, totalWater),
        }))
        .sort((a, b) => a.time - b.time)
        .filter(
          (step, index, list) =>
            list.findIndex((target) => target.time === step.time && target.water === step.water) === index
        ),
    [stepInputs, totalTime, totalWater]
  )

  const handleStepInputChange = (index: number, key: keyof BrewStep, value: string) => {
    setStepInputs((prev) => {
      const next = [...prev]
      const current = next[index] ?? { time: '', water: '' }
      next[index] = { ...current, [key]: value }
      return next
    })
  }

  const commitStepInput = (index: number, key: keyof BrewStep) => {
    setStepInputs((prev) => {
      const next = [...prev]
      const target = next[index]
      if (!target) return prev
      const raw = Number(target[key])
      if (!Number.isFinite(raw)) return prev
      const max = key === 'time' ? totalTime : totalWater
      next[index] = {
        ...target,
        [key]: String(clamp(snapToInterval(raw, key === 'time' ? STEP_TIME_INTERVAL : STEP_WATER_INTERVAL), 0, max)),
      }
      return next
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Bean Selection */}
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Select Bean
        </h2>
        <Select value={selectedBean} onValueChange={setSelectedBean} required>
          <SelectTrigger>
            <SelectValue placeholder="Choose a bean" />
          </SelectTrigger>
          <SelectContent>
            {beans.map((bean) => (
              <SelectItem key={bean.id} value={bean.id}>
                <span className="flex items-center gap-2">
                  <span>{COUNTRY_FLAGS[bean.country]}</span>
                  <span>{bean.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Brew Parameters */}
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Parameters
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="beanWeight">Coffee (g)</Label>
            <Input
              id="beanWeight"
              type="number"
              value={beanWeight}
              onChange={(e) => setBeanWeight(e.target.value)}
              min="1"
              step="any"
              placeholder="0"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="waterWeight">Water (g)</Label>
            <div className="relative">
              <Input
                id="waterWeight"
                type="number"
                value={waterWeight}
                onChange={(e) => setWaterWeight(e.target.value)}
                min="1"
                step="any"
                required
                placeholder="0"
                className="pr-8"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">g</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="waterTemp">Temp (°C)</Label>
            <div className="relative">
              <Input
                id="waterTemp"
                type="number"
                value={waterTemp}
                onChange={(e) => setWaterTemp(e.target.value)}
                min="80"
                max="100"
                required
                placeholder="0"
                className="pr-8"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">°C</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="grindSize">Grind (clicks)</Label>
            <Input
              id="grindSize"
              type="number"
              value={grindSize}
              onChange={(e) => setGrindSize(e.target.value)}
              min="1"
              placeholder="clicks"
              required
            />
          </div>
          <div className="col-span-2 flex flex-col gap-2">
            <Label htmlFor="brewTime">Total Time (sec)</Label>
            <div className="relative">
              <Input
                id="brewTime"
                type="number"
                value={brewTime}
                onChange={(e) => setBrewTime(e.target.value)}
                min="30"
                step="5"
                required
                placeholder="0"
                className="pr-8"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">s</span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center rounded-lg bg-secondary p-3">
          <span className="text-sm text-muted-foreground">Brew Ratio</span>
          <span className="ml-2 font-mono text-lg font-medium">1:{ratio}</span>
        </div>
      </div>

      {/* Extraction Steps */}
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Extraction Steps
        </h2>

        <div
          className="relative mb-4 h-44 rounded-lg border border-border/60 bg-secondary/20"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={steps}
              margin={{
                top: CHART_PLOT_PADDING.top,
                right: CHART_PLOT_PADDING.right,
                bottom: CHART_PLOT_PADDING.bottom,
                left: CHART_PLOT_PADDING.left,
              }}
            >
              <defs>
                <linearGradient id="stepFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" />
              <XAxis
                dataKey="time"
                domain={[0, totalTime]}
                type="number"
                tickFormatter={(v) => `${v}s`}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                height={20}
              />
              <YAxis
                dataKey="water"
                domain={[0, totalWater]}
                tickFormatter={(v) => `${v}g`}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                width={30}
              />
              <Tooltip
                formatter={(value: number, name: string) =>
                  name === 'water' ? [`${value}g`, 'Water'] : [value, name]
                }
                labelFormatter={(label) => `${label}s`}
              />
              <Area
                type="monotone"
                dataKey="water"
                stroke="var(--chart-2)"
                strokeWidth={2}
                fill="url(#stepFill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <span>Time (s)</span>
            <span>Water (g)</span>
            <span />
          </div>
          {stepInputs.map((stepInput, index) => (
            <div key={`step-input-${index}`} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max={totalTime}
                  step={STEP_TIME_INTERVAL}
                  value={stepInput.time}
                  onChange={(e) => handleStepInputChange(index, 'time', e.target.value)}
                  onBlur={() => commitStepInput(index, 'time')}
                  placeholder="0"
                  className="pr-8"
                  aria-label={`Step ${index + 1} time`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">s</span>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max={totalWater}
                  step={STEP_WATER_INTERVAL}
                  value={stepInput.water}
                  onChange={(e) => handleStepInputChange(index, 'water', e.target.value)}
                  onBlur={() => commitStepInput(index, 'water')}
                  placeholder="0"
                  className="pr-8"
                  aria-label={`Step ${index + 1} water`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">g</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setStepInputs((prev) => {
                    if (prev.length <= 1) return prev
                    return prev.filter((_, targetIndex) => targetIndex !== index)
                  })
                }}
                disabled={stepInputs.length <= 1}
                aria-label={`Delete step ${index + 1}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setStepInputs((prev) => [...prev, { time: '', water: '' }])}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Step
          </Button>
        </div>
      </div>

      {/* Cup */}
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Cup
          </h2>
          <Label
            htmlFor="record-later-toggle"
            className="cursor-pointer text-sm font-normal text-muted-foreground"
          >
            あとで記録
            <Switch
              id="record-later-toggle"
              checked={recordLater}
              onCheckedChange={handleRecordLaterToggle}
              aria-label="あとで記録"
            />
          </Label>
        </div>

        {!recordLater && (
          <>
            {/* Taste Profile */}
            <div className="mb-4 flex flex-col gap-5">
              {[
                { label: 'Aroma', value: aroma, setValue: setAroma },
                { label: 'Acidity', value: acidity, setValue: setAcidity },
                { label: 'Sweetness', value: sweetness, setValue: setSweetness },
                { label: 'Body', value: body, setValue: setBody },
                { label: 'Overall', value: overall, setValue: setOverall },
              ].map((rating) => (
                <div key={rating.label} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label>{rating.label}</Label>
                    <span className="text-sm text-muted-foreground">
                      {rating.value[0]} - {ratingLabels[rating.value[0]]}
                    </span>
                  </div>
                  <Slider
                    value={rating.value}
                    onValueChange={rating.setValue}
                    min={1}
                    max={5}
                    step={1}
                  />
                </div>
              ))}
            </div>

            {/* Flavor Notes */}
            <div>
              <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Flavor Notes
              </h3>
              <div className="flex flex-wrap gap-2">
                {flavors.map((flavor) => {
                  const isSelected = selectedFlavors.includes(flavor.id)
                  return (
                    <button
                      key={flavor.id}
                      type="button"
                      onClick={() => toggleFlavor(flavor.id)}
                      className={cn(
                        'flex items-center gap-1 rounded-full px-3 py-1.5 text-sm transition-all',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      )}
                    >
                      {flavor.name}
                      {isSelected && <X className="h-3 w-3" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Notes */}
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Tasting Notes
        </h2>
        <Textarea
          placeholder="How was this brew? Any observations?"
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>

      {/* Submit */}
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          mode === 'edit' ? 'Save Brew' : 'Log Brew'
        )}
      </Button>
    </form>
  )
}
