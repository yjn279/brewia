import { AuthForm } from '@/components/auth-form'

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Brewia</h1>
          <p className="mt-2 text-sm text-muted-foreground">Create your coffee journal</p>
        </div>
        <div className="rounded-xl bg-card p-6 shadow-sm">
          <AuthForm mode="signup" />
        </div>
      </div>
    </div>
  )
}
