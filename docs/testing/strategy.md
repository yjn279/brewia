# テスト戦略仕様（t_wada 流 TDD ベース）

## 1. 目的

- 変更容易性を維持しながら、安全にリファクタリングできる状態を作る。
- 先にテストで振る舞いを固定し、設計を小さく改善する。
- Clean Architecture の境界（presentation / application / infrastructure）を壊さない。

## 2. 基本方針

1. **Red -> Green -> Refactor を小さく回す**
   - 1テストケースごとに最小実装で通す。
2. **公開仕様（振る舞い）をテストする**
   - 内部実装より、入力と出力・副作用に注目する。
3. **副作用の境界はダブルで隔離する**
   - usecase 単体では repository をモック/スタブ化し、
     ビジネスルールだけを確認する。
4. **テスト命名は仕様文として読む**
   - 例: `deduplicates flavorIds and converts empty notes to null`

## 3. レイヤー別のテスト責務

### 3.1 application（usecase）

- 対象: 入力の正規化、重複排除、ルール適用、repository 呼び出し契約。
- 手法: ユニットテスト。
- 依存: repository はテストダブル。

### 3.2 infrastructure（DB 実装）

- 対象: Drizzle クエリ、マッピング、トランザクション整合。
- 手法: 結合テスト（将来的に追加）。
- 依存: テスト用 DB または isolated schema。

### 3.3 presentation（API Route / Page）

- 対象: HTTP 入出力、ステータスコード、シリアライズ。
- 手法: ハンドラテスト / E2E（段階導入）。
- 依存: usecase を差し替え可能にして疎結合化。

## 4. 優先順位（現状）

1. usecase 単体テストを先に拡充（現在ここ）。
2. API Route の薄化後、route テストを追加。
3. repository の結合テストを追加。

## 5. 完了条件（Definition of Done）

- 追加したユースケース仕様に対応するテストが存在する。
- `pnpm test` が成功する。
- ルール変更時、まず失敗するテストを1つ以上追加してから実装する。

