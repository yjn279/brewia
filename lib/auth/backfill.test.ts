// @vitest-environment node

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { tmpdir } from 'os'
import { join } from 'path'
import { unlinkSync } from 'fs'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { performBackfill } from './backfill'

/**
 * performBackfill はトランザクションを使用する。
 * @libsql/client の ':memory:' URL はトランザクション時に別接続を開くため、
 * CREATE TABLE で作ったテーブルが transaction 内から見えなくなる。
 * 回避策として一時ファイルを使用し、テスト後に削除する。
 */
let currentDbPath: string | null = null

function createTestDb() {
  const dbPath = join(tmpdir(), `backfill_test_${Date.now()}_${Math.random().toString(36).slice(2)}.db`)
  currentDbPath = dbPath
  const client = createClient({ url: `file:${dbPath}` })
  const db = drizzle(client)
  return { client, db }
}

async function setupSchema(client: ReturnType<typeof createClient>) {
  // FK 制約はテスト用ダミーデータの挿入を簡単にするため無効化する
  await client.execute(`PRAGMA foreign_keys = OFF`)
  await client.execute(`
    CREATE TABLE IF NOT EXISTS "user" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "name" TEXT,
      "email" TEXT NOT NULL UNIQUE,
      "emailVerified" INTEGER,
      "image" TEXT
    )
  `)
  await client.execute(`
    CREATE TABLE IF NOT EXISTS "bean" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "user_id" TEXT REFERENCES "user"("id"),
      "name" TEXT NOT NULL DEFAULT '',
      "country" TEXT NOT NULL DEFAULT '',
      "region" TEXT,
      "farm" TEXT,
      "process" TEXT,
      "variety" TEXT,
      "roast" TEXT NOT NULL DEFAULT '',
      "roaster" TEXT,
      "notes" TEXT,
      "created" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await client.execute(`
    CREATE TABLE IF NOT EXISTS "brew" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "user_id" TEXT REFERENCES "user"("id"),
      "bean_id" TEXT NOT NULL DEFAULT '',
      "bean_weight" REAL NOT NULL DEFAULT 0,
      "bean_grind" REAL,
      "water_weight" REAL NOT NULL DEFAULT 0,
      "water_temp" REAL,
      "steps" TEXT NOT NULL DEFAULT '[]',
      "aroma" INTEGER NOT NULL DEFAULT 0,
      "acidity" INTEGER NOT NULL DEFAULT 0,
      "sweetness" INTEGER NOT NULL DEFAULT 0,
      "body" INTEGER NOT NULL DEFAULT 0,
      "overall" INTEGER NOT NULL DEFAULT 0,
      "notes" TEXT,
      "created" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

describe('performBackfill()', () => {
  let client: ReturnType<typeof createClient>
  let db: ReturnType<typeof drizzle>

  beforeEach(async () => {
    const testDb = createTestDb()
    client = testDb.client
    db = testDb.db
    await setupSchema(client)
  })

  afterEach(() => {
    // 一時ファイルを削除してテスト間の状態漏洩を防ぐ
    if (currentDbPath) {
      try { unlinkSync(currentDbPath) } catch { /* ignore */ }
      try { unlinkSync(currentDbPath + '-wal') } catch { /* ignore */ }
      try { unlinkSync(currentDbPath + '-shm') } catch { /* ignore */ }
      currentDbPath = null
    }
  })

  describe('正常系: user_id IS NULL の行が存在する', () => {
    it('BF1: bean テーブルに user_id IS NULL の行が 1 件あるとき、その行の user_id が引数の userId に更新される', async () => {
      await client.execute({
        sql: `INSERT INTO bean (id, name, country, roast, user_id) VALUES (?, ?, ?, ?, NULL)`,
        args: ['bean-1', 'Ethiopia', 'Ethiopia', 'Light'],
      })

      const result = await performBackfill('user-1', db)

      const rows = await client.execute({
        sql: `SELECT user_id FROM bean WHERE id = ?`,
        args: ['bean-1'],
      })
      expect(rows.rows[0][0]).toBe('user-1')
      expect(result.beansUpdated).toBe(1)
      expect(result.brewsUpdated).toBe(0)
    })

    it('BF2: brew テーブルに user_id IS NULL の行が 1 件あるとき、その行の user_id が引数の userId に更新される', async () => {
      await client.execute({
        sql: `INSERT INTO bean (id, name, country, roast, user_id) VALUES (?, ?, ?, ?, NULL)`,
        args: ['bean-1', 'Ethiopia', 'Ethiopia', 'Light'],
      })
      await client.execute({
        sql: `INSERT INTO brew (id, bean_id, bean_weight, water_weight, steps, aroma, acidity, sweetness, body, overall, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
        args: ['brew-1', 'bean-1', 15, 240, '[]', 3, 3, 3, 3, 3],
      })

      const result = await performBackfill('user-1', db)

      const rows = await client.execute({
        sql: `SELECT user_id FROM brew WHERE id = ?`,
        args: ['brew-1'],
      })
      expect(rows.rows[0][0]).toBe('user-1')
      expect(result.brewsUpdated).toBe(1)
    })

    it('BF3: bean と brew の両方に NULL 行が複数あるとき、すべての行が userId に更新される', async () => {
      await client.execute({
        sql: `INSERT INTO bean (id, name, country, roast, user_id) VALUES (?, ?, ?, ?, NULL)`,
        args: ['bean-1', 'Ethiopia', 'Ethiopia', 'Light'],
      })
      await client.execute({
        sql: `INSERT INTO bean (id, name, country, roast, user_id) VALUES (?, ?, ?, ?, NULL)`,
        args: ['bean-2', 'Kenya', 'Kenya', 'Medium'],
      })
      await client.execute({
        sql: `INSERT INTO brew (id, bean_id, bean_weight, water_weight, steps, aroma, acidity, sweetness, body, overall, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
        args: ['brew-1', 'bean-1', 15, 240, '[]', 3, 3, 3, 3, 3],
      })
      await client.execute({
        sql: `INSERT INTO brew (id, bean_id, bean_weight, water_weight, steps, aroma, acidity, sweetness, body, overall, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
        args: ['brew-2', 'bean-1', 15, 240, '[]', 4, 4, 4, 4, 4],
      })
      await client.execute({
        sql: `INSERT INTO brew (id, bean_id, bean_weight, water_weight, steps, aroma, acidity, sweetness, body, overall, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
        args: ['brew-3', 'bean-2', 15, 240, '[]', 5, 5, 5, 5, 5],
      })

      const result = await performBackfill('user-1', db)

      const beanNull = await client.execute(`SELECT COUNT(*) as cnt FROM bean WHERE user_id IS NULL`)
      const brewNull = await client.execute(`SELECT COUNT(*) as cnt FROM brew WHERE user_id IS NULL`)
      expect(Number(beanNull.rows[0][0])).toBe(0)
      expect(Number(brewNull.rows[0][0])).toBe(0)
      expect(result.beansUpdated).toBe(2)
      expect(result.brewsUpdated).toBe(3)
    })
  })

  describe('冪等性', () => {
    it('BF4: 同じ userId で 2 回 performBackfill を実行しても結果が変わらない', async () => {
      await client.execute({
        sql: `INSERT INTO bean (id, name, country, roast, user_id) VALUES (?, ?, ?, ?, NULL)`,
        args: ['bean-1', 'Ethiopia', 'Ethiopia', 'Light'],
      })

      await performBackfill('user-1', db)
      const result2 = await performBackfill('user-1', db)

      const rows = await client.execute({
        sql: `SELECT user_id FROM bean WHERE id = ?`,
        args: ['bean-1'],
      })
      expect(rows.rows[0][0]).toBe('user-1')

      const nullCount = await client.execute(`SELECT COUNT(*) FROM bean WHERE user_id IS NULL`)
      expect(Number(nullCount.rows[0][0])).toBe(0)

      // 2 回目は NULL 行が 0 件なので 0 件更新
      expect(result2.beansUpdated).toBe(0)
    })

    it('BF5: すでに user_id が設定されている行は上書きされない', async () => {
      await client.execute({
        sql: `INSERT INTO bean (id, name, country, roast, user_id) VALUES (?, ?, ?, ?, ?)`,
        args: ['bean-existing', 'Ethiopia', 'Ethiopia', 'Light', 'original-user'],
      })

      await performBackfill('new-user', db)

      const rows = await client.execute({
        sql: `SELECT user_id FROM bean WHERE id = ?`,
        args: ['bean-existing'],
      })
      expect(rows.rows[0][0]).toBe('original-user')
    })
  })

  describe('0 件ケース', () => {
    it('BF6: user_id IS NULL の行が 0 件のとき エラーにならず正常終了する', async () => {
      // テーブルは空
      await expect(performBackfill('user-1', db)).resolves.toEqual({
        beansUpdated: 0,
        brewsUpdated: 0,
      })
    })
  })
})
