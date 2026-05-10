import Link from 'next/link'
import { ArrowLeft, BookMarked, Pencil } from 'lucide-react'
import { brewPresetsService } from '@/app/brew-presets/service'
import { requireUser } from '@/lib/auth/require-user'
import { signOutAction } from '@/lib/auth/actions'
import { DeleteResourceButton } from '@/components/delete-resource-button'
import { PageHeader, HeaderAction } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/user-menu'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export const dynamic = 'force-dynamic'

export default async function PresetsPage() {
  const user = await requireUser()
  const userPresets = await brewPresetsService.getBrewPresets(user.id)

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        leading={
          <>
            <HeaderAction href="/" aria-label="Back to home">
              <ArrowLeft className="h-4 w-4" />
            </HeaderAction>
            <span className="font-medium">Presets</span>
          </>
        }
        actions={<UserMenu email={user.email} name={user.name} signOutAction={signOutAction} />}
      />

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
                        {preset.brewRatio > 0 && ` · 1:${preset.brewRatio}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 px-0"
                      >
                        <Link href={`/presets/${preset.id}/edit`} aria-label="Edit preset">
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
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
