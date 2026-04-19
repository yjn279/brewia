'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { RoastPalette } from '@/components/roast-palette'
import { RoastPhotoPicker } from '@/components/roast-photo-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { COUNTRIES, COUNTRY_FLAGS, ROAST_LEVELS, type Bean } from '@/lib/types'
import { Loader2 } from 'lucide-react'

const processes = ['Washed', 'Natural', 'Honey', 'Anaerobic', 'Wet Hulled']
const NO_PROCESS_VALUE = '__none__'

interface NewBeanFormProps {
  mode?: 'create' | 'edit'
  initialBean?: Bean
}

export function NewBeanForm({ mode = 'create', initialBean }: NewBeanFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const initialRoastIndex = initialBean ? Math.max(0, ROAST_LEVELS.indexOf(initialBean.roast)) : 2
  const [roastIndex, setRoastIndex] = useState([initialRoastIndex])
  const [name, setName] = useState(initialBean?.name ?? '')
  const [roaster, setRoaster] = useState(initialBean?.roaster ?? '')
  const [country, setCountry] = useState<(typeof COUNTRIES)[number] | ''>(initialBean?.country ?? '')
  const [region, setRegion] = useState(initialBean?.region ?? '')
  const [farm, setFarm] = useState(initialBean?.farm ?? '')
  const [variety, setVariety] = useState(initialBean?.variety ?? '')
  const [process, setProcess] = useState(initialBean?.process ?? '')
  const [notes, setNotes] = useState(initialBean?.notes ?? '')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!country) {
        return
      }

      const isEdit = mode === 'edit' && initialBean
      const response = await fetch(isEdit ? `/api/beans/${initialBean.id}` : '/api/beans', {
        method: isEdit ? 'PUT' : 'POST',
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
        throw new Error('Failed to save bean')
      }

      if (isEdit) {
        router.push(`/beans/${initialBean.id}`)
        router.refresh()
        return
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
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Bean Info
        </h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Yirgacheffe Kochere" value={name} onChange={(event) => setName(event.target.value)} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="roaster">Roaster</Label>
            <Input id="roaster" placeholder="Onibus Coffee" value={roaster} onChange={(event) => setRoaster(event.target.value)} required />
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">Origin</h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="country">Country</Label>
            <Select value={country} onValueChange={(value) => setCountry(value as (typeof COUNTRIES)[number])} required>
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
            <Input id="region" placeholder="Yirgacheffe" value={region} onChange={(event) => setRegion(event.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="farm">Farm / Station</Label>
            <Input id="farm" placeholder="Kochere Washing Station" value={farm} onChange={(event) => setFarm(event.target.value)} />
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">Characteristics</h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="variety">Variety</Label>
            <Input id="variety" placeholder="Heirloom" value={variety} onChange={(event) => setVariety(event.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="process">Process</Label>
            <Select value={process || undefined} onValueChange={(value) => setProcess(value === NO_PROCESS_VALUE ? '' : value)}>
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
            <Label>Roast Level</Label>
            <RoastPhotoPicker
              onEstimate={(level) => setRoastIndex([ROAST_LEVELS.indexOf(level)])}
            />
            <RoastPalette
              value={ROAST_LEVELS[roastIndex[0]]}
              onChange={(level) => setRoastIndex([ROAST_LEVELS.indexOf(level)])}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">Notes</h2>
        <Textarea placeholder="Tasting notes, purchase info, etc." rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : mode === 'edit' ? (
          'Save Bean'
        ) : (
          'Add Bean'
        )}
      </Button>
    </form>
  )
}
