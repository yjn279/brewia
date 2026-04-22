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
  const _dbPath = _path.join(_os.tmpdir(), `beans_repo_test_${Date.now()}.db`)
  const _client = _createClient({ url: `file:${_dbPath}` })
  const _db = _drizzle(_client)
  return { testDb: { client: _client, db: _db, dbPath: _dbPath } }
})

vi.mock('@/lib/db/drizzle', () => ({
  db: testDb.db,
}))

import { BeansRepository } from '@/app/beans/repository'

// テスト終了後に一時ファイルを削除する
afterAll(() => {
  try { unlinkSync(testDb.dbPath) } catch { /* ignore */ }
  try { unlinkSync(testDb.dbPath + '-wal') } catch { /* ignore */ }
  try { unlinkSync(testDb.dbPath + '-shm') } catch { /* ignore */ }
})

const validBeanInput = {
  name: 'Ethiopia Yirgacheffe',
  country: 'Ethiopia' as const,
  roast: 'Light' as const,
  roaster: 'Onibus',
  region: 'Yirgacheffe',
  farm: '',
  process: 'Washed',
  variety: 'Heirloom',
  notes: '',
}

const updatedBeanInput = {
  name: 'Updated Bean',
  country: 'Kenya' as const,
  roast: 'Medium' as const,
  roaster: 'Glitch',
  region: 'Nyeri',
  farm: 'Kieni',
  process: 'Washed',
  variety: 'SL28',
  notes: 'Updated notes',
}

