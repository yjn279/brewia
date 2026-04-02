import 'server-only'

import { drizzle } from 'drizzle-orm/libsql'
import { getTursoClient } from '@/lib/turso'

export const db = drizzle(getTursoClient())
