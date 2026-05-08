import { isNull } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import { beansTable, brewsTable } from '@/lib/db/schema'

/**
 * user_id IS NULL な bean / brew 全行を引数の userId に割り当てる。
 * 冪等: 2 回目以降は NULL 行が 0 件なので 0 件更新になる。
 *
 * @param userId  割り当て先のユーザー ID
 * @param database  Drizzle DB インスタンス（テスト時に in-memory を注入可能）
 */
export async function performBackfill(
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  database: LibSQLDatabase<any>,
): Promise<{ beansUpdated: number; brewsUpdated: number }> {
  // トランザクションで 2 つの UPDATE をラップ。
  // 途中で失敗した場合は両方の UPDATE がロールバックされ、
  // 「bean は更新済みで brew は NULL のまま」という不整合が生じない。
  return database.transaction(async (tx) => {
    const beansResult = await tx
      .update(beansTable)
      .set({ userId })
      .where(isNull(beansTable.userId))
      .returning({ id: beansTable.id })

    const brewsResult = await tx
      .update(brewsTable)
      .set({ userId })
      .where(isNull(brewsTable.userId))
      .returning({ id: brewsTable.id })

    return {
      beansUpdated: beansResult.length,
      brewsUpdated: brewsResult.length,
    }
  })
}
