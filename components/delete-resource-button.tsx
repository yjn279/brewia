'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DeleteResourceButtonProps {
  endpoint: string
  redirectTo: string
  confirmMessage: string
  className?: string
}

export function DeleteResourceButton({ endpoint, redirectTo, confirmMessage, className }: DeleteResourceButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm(confirmMessage)) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(endpoint, { method: 'DELETE' })

      if (!response.ok) {
        throw new Error('Failed to delete resource')
      }

      router.push(redirectTo)
      router.refresh()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
      className={className}
    >
      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      <span className="ml-2">Delete</span>
    </Button>
  )
}
