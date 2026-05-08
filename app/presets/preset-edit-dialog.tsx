'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import type { BrewPresetRecord } from '@/app/brew-presets/repository'
import type { BrewStep } from '@/lib/types'

interface PresetEditDialogProps {
  preset: BrewPresetRecord
}

export function PresetEditDialog({ preset }: PresetEditDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [name, setName] = useState(preset.name)
  const [description, setDescription] = useState(preset.description)
  // 0 は未入力扱いとして空欄表示にする
  const [defaultBeanWeight, setDefaultBeanWeight] = useState(
    preset.defaultBeanWeight > 0 ? String(preset.defaultBeanWeight) : ''
  )
  const [defaultWaterTemp, setDefaultWaterTemp] = useState(
    preset.defaultWaterTemp > 0 ? String(preset.defaultWaterTemp) : ''
  )
  const [stepsText, setStepsText] = useState(
    preset.steps.map((s) => `${s.time}s / ${s.water}g`).join('\n')
  )

  const parseSteps = (text: string): BrewStep[] => {
    return text
      .split('\n')
      .map((line) => {
        const match = line.match(/(\d+(?:\.\d+)?)\s*[sS]?\s*[/,]\s*(\d+(?:\.\d+)?)\s*[gG]?/)
        if (!match) return null
        return { time: parseFloat(match[1]), water: parseFloat(match[2]) }
      })
      .filter((s): s is BrewStep => s !== null)
  }

  const handleSave = async () => {
    if (!name.trim()) return
    const steps = parseSteps(stepsText)
    if (steps.length === 0) {
      toast({ title: 'At least one valid step is required', variant: 'destructive' })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/brew-presets/${preset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          defaultBeanWeight: defaultBeanWeight ? parseFloat(defaultBeanWeight) : 0,
          defaultWaterTemp: defaultWaterTemp ? parseFloat(defaultWaterTemp) : 0,
          steps,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update preset')
      }

      toast({ title: 'Preset updated' })
      setIsOpen(false)
      router.refresh()
    } catch {
      toast({ title: 'Failed to update preset', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 w-8 px-0"
        onClick={() => setIsOpen(true)}
        aria-label="Edit preset"
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Preset</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-preset-name">Name</Label>
              <Input
                id="edit-preset-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-preset-description">Description</Label>
              <Textarea
                id="edit-preset-description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-preset-bean-weight">Bean Weight (g)</Label>
                <Input
                  id="edit-preset-bean-weight"
                  type="number"
                  min={0}
                  step={0.1}
                  value={defaultBeanWeight}
                  onChange={(e) => setDefaultBeanWeight(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-preset-water-temp">Water Temp (°C)</Label>
                <Input
                  id="edit-preset-water-temp"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={defaultWaterTemp}
                  onChange={(e) => setDefaultWaterTemp(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-preset-steps">
                Steps (one per line: <code>time / water</code>)
              </Label>
              <Textarea
                id="edit-preset-steps"
                rows={4}
                value={stepsText}
                onChange={(e) => setStepsText(e.target.value)}
                placeholder="30s / 50g&#10;90s / 200g"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!name.trim() || isSaving}
              onClick={handleSave}
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
