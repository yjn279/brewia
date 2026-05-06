import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { brewPresetsService } from '@/app/brew-presets/service'
import { requireUser } from '@/lib/auth/require-user'
import { DeleteResourceButton } from '@/components/delete-resource-button'
import { PresetEditDialog } from '@/app/presets/preset-edit-dialog'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { BookMarked } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PresetsPage() {
  const user = await requireUser()
  const userPresets = await brewPresetsService.getBrewPresets(user.id)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="font-medium">Presets</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        {/* User presets */}
        <section>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Your Presets
          </h2>
          {userPresets.length === 0 ? (
            <Empty className="rounded-xl border border-dashed bg-card px-4 py-10 shadow-sm">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BookMarked className="h-5 w-5" />
                </EmptyMedia>
                <EmptyTitle>No saved presets yet</EmptyTitle>
                <EmptyDescription>
                  Save your brew recipe as a preset from the brewing form.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Link
                  href="/new?type=brew"
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Start brewing
                </Link>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="flex flex-col gap-3">
              {userPresets.map((preset) => (
                <div
                  key={preset.id}
                  className="rounded-xl bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">{preset.name}</p>
                      {preset.description && (
                        <p className="mt-0.5 text-sm text-muted-foreground">{preset.description}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {preset.steps.length} steps
                        {preset.defaultBeanWeight != null && ` · ${preset.defaultBeanWeight}g bean`}
                        {preset.defaultWaterTemp != null && ` · ${preset.defaultWaterTemp}°C`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <PresetEditDialog preset={preset} />
                      <DeleteResourceButton
                        endpoint={`/api/brew-presets/${preset.id}`}
                        redirectTo="/presets"
                        confirmMessage="このプリセットを削除しますか？"
                        showLabel={false}
                        className="h-8 w-8 px-0"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
