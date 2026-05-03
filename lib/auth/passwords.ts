import { randomBytes, scrypt, timingSafeEqual } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)

const SALT_BYTES = 32
const KEY_BYTES = 64

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = randomBytes(SALT_BYTES).toString('hex')
  const derivedKey = (await scryptAsync(password, salt, KEY_BYTES)) as Buffer
  return { hash: derivedKey.toString('hex'), salt }
}

export async function verifyPassword(
  password: string,
  storedHash: string,
  salt: string,
): Promise<boolean> {
  const derivedKey = (await scryptAsync(password, salt, KEY_BYTES)) as Buffer
  const storedBuffer = Buffer.from(storedHash, 'hex')
  if (derivedKey.length !== storedBuffer.length) return false
  return timingSafeEqual(derivedKey, storedBuffer)
}
