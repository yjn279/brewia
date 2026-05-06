// @vitest-environment node

import { createClient } from '@libsql/client'
import { unlinkSync } from 'fs'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

async function setupSchema(client: ReturnType<typeof createClient>) {
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
      "price_jpy" INTEGER,
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
  await client.execute(`
    CREATE TABLE IF NOT EXISTS "brew_flavor" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "brew_id" TEXT NOT NULL REFERENCES "brew"("id"),
      "flavor_id" TEXT NOT NULL,
      "created" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  // flavor テーブルも FlavorsRepository が参照するため作成
  await client.execute(`
    CREATE TABLE IF NOT EXISTS "flavor" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "name" TEXT NOT NULL DEFAULT '',
      "category" TEXT NOT NULL DEFAULT '',
      "subcategory" TEXT NOT NULL DEFAULT '',
      "created" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

// vi.hoisted で DB を作成し、vi.mock ファクトリで参照する
// ':memory:' は drizzle transaction 時に別接続を開くため、テーブルが見えなくなる制約がある。
// トランザクション後の DB 状態確認が必要なテストのため、一時ファイル DB を使用する。
const { testDb } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient: _createClient } = require('@libsql/client')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle: _drizzle } = require('drizzle-orm/libsql')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const _os = require('os')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const _path = require('path')
  const _dbPath = _path.join(_os.tmpdir(), `brews_repo_test_${Date.now()}.db`)
  const _client = _createClient({ url: `file:${_dbPath}` })
  const _db = _drizzle(_client)
  return { testDb: { client: _client, db: _db, dbPath: _dbPath } }
})

vi.mock('@/lib/db/drizzle', () => ({
  db: testDb.db,
}))

import { BrewsRepository } from '@/app/brews/repository'

// テスト終了後に一時ファイルを削除する
afterAll(() => {
  try { unlinkSync(testDb.dbPath) } catch { /* ignore */ }
  try { unlinkSync(testDb.dbPath + '-wal') } catch { /* ignore */ }
  try { unlinkSync(testDb.dbPath + '-shm') } catch { /* ignore */ }
})

const validBrewInput = {
  beanId: 'bean-A1',
  beanWeight: 15,
  beanGrind: 24,
  waterWeight: 240,
  waterTemp: 92,
  steps: [],
  aroma: 3,
  acidity: 3,
  sweetness: 3,
  body: 3,
  overall: 3,
  notes: '',
  flavorIds: [],
}

const updatedBrewInput = {
  beanId: 'bean-A1',
  beanWeight: 20,
  beanGrind: 26,
  waterWeight: 300,
  waterTemp: 94,
  steps: [],
  aroma: 4,
  acidity: 4,
  sweetness: 4,
  body: 4,
  overall: 4,
  notes: 'Updated',
  flavorIds: [],
}

