import 'server-only'

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/drizzle'
import { usersTable } from '@/lib/db/schema'

export interface UserRecord {
  id: string
  email: string
  passwordHash: string
  passwordSalt: string
}

export class AuthRepository {
  async findByEmail(email: string): Promise<UserRecord | undefined> {
    const [row] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1)

    return row
  }

  async create(input: {
    email: string
    passwordHash: string
    passwordSalt: string
  }): Promise<UserRecord> {
    const [row] = await db
      .insert(usersTable)
      .values(input)
      .returning()

    return row
  }
}
