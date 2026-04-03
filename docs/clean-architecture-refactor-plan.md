# Clean Architecture Refactor Plan for Brewia

## 目的

現状は `app/` (UI / API) から `lib/db/*` を直接呼び出しており、
**プレゼンテーション層がデータアクセス層に強く依存**しています。
この構造だと、将来 Turso/Drizzle 以外に差し替えるときに UI/API 変更が波及しやすくなります。

このドキュメントは、既存コードを壊しすぎない段階的移行を前提に、
Clean Architecture 観点での現実的なリファクタリング案をまとめます。

---

## 現状の課題（コード観察ベース）

1. **境界が曖昧**
   - API ルートが `createBrew` / `createBean` を直接呼び、リクエスト整形・バリデーション・ユースケース実行・レスポンス生成が同居。
2. **ユースケース不在**
   - 例: `POST /api/brews` の「重複フレーバー排除」「空文字→null変換」などのドメインルールが route 側に存在。
3. **型の責務が混在**
   - `lib/types.ts` に API 表現、ドメイン表現、DB 近似表現が混在。
4. **横断処理の重複**
   - `toNullable` が複数 route に重複。
5. **将来の置換コストが高い**
   - `app/page.tsx` などの画面が `lib/db` に直接依存しているため、
     ReadModel 変更や外部 API 化で修正範囲が広がる。

---

## 目標アーキテクチャ（推奨）

```text
app (UI / Route Handlers)
  -> application (usecases)
    -> domain (entities, value objects, rules)
      -> ports (repository interfaces)
        <- infrastructure (drizzle repositories)
```

- **domain**: ビジネスルールと不変条件だけを持つ
- **application**: ユースケース（入力 DTO -> 実行 -> 出力 DTO）
- **infrastructure**: Drizzle/Turso 実装
- **presentation**: Next.js ページと API route（薄く保つ）

---

## ディレクトリ再編の例

```text
lib/
  domain/
    bean.ts
    brew.ts
    flavor.ts
  application/
    usecases/
      create-bean.ts
      create-brew.ts
      list-beans.ts
      list-brews.ts
      get-brew-detail.ts
    dto/
      bean-dto.ts
      brew-dto.ts
  ports/
    bean-repository.ts
    brew-repository.ts
    flavor-repository.ts
  infrastructure/
    db/
      drizzle/
        repositories/
          drizzle-bean-repository.ts
          drizzle-brew-repository.ts
          drizzle-flavor-repository.ts
      schema.ts
      client.ts
  shared/
    nullable.ts
    result.ts
```

---

## 優先度付きリファクタリング手順

### Phase 1（低リスク）

1. `toNullable` を `lib/shared/nullable.ts` に抽出。
2. route 内の Zod スキーマは維持したまま、
   route は「parse -> usecase call -> response」だけに縮小。
3. `lib/db/index.ts` を直接 export する代わりに、
   `application` の公開 API を作る。

### Phase 2（中リスク）

1. `CreateBeanUseCase` / `CreateBrewUseCase` を追加。
2. route から `new Drizzle*Repository(...)` を注入して usecase 実行。
3. 既存 `lib/db/*` の関数を repository 実装に寄せる。

### Phase 3（中〜高リスク）

1. `lib/types.ts` を分割して、
   - `domain` 型
   - `application` DTO
   - `presentation` 型
   を明示的に分離。
2. `app/page.tsx` など page 側で DB 呼び出しを避け、
   `application/queries` 経由に統一。
3. テスト戦略を `usecase` 単体 + `repository` 結合に分離。

---

## 具体的な設計ルール

1. **API Route は薄く**
   - 入力検証
   - ユースケース実行
   - HTTP ステータス変換
   以外を書かない。

2. **ビジネスルールは usecase/domain 側へ**
   - 重複 `flavorIds` 除去
   - 必須/任意の意味づけ
   - スコア範囲のドメイン制約（必要なら Value Object 化）

3. **Repository は interface を先に定義**
   - `BrewRepository.create()` などを `ports` に置き、
     Drizzle 実装は `infrastructure` に閉じ込める。

4. **DTO と Entity を分離**
   - 永続化都合の `string | null` と、
     ドメイン都合の Optional を区別する。

---

## 最初の 1PR でやると良い最小スコープ

- `lib/shared/nullable.ts` 追加
- `lib/application/usecases/create-bean.ts` 追加
- `lib/application/usecases/create-brew.ts` 追加
- `app/api/beans/route.ts` と `app/api/brews/route.ts` を usecase 呼び出しへ変更

この 1PR だけでも、
「ルートが DB を直接触る構造」から「ルートがユースケースを呼ぶ構造」へ進められます。

---

## 補足（このプロジェクトへの適用時の意識）

- 既に `lib/db/*` で関心ごとの分割は進んでいるため、
  **全面置換よりラップ戦略**が安全。
- ページ側は Server Components で簡潔に書けているため、
  先に API route から分離を進める方が費用対効果が高い。
- 大規模化前に `application` 層を入れておくと、
  「モバイル専用 API」「分析系集計」「将来の権限制御」を追加しやすい。


---

## テスト仕様書

- [テスト仕様書（目次）](./testing/README.md)
- [テスト戦略仕様](./testing/strategy.md)
- [ユースケース単体テスト仕様](./testing/unit-usecases.md)
