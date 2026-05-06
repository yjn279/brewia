'use client'

import { useEffect, useMemo, useState } from 'react'
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
import { ChevronDown, Loader2, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { BrewPresetRecord } from '@/app/brew-presets/repository'
import { toast } from '@/components/ui/use-toast'
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
import { useBrewTimer } from '@/hooks/use-brew-timer'
import { BrewTimer } from '@/components/brew-timer'

interface NewBrewFormProps {
  mode?: "create" | "edit"
  initialBeanId?: string
  initialBrew?: BrewWithBean
  beans: Bean[]
  flavors: Flavor[]
}

const STEP_TIME_INTERVAL = 1
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
  const totalTime = useMemo(() => {
    const stepTimes = stepInputs
      .map((row) => parseFloat(row.time))
      .filter((value) => Number.isFinite(value))
    return Math.max(300, ...stepTimes, 0)
  }, [stepInputs])
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

  const { status: timerStatus, elapsed: timerElapsed, start: startTimer, lap: lapTimer, stop: stopTimer, reset: resetTimer } = useBrewTimer()

  // User presets state
  const [userPresets, setUserPresets] = useState<BrewPresetRecord[]>([])
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [presetDescription, setPresetDescription] = useState('')
  const [isSavingPreset, setIsSavingPreset] = useState(false)

  useEffect(() => {
    fetch('/api/brew-presets')
      .then((res) => res.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          setUserPresets(data as BrewPresetRecord[])
        }
      })
      .catch(() => {
        // Ignore fetch errors silently
      })
  }, [])

  const applyPreset = (preset: { steps: Array<{ time: number; water: number }>; defaultBeanWeight?: number | null; defaultWaterTemp?: number | null }) => {
    setStepInputs(
      preset.steps.map((s) => ({
        time: String(s.time),
        water: String(s.water),
      })),
    )
    if (preset.defaultBeanWeight != null) {
      setBeanWeight(String(preset.defaultBeanWeight))
    }
    if (preset.defaultWaterTemp != null) {
      setWaterTemp(String(preset.defaultWaterTemp))
    }
  }

  const handleSaveAsPreset = async () => {
    if (!presetName.trim()) return
    setIsSavingPreset(true)
    try {
      const response = await fetch('/api/brew-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: presetName.trim(),
          description: presetDescription.trim(),
          defaultBeanWeight: beanWeight ? parseFloat(beanWeight) : '',
          defaultWaterTemp: waterTemp ? parseFloat(waterTemp) : '',
          steps,
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to save preset')
      }
      toast({ title: 'Preset saved' })
      setIsSaveDialogOpen(false)
      setPresetName('')
      setPresetDescription('')
      // Refresh user presets list
      fetch('/api/brew-presets')
        .then((res) => res.json())
        .then((data: unknown) => {
          if (Array.isArray(data)) {
            setUserPresets(data as BrewPresetRecord[])
          }
        })
        .catch(() => {})
    } catch {
      toast({ title: 'Failed to save preset', variant: 'destructive' })
    } finally {
      setIsSavingPreset(false)
    }
  }

  const handleLap = () => {
    // Round to nearest 5 seconds
    const seconds = Math.round(timerElapsed / 5000) * 5
    setStepInputs((prev) => [...prev, { time: String(seconds), water: '' }])
    lapTimer()
  }

  const handleReset = () => {
    resetTimer()
    setStepInputs([{ time: '', water: '' }])
  }

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
            <Label htmlFor="beanWeight">Coffee</Label>
            <div className="relative">
              <Input
                id="beanWeight"
                type="number"
                value={beanWeight}
                onChange={(e) => setBeanWeight(e.target.value)}
                min="1"
                step="any"
                placeholder="0"
                required
                className="pr-8"
                aria-describedby="beanWeight-unit"
              />
              <span id="beanWeight-unit" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">g</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="waterWeight">Water</Label>
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
                aria-describedby="waterWeight-unit"
              />
              <span id="waterWeight-unit" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">g</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="waterTemp">Temp</Label>
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
                aria-describedby="waterTemp-unit"
              />
              <span id="waterTemp-unit" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">°C</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="grindSize">Grind</Label>
            <div className="relative">
              <Input
                id="grindSize"
                type="number"
                value={grindSize}
                onChange={(e) => setGrindSize(e.target.value)}
                min="1"
                placeholder="0"
                required
                className="pr-14"
                aria-describedby="grindSize-unit"
              />
              <span id="grindSize-unit" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">clicks</span>
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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Extraction Steps
          </h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                aria-label="Insert preset"
              >
                Insert preset
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {userPresets.length === 0 ? (
                <DropdownMenuItem disabled>
                  No saved presets yet
                </DropdownMenuItem>
              ) : (
                userPresets.map((preset) => (
                  <DropdownMenuItem
                    key={preset.id}
                    onSelect={() => applyPreset(preset)}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{preset.name}</span>
                      {preset.description && (
                        <span className="text-xs text-muted-foreground">{preset.description}</span>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

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

        <div className="mb-4">
          <BrewTimer
            status={timerStatus}
            elapsed={timerElapsed}
            onStart={startTimer}
            onLap={handleLap}
            onStop={stopTimer}
            onReset={handleReset}
          />
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <span>Time</span>
            <span>Water</span>
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

      {/* Save as preset */}
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Save as Preset
        </h2>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={steps.length === 0}
          onClick={() => setIsSaveDialogOpen(true)}
        >
          Save current as preset
        </Button>
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

      {/* Save preset dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Preset</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="preset-name">Name</Label>
              <Input
                id="preset-name"
                placeholder="e.g. My V60 Recipe"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="preset-description">Description (optional)</Label>
              <Textarea
                id="preset-description"
                placeholder="Describe this preset..."
                rows={2}
                value={presetDescription}
                onChange={(e) => setPresetDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSaveDialogOpen(false)}
              disabled={isSavingPreset}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!presetName.trim() || isSavingPreset}
              onClick={handleSaveAsPreset}
            >
              {isSavingPreset ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
