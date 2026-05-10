import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { brewPresetsService } from '@/app/brew-presets/service'
import { requireUser } from '@/lib/auth/require-user'
import { PageHeader, HeaderAction } from '@/components/page-header'
import { PresetEditForm } from './preset-edit-form'

export const dynamic = 'force-dynamic'

interface EditPresetPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPresetPage({ params }: EditPresetPageProps) {
  const user = await requireUser()
  const { id } = await params
  const preset = await brewPresetsService.getBrewPresetById(user.id, id)

  if (!preset) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        leading={
          <>
            <HeaderAction href="/presets" aria-label="Back to presets">
              <ArrowLeft className="h-4 w-4" />
            </HeaderAction>
            <span className="font-medium">Edit Preset</span>
          </>
        }
      />

      <main className="mx-auto max-w-md px-4 py-6">
        <PresetEditForm preset={preset} />
      </main>
    </div>
  )
}
