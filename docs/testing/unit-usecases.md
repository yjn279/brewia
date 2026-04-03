# テスト仕様書（Red フェーズ）

本書は、今回追加した **Red テスト**を Given / When / Then 形式で定義します。

> 注意: この段階ではテストを満たす実装修正は行いません。

---

## A. `CreateBeanService` 相当の仕様

対象テスト: `test/lib/application/services/create-bean.service.spec.ts`

### A-1. 空文字を null にせず空文字のまま渡す

- Given: `region/farm/process/variety/notes` が空文字
- When: service の `execute()` を実行
- Then: repository `create` に空文字のまま渡される

### A-2. undefined も空文字として扱う

- Given: 任意項目が未指定（undefined）
- When: service の `execute()` を実行
- Then: repository `create` に空文字として渡される

### A-3. roaster の非空文字を保持する

- Given: `roaster = 'Onibus'`
- When: service の `execute()` を実行
- Then: repository `create` に `'Onibus'` が渡される

---

## B. `CreateBrewService` 相当の仕様

対象テスト: `test/lib/application/services/create-brew.service.spec.ts`

### B-1. notes 空文字を null にせず空文字のまま渡す

- Given: `notes = ''`
- When: service の `execute()` を実行
- Then: repository `create` に `notes: ''` が渡される

### B-2. flavorIds が空配列なら空配列のまま渡す

- Given: `flavorIds = []`
- When: service の `execute()` を実行
- Then: repository `create` に `flavorIds: []` が渡される

### B-3. notes の非空文字を保持する

- Given: `notes = 'juicy'`
- When: service の `execute()` を実行
- Then: repository `create` に `notes: 'juicy'` が渡される

---

## C. `BeansRoute` の仕様

対象テスト: `test/app/api/beans/route.spec.ts`

### C-1. 不正リクエストは 400

- Given: 必須項目不足の POST リクエスト
- When: `POST` を実行
- Then: `400` を返す

### C-2. 正常系は 201 + 空文字維持

- Given: 正常な POST リクエスト（任意項目は空文字）
- When: `POST` を実行
- Then: `201` を返し、`createBean` に空文字が維持されて渡る

### C-3. 下位層エラーは 500

- Given: `createBean` が例外を投げる
- When: `POST` を実行
- Then: `500` を返す

### C-4. GET は 200

- Given: `getBeans` が配列を返す
- When: `GET` を実行
- Then: `200` を返す

---

## D. `BrewsRoute` の仕様

対象テスト: `test/app/api/brews/route.spec.ts`

### D-1. 不正リクエストは 400

- Given: 必須項目不足の POST リクエスト
- When: `POST` を実行
- Then: `400` を返す

### D-2. 正常系は 201 + notes 空文字維持

- Given: 正常な POST リクエスト（`notes = ''`）
- When: `POST` を実行
- Then: `201` を返し、`createBrew` に `notes: ''` が渡る

### D-3. 下位層エラーは 500

- Given: `createBrew` が例外を投げる
- When: `POST` を実行
- Then: `500` を返す

### D-4. GET（beanId あり）は getBrewsByBeanId を呼ぶ

- Given: `?beanId=bean-1`
- When: `GET` を実行
- Then: `getBrewsByBeanId('bean-1')` が呼ばれる

### D-5. GET（beanId なし）は getBrews を呼ぶ

- Given: クエリなし
- When: `GET` を実行
- Then: `getBrews` が呼ばれる

