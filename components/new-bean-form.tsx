'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
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
import { COUNTRIES, COUNTRY_FLAGS, PROCESSES, ROAST_LEVELS, type Bean, type Country } from '@/lib/types'
import { DEFAULT_ROAST_INDEX } from '@/lib/constants'
import { Loader2 } from 'lucide-react'
import { PhotoImportButton } from '@/components/photo-import-button'
import { Card } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { SectionHeading } from '@/components/section-heading'

const NO_PROCESS_VALUE = '__none__'

interface NewBeanFormProps {
  mode?: 'create' | 'edit'
  initialBean?: Bean
}

export function NewBeanForm({ mode = 'create', initialBean }: NewBeanFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const initialRoastIndex = initialBean ? Math.max(0, ROAST_LEVELS.indexOf(initialBean.roast)) : DEFAULT_ROAST_INDEX
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
      <PhotoImportButton
        onExtracted={(fields) => {
          if (fields.name !== undefined) setName(fields.name)
          if (fields.roaster !== undefined) setRoaster(fields.roaster)
          if (fields.country !== undefined) setCountry(fields.country as Country)
          if (fields.region !== undefined) setRegion(fields.region)
          if (fields.farm !== undefined) setFarm(fields.farm)
          if (fields.variety !== undefined) setVariety(fields.variety)
          if (fields.process !== undefined) setProcess(fields.process)
          if (fields.notes !== undefined) setNotes(fields.notes)
        }}
      />
      <Card>
        <SectionHeading>Bean Info</SectionHeading>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input id="name" placeholder="Yirgacheffe Kochere" value={name} onChange={(event) => setName(event.target.value)} required />
          </Field>
          <Field>
            <FieldLabel htmlFor="roaster">Roaster</FieldLabel>
            <Input id="roaster" placeholder="Onibus Coffee" value={roaster} onChange={(event) => setRoaster(event.target.value)} required />
          </Field>
        </div>
      </Card>

      <Card>
        <SectionHeading>Origin</SectionHeading>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="country">Country</FieldLabel>
            <Select value={country} onValueChange={(value) => setCountry(value as (typeof COUNTRIES)[number])} required>
              <SelectTrigger id="country">
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
          </Field>
          <Field>
            <FieldLabel htmlFor="region">Region</FieldLabel>
            <Input id="region" placeholder="Yirgacheffe" value={region} onChange={(event) => setRegion(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="farm">Farm / Station</FieldLabel>
            <Input id="farm" placeholder="Kochere Washing Station" value={farm} onChange={(event) => setFarm(event.target.value)} />
          </Field>
        </div>
      </Card>

      <Card>
        <SectionHeading>Characteristics</SectionHeading>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="variety">Variety</FieldLabel>
            <Input id="variety" placeholder="Heirloom" value={variety} onChange={(event) => setVariety(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="process">Process</FieldLabel>
            <Select value={process || undefined} onValueChange={(value) => setProcess(value === NO_PROCESS_VALUE ? '' : value)}>
              <SelectTrigger id="process">
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PROCESS_VALUE}>Not specified</SelectItem>
                {PROCESSES.map((process) => (
                  <SelectItem key={process} value={process}>
                    {process}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Roast Level</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              <RoastPalette
                value={ROAST_LEVELS[roastIndex[0]]}
                onChange={(level) => setRoastIndex([ROAST_LEVELS.indexOf(level)])}
              />
              <RoastPhotoPicker
                onEstimate={(level) => setRoastIndex([ROAST_LEVELS.indexOf(level)])}
              />
            </div>
          </Field>
        </div>
      </Card>

      <Card>
        <SectionHeading>Notes</SectionHeading>
        <Textarea placeholder="Tasting notes, purchase info, etc." rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
      </Card>

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
