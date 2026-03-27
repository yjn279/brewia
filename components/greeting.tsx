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
    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
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
      })
    )
  }, [])

  return (
    <time className="font-mono text-xs text-muted-foreground">
      {dateStr}
    </time>
  )
}
