'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { NewBeanForm } from '@/components/new-bean-form'
import { NewBrewForm } from '@/components/new-brew-form'
import type { Bean, BrewWithBean, Flavor } from '@/lib/types'
import { Coffee, Flame } from 'lucide-react'

interface NewEntryTabsProps {
  beans: Bean[]
  flavors: Flavor[]
  initialBean?: Bean
  initialBrew?: BrewWithBean
}

export function NewEntryTabs({ beans, flavors, initialBean: initialBeanData, initialBrew }: NewEntryTabsProps) {
  const searchParams = useSearchParams()
  const initialType = searchParams.get('type') || 'brew'
  const initialBeanId = searchParams.get('bean') || initialBeanData?.id || ''
  const hasBeans = beans.length > 0

  const [activeTab, setActiveTab] = useState<'bean' | 'brew'>(
    !hasBeans || initialType === 'bean' ? 'bean' : 'brew'
  )

  useEffect(() => {
    if (!hasBeans) {
      setActiveTab('bean')
      return
    }

    const type = searchParams.get('type')
    if (type === 'bean' || type === 'brew') {
      setActiveTab(type)
    }
  }, [hasBeans, searchParams])

  return (
    <div>
      {/* Tab Switcher */}
      <div className="mb-6 flex rounded-xl bg-secondary p-1">
        <button
          onClick={() => setActiveTab('brew')}
          disabled={!hasBeans}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all',
            activeTab === 'brew'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
            !hasBeans && 'cursor-not-allowed opacity-50 hover:text-muted-foreground'
          )}
        >
          <Flame className="h-4 w-4" />
          Log Brew
        </button>
        <button
          onClick={() => setActiveTab('bean')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all',
            activeTab === 'bean'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Coffee className="h-4 w-4" />
          Add Bean
        </button>
      </div>
      {!hasBeans && (
        <p className="mb-6 rounded-xl border border-dashed bg-card px-4 py-3 text-sm text-muted-foreground">
          Add a bean first. Brew logging is enabled after at least one bean exists in the
          database.
        </p>
      )}

      {/* Forms */}
      {activeTab === 'brew' ? (
        <NewBrewForm
          initialBeanId={initialBeanId}
          initialBrew={initialBrew}
          beans={beans}
          flavors={flavors}
        />
      ) : (
        <NewBeanForm initialBean={initialBeanData} />
      )}
    </div>
  )
}
