# サービス層単体テスト仕様書

本書は、現在実装済み service / shared function のテスト仕様を
Given / When / Then 形式で定義します。

---

## A. `toNullable`

対象実装: `lib/shared/nullable.ts`

対象テスト: `test/lib/shared/nullable.spec.ts`

### A-1. undefined は受け入れず例外を送出する

- Given: `value = undefined`
- When: `toNullable(value)` を実行
- Then: `undefined is not allowed` エラーを送出する

### A-2. 空文字は null に変換される

- Given: `value = ''`
- When: `toNullable(value)` を実行
- Then: `null` が返る

### A-3. null は null のまま返る

- Given: `value = null`
- When: `toNullable(value)` を実行
- Then: `null` が返る

### A-4. 非空文字はそのまま返る

- Given: `value = 'Ethiopia'`
- When: `toNullable(value)` を実行
- Then: `'Ethiopia'` が返る

---

## B. `BeanService`

対象実装:
- `lib/application/bean/service.ts`
- `lib/application/bean/repository.ts`

対象テスト: `test/lib/application/bean/service.spec.ts`

### B-1. 任意文字列の空入力を null 正規化して保存する

- Given:
  - `region/farm/process/variety/notes` が空文字
  - repository ダブル (`create`) を用意
- When: `BeanService.create()` を実行
- Then:
  - repository の `create` が1回呼ばれる
  - 任意項目が `null` で渡される

### B-2. undefined を渡した場合は例外にする

- Given:
  - `region = undefined`
- When: `BeanService.create()` を実行
- Then:
  - `undefined is not allowed` エラーを送出する

---

## C. `BrewService`

対象実装:
- `lib/application/brew/service.ts`
- `lib/application/brew/repository.ts`

対象テスト: `test/lib/application/brew/service.spec.ts`

### C-1. フレーバーID重複排除と notes 正規化

- Given:
  - `flavorIds = ['citrus', 'berry', 'citrus']`
  - `notes = ''`
  - repository ダブル (`create`) を用意
- When: `BrewService.create()` を実行
- Then:
  - repository の `create` が1回呼ばれる
  - `flavorIds` は `['citrus', 'berry']` で渡される
  - `notes` は `null` で渡される

### C-2. notes に undefined を渡した場合は例外にする

- Given:
  - `notes = undefined`
- When: `BrewService.create()` を実行
- Then:
  - `undefined is not allowed` エラーを送出する

---

## D. 今後追加するべきテスト仕様（次フェーズ）

1. `BeanService`
   - `roaster` 非空文字の保持
   - `region/farm/process/variety/notes` が null のときの保持
2. `BrewService`
   - `notes` が非空文字のとき保持される
   - `flavorIds` が空配列のときそのまま維持
3. API Route
   - 不正リクエストで 400
   - 正常系で 201
   - service 呼び出し失敗時のエラーハンドリング

