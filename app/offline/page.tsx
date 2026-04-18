import Link from 'next/link'

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">You are offline</h1>
      <p className="text-muted-foreground">
        No internet connection. Please check your network and try again.
      </p>
      <Link
        href="/"
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
      >
        Back to Home
      </Link>
    </div>
  )
}