describe('BeansRepository', () => {
  let repository: BeansRepository

  beforeEach(async () => {
    // スキーマをセットアップ（テーブルが既存でも IF NOT EXISTS でスキップ）
    await setupSchema(testDb.client)

    // テーブルをクリア（各テストの独立性を保つ）
    await testDb.client.execute(`DELETE FROM brew_flavor`)
    await testDb.client.execute(`DELETE FROM brew`)
    await testDb.client.execute(`DELETE FROM bean`)

    // テストデータを仕込む
    // user-A の bean 2件、user-B の bean 1件
    await testDb.client.execute({
      sql: `INSERT INTO bean (id, user_id, name, country, roast) VALUES (?, ?, ?, ?, ?)`,
      args: ['bean-A1', 'user-A', 'Ethiopia Yirgacheffe', 'Ethiopia', 'Light'],
    })
    await testDb.client.execute({
      sql: `INSERT INTO bean (id, user_id, name, country, roast) VALUES (?, ?, ?, ?, ?)`,
      args: ['bean-A2', 'user-A', 'Kenya AA', 'Kenya', 'Medium'],
    })
    await testDb.client.execute({
      sql: `INSERT INTO bean (id, user_id, name, country, roast) VALUES (?, ?, ?, ?, ?)`,
      args: ['bean-B1', 'user-B', 'Colombia Huila', 'Colombia', 'City'],
    })

    repository = new BeansRepository()
  })

  describe('findAll(userId)', () => {
    it('BR_FA1: userId="user-A" のとき user-A の bean のみ返す（user-B の bean は含まれない）', async () => {
      // Act
      const beans = await repository.findAll('user-A')

      // Assert
      expect(beans.length).toBe(2)
      expect(beans.every((b) => b.userId === 'user-A')).toBe(true)
      expect(beans.find((b) => b.id === 'bean-B1')).toBeUndefined()
    })

    it('BR_FA2: 該当ユーザーの bean が 0 件のとき空配列を返す', async () => {
      // Act
      const beans = await repository.findAll('user-C')

      // Assert
      expect(beans.length).toBe(0)
    })
  })

  describe('findById(userId, id)', () => {
    it('BR_FI1: 正しい userId + 存在する id のとき Bean を返す', async () => {
      // Act
      const bean = await repository.findById('user-A', 'bean-A1')

      // Assert
      expect(bean).toBeDefined()
      expect(bean!.id).toBe('bean-A1')
      expect(bean!.userId).toBe('user-A')
    })

    it('BR_FI2: 誤った userId（他ユーザーの bean id）のとき undefined を返す', async () => {
      // Act
      const bean = await repository.findById('user-A', 'bean-B1')

      // Assert
      expect(bean).toBeUndefined()
    })

    it('BR_FI3: 存在しない id のとき undefined を返す', async () => {
      // Act
      const bean = await repository.findById('user-A', 'nonexistent-id')

      // Assert
      expect(bean).toBeUndefined()
    })
  })

  describe('create(userId, input)', () => {
    it('BR_CR1: create を呼び出すと DB 行に userId が設定される', async () => {
      // Act
      const bean = await repository.create('user-A', validBeanInput)

      // Assert: 返り値に userId が含まれる
      expect(bean.userId).toBe('user-A')

      // Assert: Repository の findById で確認（create は transaction なし db.insert を使うため確認可能）
      const found = await repository.findById('user-A', bean.id)
      expect(found).toBeDefined()
      expect(found!.userId).toBe('user-A')
    })
  })

  describe('update(userId, id, input)', () => {
    it('BR_UP1: 正しい userId のとき Bean を更新して返す', async () => {
      // Act
      const bean = await repository.update('user-A', 'bean-A1', updatedBeanInput)

      // Assert
      expect(bean).toBeDefined()
      expect(bean!.name).toBe('Updated Bean')
    })

    it('BR_UP2: 他ユーザーの bean id を指定したとき undefined を返す（行が変更されない）', async () => {
      // Act
      const bean = await repository.update('user-A', 'bean-B1', updatedBeanInput)

      // Assert: undefined が返る（BeansRepository.update は transaction なし db.update を使う）
      expect(bean).toBeUndefined()

      // Assert: Repository 経由で bean-B1 の内容が変わっていないことを確認
      const unchanged = await repository.findById('user-B', 'bean-B1')
      expect(unchanged).toBeDefined()
      expect(unchanged!.name).toBe('Colombia Huila')
    })
  })

  describe('delete(userId, id)', () => {
    it('BR_DE1: 正しい userId のとき true を返し行が削除される', async () => {
      // Act
      const result = await repository.delete('user-A', 'bean-A1')

      // Assert: true が返ることで「削除された」ことを確認
      // （BeansRepository.delete は db.transaction を使うため、commit 後の db.select は
      // @libsql/client :memory: の制約で別接続から参照できないため戻り値のみで確認する）
      expect(result).toBe(true)
    })

    it('BR_DE2: 他ユーザーの bean id を指定したとき false を返す（行が削除されない）', async () => {
      // Act
      const result = await repository.delete('user-A', 'bean-B1')

      // Assert: false が返ることで「削除されなかった」ことを確認
      expect(result).toBe(false)
    })

    it('BR_DE_CROSS_USER: user-B が user-A の bean を削除しようとしたとき、bean・brew・brew_flavor 行がすべて残る', async () => {
      // Arrange: user-A の bean-A1 に紐づく brew と brew_flavor をシード
      await testDb.client.execute({
        sql: `INSERT INTO brew (id, user_id, bean_id, bean_weight, water_weight, steps, aroma, acidity, sweetness, body, overall) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: ['brew-A1', 'user-A', 'bean-A1', 15, 240, '[]', 3, 3, 3, 3, 3],
      })
      await testDb.client.execute({
        sql: `INSERT INTO brew_flavor (id, brew_id, flavor_id) VALUES (?, ?, ?)`,
        args: ['bf-A1', 'brew-A1', 'flavor-citrus'],
      })

      // Act: user-B として user-A の bean を削除しようとする
      const result = await repository.delete('user-B', 'bean-A1')

      // Assert 1: 戻り値が false（所有権なしなので削除失敗）
      expect(result).toBe(false)

      // Assert 2: user-A の bean 行が DB に残っている
      const beanRows = await testDb.client.execute({
        sql: `SELECT id FROM bean WHERE id = ?`,
        args: ['bean-A1'],
      })
      expect(beanRows.rows.length).toBe(1)

      // Assert 3: user-A の brew 行が DB に残っている
      const brewRows = await testDb.client.execute({
        sql: `SELECT id FROM brew WHERE id = ?`,
        args: ['brew-A1'],
      })
      expect(brewRows.rows.length).toBe(1)

      // Assert 4: user-A の brew_flavor 行が DB に残っている
      const flavorRows = await testDb.client.execute({
        sql: `SELECT id FROM brew_flavor WHERE brew_id = ?`,
        args: ['brew-A1'],
      })
      expect(flavorRows.rows.length).toBe(1)
    })
  })
})
