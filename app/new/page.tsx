import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { NewEntryTabs } from '@/components/new-entry-tabs'
import { beansService } from '@/app/api/beans/servce'
import { flavorsService } from '@/app/api/flavors/servce'

export const dynamic = 'force-dynamic'

export default async function NewPage() {
  const [beans, flavors] = await Promise.all([beansService.getBeans(), flavorsService.getFlavors()])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-md items-center px-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="font-medium">New Entry</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-card" />}>
          <NewEntryTabs beans={beans} flavors={flavors} />
        </Suspense>
      </main>
    </div>
  )
}
