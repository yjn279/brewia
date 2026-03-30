'use client'

import { useEffect, useState } from 'react'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function Greeting() {
  const [greeting, setGreeting] = useState('Hello')

  useEffect(() => {
    setGreeting(getGreeting())
  }, [])

  return (
    <h1 className="font-display text-4xl font-semibold leading-none tracking-tight text-foreground sm:text-5xl">
      {greeting}
    </h1>
  )
}

export function CurrentDate() {
  const [dateStr, setDateStr] = useState('')

  useEffect(() => {
    setDateStr(
      new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    )
  }, [])

  return <time className="font-mono text-xs text-muted-foreground">{dateStr}</time>
}
