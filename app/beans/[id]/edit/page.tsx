import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { beansService } from '@/app/beans/service'
import { NewBeanForm } from '@/components/new-bean-form'
import { getCurrentUser } from '@/lib/auth/get-current-user'

interface EditBeanPageProps {
  params: Promise<{ id: string }>
}

export default async function EditBeanPage({ params }: EditBeanPageProps) {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const { id } = await params
  const bean = await beansService.getBeanById(id, user.id)

  if (!bean) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-md items-center px-4">
          <div className="flex items-center gap-3">
            <Link href={`/beans/${id}`} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-secondary">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="font-medium">Edit Bean</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        <NewBeanForm mode="edit" initialBean={bean} />
      </main>
    </div>
  )
}
