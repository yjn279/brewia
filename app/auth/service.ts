import 'server-only'

import { AuthRepository } from '@/app/auth/repository'
import { hashPassword, verifyPassword } from '@/lib/auth/passwords'
import { createSession } from '@/lib/auth/session'

const authRepository = new AuthRepository()

export class AuthService {
  async signup(email: string, password: string): Promise<{ sessionId: string }> {
    const existing = await authRepository.findByEmail(email)
    if (existing) {
      const err = new Error('Email already in use')
      ;(err as NodeJS.ErrnoException).code = 'EMAIL_EXISTS'
      throw err
    }

    const { hash, salt } = await hashPassword(password)
    const user = await authRepository.create({
      email,
      passwordHash: hash,
      passwordSalt: salt,
    })

    const sessionId = await createSession(user.id)
    return { sessionId }
  }

  async login(email: string, password: string): Promise<{ sessionId: string } | null> {
    const user = await authRepository.findByEmail(email)
    if (!user) return null

    const valid = await verifyPassword(password, user.passwordHash, user.passwordSalt)
    if (!valid) return null

    const sessionId = await createSession(user.id)
    return { sessionId }
  }
}

export const authService = new AuthService()
