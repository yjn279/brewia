'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { NewBeanForm } from '@/components/new-bean-form'
import { NewBrewForm } from '@/components/new-brew-form'
import { Coffee, Flame } from 'lucide-react'

export function NewEntryTabs() {
  const searchParams = useSearchParams()
  const initialType = searchParams.get('type') || 'brew'
  const initialBean = searchParams.get('bean') || ''
  
  const [activeTab, setActiveTab] = useState<'bean' | 'brew'>(
    initialType === 'bean' ? 'bean' : 'brew'
  )

  useEffect(() => {
    const type = searchParams.get('type')
    if (type === 'bean' || type === 'brew') {
      setActiveTab(type)
    }
  }, [searchParams])

  return (
    <div>
      {/* Tab Switcher */}
      <div className="mb-6 flex rounded-xl bg-secondary p-1">
        <button
          onClick={() => setActiveTab('brew')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all',
            activeTab === 'brew'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
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

      {/* Forms */}
      {activeTab === 'brew' ? (
        <NewBrewForm initialBeanId={initialBean} />
      ) : (
        <NewBeanForm />
      )}
    </div>
  )
}
