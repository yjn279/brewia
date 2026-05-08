import NextAuth from 'next-auth'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import Google from 'next-auth/providers/google'
import Resend from 'next-auth/providers/resend'
import { db } from '@/lib/db/drizzle'
import {
  usersTable,
  accountsTable,
  sessionsTable,
  verificationTokensTable,
} from '@/lib/db/schema'
import { performBackfill } from '@/lib/auth/backfill'

export const { auth, handlers, signIn, signOut } = NextAuth({
  redirectProxyUrl: process.env.AUTH_REDIRECT_PROXY_URL,
  adapter: DrizzleAdapter(db, {
    usersTable,
    accountsTable,
    sessionsTable,
    verificationTokensTable,
  }),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.EMAIL_FROM ?? 'noreply@example.com',
    }),
  ],
  session: {
    strategy: 'database',
  },
  callbacks: {
    session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id
      }
      return session
    },
  },
  events: {
    async signIn({ user }) {
      if (user.id) {
        await performBackfill(user.id, db)
      }
    },
  },
})
