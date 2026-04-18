'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistrar(): null {
  useEffect(() => {
    if (navigator.serviceWorker) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.warn('[SW] registration failed:', err))
    }
  }, [])

  return null
}
