import { promisify } from 'util'
import crypto from 'crypto'

const scrypt = promisify(crypto.scrypt)

const SALT_LENGTH = 16
const KEY_LENGTH = 64

export async function hashPassword(plain: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex')
  const derivedKey = (await scrypt(plain, salt, KEY_LENGTH)) as Buffer
  return `${salt}:${derivedKey.toString('hex')}`
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  const [salt, storedKey] = hash.split(':')
  if (!salt || !storedKey) {
    return false
  }
  const derivedKey = (await scrypt(plain, salt, KEY_LENGTH)) as Buffer
  const storedKeyBuf = Buffer.from(storedKey, 'hex')
  if (derivedKey.length !== storedKeyBuf.length) {
    return false
  }
  return crypto.timingSafeEqual(derivedKey, storedKeyBuf)
}
