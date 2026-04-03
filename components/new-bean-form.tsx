'use client'

import { useState } from 'react'
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
import { COUNTRIES, COUNTRY_FLAGS, ROAST_LEVELS } from '@/lib/types'
import { Loader2 } from 'lucide-react'

const processes = ['Washed', 'Natural', 'Honey', 'Anaerobic', 'Wet Hulled']
const NO_PROCESS_VALUE = '__none__'

export function NewBeanForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [roastIndex, setRoastIndex] = useState([2])
  const [name, setName] = useState('')
  const [roaster, setRoaster] = useState('')
  const [country, setCountry] = useState<(typeof COUNTRIES)[number] | ''>('')
  const [region, setRegion] = useState('')
  const [farm, setFarm] = useState('')
  const [variety, setVariety] = useState('')
  const [process, setProcess] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!country) {
        return
      }

      const response = await fetch('/api/beans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          roaster,
          country,
          region,
          farm,
          variety,
          process,
          roast: ROAST_LEVELS[roastIndex[0]],
          notes,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create bean')
      }

      const { id } = (await response.json()) as { id: string }
      router.push(`/beans/${id}`)
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Basic Info */}
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Bean Info
        </h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Yirgacheffe Kochere"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="roaster">Roaster</Label>
            <Input
              id="roaster"
              placeholder="Onibus Coffee"
              value={roaster}
              onChange={(event) => setRoaster(event.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {/* Origin */}
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Origin
        </h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="country">Country</Label>
            <Select
              value={country}
              onValueChange={(value) => setCountry(value as (typeof COUNTRIES)[number])}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country} value={country}>
                    <span className="flex items-center gap-2">
                      <span>{COUNTRY_FLAGS[country]}</span>
                      <span>{country}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="region">Region</Label>
            <Input
              id="region"
              placeholder="Yirgacheffe"
              value={region}
              onChange={(event) => setRegion(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="farm">Farm / Station</Label>
            <Input
              id="farm"
              placeholder="Kochere Washing Station"
              value={farm}
              onChange={(event) => setFarm(event.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Characteristics */}
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Characteristics
        </h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="variety">Variety</Label>
            <Input
              id="variety"
              placeholder="Heirloom"
              value={variety}
              onChange={(event) => setVariety(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="process">Process</Label>
            <Select
              value={process || undefined}
              onValueChange={(value) => setProcess(value === NO_PROCESS_VALUE ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PROCESS_VALUE}>Not specified</SelectItem>
                {processes.map((process) => (
                  <SelectItem key={process} value={process}>
                    {process}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label>Roast Level</Label>
              <span className="text-sm text-muted-foreground">{ROAST_LEVELS[roastIndex[0]]}</span>
            </div>
            <Slider
              value={roastIndex}
              onValueChange={setRoastIndex}
              min={0}
              max={ROAST_LEVELS.length - 1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{ROAST_LEVELS[0]}</span>
              <span>{ROAST_LEVELS[ROAST_LEVELS.length - 1]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Notes
        </h2>
        <Textarea
          placeholder="Tasting notes, purchase info, etc."
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
          'Add Bean'
        )}
      </Button>
    </form>
  )
}