describe('BrewsRepository', () => {
  let repository: BrewsRepository

  beforeEach(async () => {
    // スキーマをセットアップ
    await setupSchema(testDb.client)

    // テーブルをクリア（各テストの独立性を保つ）
    await testDb.client.execute(`DELETE FROM brew_flavor`)
    await testDb.client.execute(`DELETE FROM brew`)
    await testDb.client.execute(`DELETE FROM bean`)

    // テストデータを仕込む
    // bean テーブル: user-A の bean 1件、user-B の bean 1件
    await testDb.client.execute({
      sql: `INSERT INTO bean (id, user_id, name, country, roast) VALUES (?, ?, ?, ?, ?)`,
      args: ['bean-A1', 'user-A', 'Ethiopia Yirgacheffe', 'Ethiopia', 'Light'],
    })
    await testDb.client.execute({
      sql: `INSERT INTO bean (id, user_id, name, country, roast) VALUES (?, ?, ?, ?, ?)`,
      args: ['bean-B1', 'user-B', 'Colombia Huila', 'Colombia', 'City'],
    })

    // brew テーブル: user-A の brew 2件（bean-A1 に紐づく）、user-B の brew 1件（bean-B1 に紐づく）
    await testDb.client.execute({
      sql: `INSERT INTO brew (id, user_id, bean_id, bean_weight, water_weight, steps, aroma, acidity, sweetness, body, overall) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['brew-A1', 'user-A', 'bean-A1', 15, 240, '[]', 3, 3, 3, 3, 3],
    })
    await testDb.client.execute({
      sql: `INSERT INTO brew (id, user_id, bean_id, bean_weight, water_weight, steps, aroma, acidity, sweetness, body, overall) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['brew-A2', 'user-A', 'bean-A1', 20, 300, '[]', 4, 4, 4, 4, 4],
    })
    await testDb.client.execute({
      sql: `INSERT INTO brew (id, user_id, bean_id, bean_weight, water_weight, steps, aroma, acidity, sweetness, body, overall) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['brew-B1', 'user-B', 'bean-B1', 18, 270, '[]', 5, 5, 5, 5, 5],
    })

    repository = new BrewsRepository()
  })

  describe('findAll(userId)', () => {
    it('BRW_FA1: userId="user-A" のとき user-A の brew のみ返す', async () => {
      // Act
      const brews = await repository.findAll('user-A')

      // Assert
      expect(brews.length).toBe(2)
      expect(brews.find((b) => b.id === 'brew-B1')).toBeUndefined()
    })

    it('BRW_FA2: 該当ユーザーの brew が 0 件のとき空配列を返す', async () => {
      // Act
      const brews = await repository.findAll('user-C')

      // Assert
      expect(brews.length).toBe(0)
    })
  })

  describe('findByBeanId(userId, beanId)', () => {
    it('BRW_FB1: 自分の bean の beanId を渡したとき、その bean に紐づく自分の brew を返す', async () => {
      // Act
      const brews = await repository.findByBeanId('user-A', 'bean-A1')

      // Assert
      expect(brews.length).toBe(2)
    })

    it('BRW_FB2: 他ユーザーの bean の beanId を渡したとき空配列を返す（bean が見つからないため）', async () => {
      // Act: user-A として user-B の bean を指定
      const brews = await repository.findByBeanId('user-A', 'bean-B1')

      // Assert: beansRepository.findById(userId, beanId) が undefined を返し、空配列になる
      expect(brews.length).toBe(0)
    })
  })

  describe('findById(userId, id)', () => {
    it('BRW_FI1: 正しい userId + 存在する brew id のとき BrewWithBean を返す', async () => {
      // Act
      const brew = await repository.findById('user-A', 'brew-A1')

      // Assert
      expect(brew).toBeDefined()
      expect(brew!.id).toBe('brew-A1')
    })

    it('BRW_FI2: 他ユーザーの brew id を渡したとき undefined を返す', async () => {
      // Act
      const brew = await repository.findById('user-A', 'brew-B1')

      // Assert
      expect(brew).toBeUndefined()
    })
  })

  describe('findCountByBeanIdMap(userId)', () => {
    it('BRW_FC1: userId="user-A" のとき user-A の bean に紐づく brew 数のみ集計する', async () => {
      // Act
      const map = await repository.findCountByBeanIdMap('user-A')

      // Assert
      expect(map.get('bean-A1')).toBe(2)
      expect(map.has('bean-B1')).toBe(false)
    })
  })

  describe('create(userId, input)', () => {
    it('BRW_CR1: create を呼び出すと DB 行に userId が設定される', async () => {
      // Act
      const brew = await repository.create('user-A', validBrewInput)

      // Assert: 返り値に userId が含まれる（@libsql/client の :memory: + drizzle transaction の
      // 制約により、transaction commit 後の db.select では確認できないため、戻り値で確認する）
      expect(brew.userId).toBe('user-A')
      expect(brew.beanId).toBe(validBrewInput.beanId)
    })
  })

  describe('update(userId, id, input)', () => {
    it('BRW_UP1: 他ユーザーの brew id を指定したとき undefined を返す', async () => {
      // Act
      const brew = await repository.update('user-A', 'brew-B1', updatedBrewInput)

      // Assert
      expect(brew).toBeUndefined()
    })
  })

  describe('delete(userId, id)', () => {
    it('BRW_DE1: 他ユーザーの brew id を指定したとき false を返す（行が削除されない）', async () => {
      // Act
      const result = await repository.delete('user-A', 'brew-B1')

      // Assert: false が返ることで「削除されなかった」ことを確認
      // （@libsql/client の :memory: + drizzle transaction の制約により、
      // transaction commit 後の db.select は別接続で行われるため
      // transaction commit 後に db から行を確認することができない。
      // false が返ることで userId フィルタが機能していることを確認する）
      expect(result).toBe(false)
    })

    it('BRW_DE_CROSS_USER: user-B が user-A の brew を削除しようとしたとき、brew_flavor 行が残る', async () => {
      // Arrange: user-A の brew-A1 に紐づく brew_flavor 行をシード
      await testDb.client.execute({
        sql: `INSERT INTO brew_flavor (id, brew_id, flavor_id) VALUES (?, ?, ?)`,
        args: ['bf-A1', 'brew-A1', 'flavor-citrus'],
      })

      // Act: user-B として user-A の brew を削除しようとする
      const result = await repository.delete('user-B', 'brew-A1')

      // Assert 1: 戻り値が false（所有権なしなので削除失敗）
      expect(result).toBe(false)

      // Assert 2: user-A の brew 行が DB に残っている
      const brewRows = await testDb.client.execute({
        sql: `SELECT id FROM brew WHERE id = ?`,
        args: ['brew-A1'],
      })
      expect(brewRows.rows.length).toBe(1)

      // Assert 3: user-A の brew_flavor 行が DB に残っている（修正前は消えていた）
      const flavorRows = await testDb.client.execute({
        sql: `SELECT id FROM brew_flavor WHERE brew_id = ?`,
        args: ['brew-A1'],
      })
      expect(flavorRows.rows.length).toBe(1)
    })
  })
})
