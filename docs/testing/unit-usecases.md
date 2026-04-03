# ユースケース単体テスト仕様書

本書は、現在実装済み usecase / shared function のテスト仕様を
Given / When / Then 形式で定義します。

---

## A. `toNullable`

対象実装: `lib/shared/nullable.ts`

対象テスト: `test/lib/shared/nullable.spec.ts`

### A-1. undefined は null に変換される

- Given: `value = undefined`
- When: `toNullable(value)` を実行
- Then: `null` が返る

### A-2. 空文字は null に変換される

- Given: `value = ''`
- When: `toNullable(value)` を実行
- Then: `null` が返る

### A-3. 非空文字はそのまま返る

- Given: `value = 'Ethiopia'`
- When: `toNullable(value)` を実行
- Then: `'Ethiopia'` が返る

---

## B. `CreateBeanUseCase`

対象実装: `lib/application/usecases/create-bean.ts`

対象テスト: `test/lib/application/usecases/create-bean.spec.ts`

### B-1. 任意文字列の空入力を null 正規化して保存する

- Given:
  - `region/farm/process/variety/notes` が空文字
  - repository ダブル (`create`) を用意
- When: `CreateBeanUseCase.execute()` を実行
- Then:
  - repository の `create` が1回呼ばれる
  - 任意項目が `null` で渡される

補足:
- 現在の仕様では `roaster` は usecase 入力上必須文字列。
- route の入力検証（zod）で必須制約を持つ前提と整合。

---

## C. `CreateBrewUseCase`

対象実装: `lib/application/usecases/create-brew.ts`

対象テスト: `test/lib/application/usecases/create-brew.spec.ts`

### C-1. フレーバーID重複排除と notes 正規化

- Given:
  - `flavorIds = ['citrus', 'berry', 'citrus']`
  - `notes = ''`
  - repository ダブル (`create`) を用意
- When: `CreateBrewUseCase.execute()` を実行
- Then:
  - repository の `create` が1回呼ばれる
  - `flavorIds` は `['citrus', 'berry']` で渡される
  - `notes` は `null` で渡される

---

## D. 今後追加するべきテスト仕様（次フェーズ）

1. `CreateBeanUseCase`
   - `roaster` 非空文字の保持
   - 任意項目が undefined の場合の null 正規化
2. `CreateBrewUseCase`
   - `notes` が非空文字のとき保持される
   - `flavorIds` が空配列のときそのまま維持
3. API Route
   - 不正リクエストで 400
   - 正常系で 201
   - usecase 呼び出し失敗時のエラーハンドリング

