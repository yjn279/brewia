# Auth Test Plan — Issue #82 (Slices 1–5)

ブランチ: `feat/82-auth-per-user-data`

---

## 1. Scope

### 対象スライス

| スライス | 内容 |
|---|---|
| Slice 1 | Auth.js 基盤（middleware、requireUser / getAuthenticatedUser ヘルパ、ログインページ） |
| Slice 2 | DB スキーマへの user_id 追加 + signIn callback による backfill ロジック |
| Slice 3 | Repository 層の userId スコープ化（BeansRepository / BrewsRepository） |
| Slice 4 | Service / Route Handler / Server Component への userId 伝搬 + 未認証 401 |
| Slice 5 | 他人リソースへのアクセス 404 化（GET/PUT/DELETE）の整合性確認 |

### スコープ外

- **Slice 6 (NOT NULL 化)**: 別 PR に切り出す。このテスト計画ではスコープ外。テスト除外項目一覧（セクション 5）に記載。
- 実 OAuth フロー / 実メール送信（Resend）
- Drizzle Adapter の実 DB 動作確認
- PWA オフライン時の認証挙動
- マイグレーション SQL ファイルの内容検証

---

## 2. 共通セットアップ

### 2.1 Vitest 環境の選択方針

- **Node.js 環境 (`// @vitest-environment node`)**: Route Handler テスト、Repository テスト、ヘルパユニットテスト。`app/api/**/route.test.ts`、`app/beans/repository.test.ts`、`app/brews/repository.test.ts`、`lib/auth/require-user.test.ts` はすべてファイル先頭に `// @vitest-environment node` を付ける。
- **jsdom 環境（デフォルト）**: Server Component レンダリングテスト（`app/page.render.test.tsx`、`app/login/page.render.test.tsx`）。

### 2.2 Drizzle テスト方針（Repository テストに適用）

**推奨: in-memory libsql (`better-sqlite3` または `@libsql/client` の `:memory:` モード)**

`app/api/brews/route.test.ts` の既存テストは Drizzle の実装を直接呼ばず、Service をモックしている（`vi.mock('@/app/brews/service', ...)`）。Repository テスト（Slice 3）はこれとは逆に、**実際の Drizzle クエリが正しい WHERE 句を生成することを検証する**必要があるため、in-memory DB を使う。

セットアップ方針:
1. `better-sqlite3` の `:memory:` インスタンスを `drizzle(new Database(':memory:'))` で生成。
2. テスト開始時に `CREATE TABLE` を直接 SQL で実行するか、Drizzle の `migrate()` を使用してスキーマを展開。
3. 各テスト（または `beforeEach`）で DB をクリアして独立性を保つ。
4. `lib/db/drizzle.ts` をモックして in-memory DB インスタンスを注入するか、Repository のコンストラクタで DB を受け取れるよう設計する（設計優先）。

`vi.mock('@/lib/db/drizzle', () => ({ db: inMemoryDb }))` パターンで `db` を差し替えるのが最もシンプルで既存スタイルに合う。`vi.hoisted` で DB インスタンスを定義してから `vi.mock` ファクトリ内で参照すること（`createBrewMock` の既存パターンと同様）。

### 2.3 `auth` / `requireUser` / `getAuthenticatedUser` のモック戦略

```
// Slice 1 ヘルパテスト: auth() 自体をモック
vi.mock('@/lib/auth', () => ({
  auth: authMock,
}))

// Slice 4 Route Handler テスト: getAuthenticatedUser をモック
vi.mock('@/lib/auth/require-user', () => ({
  getAuthenticatedUser: getAuthenticatedUserMock,
}))

// Slice 4 Server Component テスト: requireUser をモック
vi.mock('@/lib/auth/require-user', () => ({
  requireUser: requireUserMock,
}))
```

`vi.hoisted` パターンで mock 関数を先に定義し、`vi.mock` ファクトリから参照する（既存 `route.test.ts` の `createBrewMock` パターンを踏襲）。

### 2.4 Next.js Request モックの書き方

既存 `route.test.ts` に倣い、`new Request(url, { method, headers, body })` を直接使う。Next.js の `NextRequest` は使わない（Node.js 標準の `Request` で十分）。

```typescript
function createRequest(method: string, url: string, body?: object) {
  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}
```

### 2.5 `server-only` モック

Repository / Service はすべて `import 'server-only'` を持つ。Node 環境テストで `vi.mock('server-only', () => ({}))` を追加する（既存 `route.test.ts` の extract テストに倣う）。

---

## 3. スライス別テスト計画

---

### Slice 1: Auth.js 基盤

#### 3.1.1 スライスの目的

`middleware.ts` の未認証リダイレクトロジックと、`requireUser()` / `getAuthenticatedUser()` の 2 ヘルパが設計通りに動作することを確認する。ログインページが必要な UI 要素を持つことを render テストで確認する。

#### 3.1.2 テストファイル一覧

| ファイルパス | 新規/変更 |
|---|---|
| `/Users/yuji/Documents/GitHub/brewia-issue-82/middleware.test.ts` | 新規 |
| `/Users/yuji/Documents/GitHub/brewia-issue-82/lib/auth/require-user.test.ts` | 新規 |
| `/Users/yuji/Documents/GitHub/brewia-issue-82/app/login/page.render.test.tsx` | 新規 |

#### 3.1.3 テスト仕様

---

**ファイル: `middleware.test.ts`**

```
// @vitest-environment node
```

前提モック:
```typescript
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(), // middleware の export default が auth(handler) の形なのでラッパをモック
}))
```

注意: `middleware.ts` は `auth((req) => { ... })` の高階関数パターンを使う。テストでは auth の戻り値となる内側ハンドラ関数のロジックをテストするため、ハンドラを直接 export するか、ロジックを純粋関数 `handleMiddlewareRequest(req, isLoggedIn)` に切り出してテストする方式を推奨する（後者の方が auth のモックが不要になる）。

```
describe('middleware request handler', () => {
  describe('公開ルート（認証不要）', () => {
    it('M1: /api/auth/callback/google へのリクエストは isLoggedIn=false でも通過する（undefined を返す）')
    // Arrange: req.nextUrl.pathname = '/api/auth/callback/google', isLoggedIn = false
    // Act: ハンドラを呼び出す
    // Assert: 戻り値が undefined（=通過）であること

    it('M2: /login へのリクエストは isLoggedIn=false でも通過する')
    // Arrange: req.nextUrl.pathname = '/login', isLoggedIn = false
    // Assert: 戻り値が undefined

    it('M3: /offline へのリクエストは isLoggedIn=false でも通過する')
    // Arrange: req.nextUrl.pathname = '/offline', isLoggedIn = false
    // Assert: 戻り値が undefined
  })

  describe('保護ルート + 未認証', () => {
    it('M4: / へのリクエストは isLoggedIn=false のとき /login へリダイレクトする')
    // Arrange: req.nextUrl.pathname = '/', req.url = 'http://localhost/', isLoggedIn = false
    // Act: ハンドラを呼び出す
    // Assert: 戻り値が Response であり、status=302 かつ Location ヘッダが '/login' を含む

    it('M5: /beans/xxx へのリクエストは isLoggedIn=false のとき /login へリダイレクトする')
    // Arrange: req.nextUrl.pathname = '/beans/some-id', isLoggedIn = false
    // Assert: リダイレクトレスポンス

    it('M6: /api/beans へのリクエストは isLoggedIn=false のとき /login へリダイレクトする')
    // Arrange: req.nextUrl.pathname = '/api/beans', isLoggedIn = false
    // Assert: リダイレクトレスポンス
  })

  describe('保護ルート + 認証済み', () => {
    it('M7: / へのリクエストは isLoggedIn=true のとき通過する（undefined を返す）')
    // Arrange: req.nextUrl.pathname = '/', isLoggedIn = true
    // Assert: 戻り値が undefined

    it('M8: /api/beans へのリクエストは isLoggedIn=true のとき通過する')
    // Arrange: req.nextUrl.pathname = '/api/beans', isLoggedIn = true
    // Assert: 戻り値が undefined
  })

  describe('matcher 対象外のパス（パターン確認）', () => {
    it('M9: matcher の正規表現が _next/static を除外することを確認する')
    // Arrange: パス = '/_next/static/chunks/main.js'
    // Assert: matcher の regex にマッチしない（regex を直接 test() する）

    it('M10: matcher の正規表現が sw.js を除外することを確認する')
    // Arrange: パス = '/sw.js'
    // Assert: matcher の regex にマッチしない
  })
})
```

---

**ファイル: `lib/auth/require-user.test.ts`**

```
// @vitest-environment node
```

前提モック:
```typescript
vi.mock('@/lib/auth', () => ({ auth: authMock }))
vi.mock('next/navigation', () => ({ redirect: redirectMock }))
```

```
describe('requireUser()', () => {
  it('RU1: セッションに user.id が存在するとき AuthenticatedUser を返す')
  // Arrange: authMock.mockResolvedValue({ user: { id: 'user-1', email: 'a@example.com', name: 'Alice' } })
  // Act: const user = await requireUser()
  // Assert: user.id === 'user-1', user.email === 'a@example.com', user.name === 'Alice'
  // Assert: redirectMock が呼ばれていない

  it('RU2: セッションが null のとき redirect("/login") を呼び出す')
  // Arrange: authMock.mockResolvedValue(null)
  // Act: await requireUser()
  // Assert: redirectMock が "/login" で呼ばれている

  it('RU3: セッションに user.id がない（user オブジェクトは存在する）とき redirect("/login") を呼び出す')
  // Arrange: authMock.mockResolvedValue({ user: { email: 'a@example.com' } }) // id なし
  // Act: await requireUser()
  // Assert: redirectMock が "/login" で呼ばれている

  it('RU4: user.name が null の場合は name: null を返す')
  // Arrange: authMock.mockResolvedValue({ user: { id: 'user-1', email: 'a@example.com', name: null } })
  // Act: const user = await requireUser()
  // Assert: user.name === null
})

describe('getAuthenticatedUser()', () => {
  it('GAU1: セッションに user.id が存在するとき AuthenticatedUser を返す')
  // Arrange: authMock.mockResolvedValue({ user: { id: 'user-1', email: 'a@example.com', name: 'Alice' } })
  // Act: const user = await getAuthenticatedUser()
  // Assert: user が null でない、user.id === 'user-1'

  it('GAU2: セッションが null のとき null を返す（redirect しない）')
  // Arrange: authMock.mockResolvedValue(null)
  // Act: const user = await getAuthenticatedUser()
  // Assert: user === null
  // Assert: redirectMock が呼ばれていない

  it('GAU3: セッションに user.id がないとき null を返す')
  // Arrange: authMock.mockResolvedValue({ user: { email: 'a@example.com' } })
  // Act: const user = await getAuthenticatedUser()
  // Assert: user === null
})
```

---

**ファイル: `app/login/page.render.test.tsx`**

```
// jsdom 環境（デフォルト）
```

前提モック:
```typescript
vi.mock('@/lib/auth', () => ({ auth: authMock, signIn: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: redirectMock }))
// next/font/google はレイアウトと同様にモック
```

```
describe('LoginPage', () => {
  it('LP1: 未認証状態でレンダリングしたとき Google ログインボタンが存在する')
  // Arrange: authMock.mockResolvedValue(null)
  // Act: render(<LoginPage />)
  // Assert: screen.getByRole('button', { name: /Google/ }) または getByText(/Google/) が存在する

  it('LP2: 未認証状態でレンダリングしたとき Email 入力フィールドが存在する')
  // Arrange: authMock.mockResolvedValue(null)
  // Act: render(<LoginPage />)
  // Assert: screen.getByRole('textbox', { name: /email/i }) または getByPlaceholderText(/email/i) が存在する

  it('LP3: 認証済み状態でレンダリングしたとき redirect("/") が呼ばれる')
  // Arrange: authMock.mockResolvedValue({ user: { id: 'user-1', email: 'a@example.com' } })
  // Act: render(<LoginPage />)  ※ または LoginPage() を直接 await して呼び出す（Server Component のため）
  // Assert: redirectMock が "/" で呼ばれている
})
```

#### 3.1.4 red にするための順序と最小 green

1. まず `lib/auth/require-user.test.ts` の RU1〜RU4、GAU1〜GAU3 を書く（ファイルが存在しないので即 red）。
2. `lib/auth/require-user.ts` を実装して green にする（`auth()` 呼び出しと null ガード + redirect のみ）。
3. `middleware.test.ts` の M1〜M8 を書く（`middleware.ts` が存在しないので red）。
4. `middleware.ts` を実装して green にする。
5. `app/login/page.render.test.tsx` の LP1〜LP2 を書く（`app/login/page.tsx` が存在しないので red）。
6. `app/login/page.tsx` を最小実装（ボタンと input フィールドのみ）して green にする。

#### 3.1.5 受け入れ条件との対応

| 受け入れ条件 | カバーするテスト |
|---|---|
| `/` 未ログイン → `/login` リダイレクト | M4 |
| `/offline`, `/login`, `/api/auth/*` は未認証でアクセス可能 | M1, M2, M3 |
| `requireUser()` 未認証 → redirect | RU2, RU3 |
| `requireUser()` 認証済み → user 返却 | RU1, RU4 |
| `getAuthenticatedUser()` 未認証 → null | GAU2, GAU3 |
| Google ログインボタンが存在 | LP1 |
| Email Magic Link フォームが存在 | LP2 |
| ログイン済みで /login → / へリダイレクト | LP3 |

#### 3.1.6 除外項目

- 実 Google OAuth コールバックフロー（E2E レベル、手動確認）
- 実 Resend メール送信（手動確認）
- Drizzle Adapter による session/user/account テーブルへの書き込み確認（手動確認）
- `lib/auth/config.ts` の providers/adapter 設定内容のテスト（Auth.js 内部実装に依存するため）

---

### Slice 2: DB スキーマ + backfill

#### 3.2.1 スライスの目的

`signIn` callback から切り出した backfill 純粋関数（`performBackfill(userId, db)`）が、`user_id IS NULL` の行を正しく当該ユーザーに割り当て、冪等に動作することを確認する。

#### 3.2.2 テストファイル一覧

| ファイルパス | 新規/変更 |
|---|---|
| `/Users/yuji/Documents/GitHub/brewia-issue-82/lib/auth/backfill.test.ts` | 新規 |

#### 3.2.3 テスト仕様

**ファイル: `lib/auth/backfill.test.ts`**

```
// @vitest-environment node
```

前提: backfill ロジックは `lib/auth/backfill.ts` に `performBackfill(userId: string, db: DrizzleDB): Promise<void>` として切り出す。この関数を `signIn` callback から呼び出す設計にする。

モック戦略: Slice 3 と同様に in-memory DB を使う。`better-sqlite3` + Drizzle の `:memory:` インスタンスで `bean` / `brew` テーブルを作成し、テストデータを直接 INSERT する。

```
describe('performBackfill()', () => {
  describe('正常系: user_id IS NULL の行が存在する', () => {
    it('BF1: bean テーブルに user_id IS NULL の行が 1 件あるとき、その行の user_id が引数の userId に更新される')
    // Arrange: db に bean 行 { id: 'bean-1', user_id: null } を INSERT
    // Act: await performBackfill('user-1', db)
    // Assert: SELECT user_id FROM bean WHERE id = 'bean-1' の結果が 'user-1'

    it('BF2: brew テーブルに user_id IS NULL の行が 1 件あるとき、その行の user_id が引数の userId に更新される')
    // Arrange: db に bean と brew 行を INSERT（brew.user_id = null）
    // Act: await performBackfill('user-1', db)
    // Assert: SELECT user_id FROM brew WHERE id = 'brew-1' の結果が 'user-1'

    it('BF3: bean と brew の両方に NULL 行が複数あるとき、すべての行が userId に更新される')
    // Arrange: bean 2件・brew 3件を user_id = null で INSERT
    // Act: await performBackfill('user-1', db)
    // Assert: SELECT COUNT(*) FROM bean WHERE user_id IS NULL が 0
    // Assert: SELECT COUNT(*) FROM brew WHERE user_id IS NULL が 0
  })

  describe('冪等性', () => {
    it('BF4: 同じ userId で 2 回 performBackfill を実行しても結果が変わらない')
    // Arrange: bean 行 { id: 'bean-1', user_id: null } を INSERT
    // Act: await performBackfill('user-1', db) を 2 回実行
    // Assert: SELECT user_id FROM bean WHERE id = 'bean-1' が 'user-1'（2回目で別値に変わらない）
    // Assert: SELECT COUNT(*) FROM bean WHERE user_id IS NULL が 0

    it('BF5: すでに user_id が設定されている行は上書きされない')
    // Arrange: bean 行 { id: 'bean-existing', user_id: 'original-user' } を INSERT
    // Act: await performBackfill('new-user', db)
    // Assert: SELECT user_id FROM bean WHERE id = 'bean-existing' が依然 'original-user'
  })

  describe('0 件ケース', () => {
    it('BF6: user_id IS NULL の行が 0 件のとき エラーにならず正常終了する')
    // Arrange: bean と brew に user_id が設定済みの行のみ存在（または空テーブル）
    // Act: await performBackfill('user-1', db)
    // Assert: エラーがスローされない、テーブルの行数が変わらない
  })
})
```

#### 3.2.4 red にするための順序と最小 green

1. `lib/auth/backfill.test.ts` の BF1 を書く（`lib/auth/backfill.ts` が存在しないので red）。
2. `performBackfill` を実装して BF1 を green にする。
3. BF2〜BF6 を追加してすべて green にする。

#### 3.2.5 受け入れ条件との対応

| 受け入れ条件 | カバーするテスト |
|---|---|
| 1人目サインイン → NULL 行が全てそのユーザーに割り当てられる | BF1, BF2, BF3 |
| 2人目以降は NULL 行がないため backfill が何もしない（冪等） | BF4, BF6 |
| user_id 設定済み行は上書きされない | BF5 |

#### 3.2.6 除外項目

- `lib/db/schema.ts` への `userId` カラム追加の検証（型チェック + マイグレーション生成で確認）
- `drizzle/0002_add_user_id_nullable.sql` の SQL 内容テスト（マイグレーション生成は手動確認）
- `signIn` callback との統合（Auth.js の callback 内呼び出し）は手動確認

---

### Slice 3: Repository 層の userId スコープ化

#### 3.3.1 スライスの目的

`BeansRepository` および `BrewsRepository` のすべてのメソッドが `userId` を必須引数として受け取り、クエリに `WHERE user_id = userId` を適用することをテストで確認する。他ユーザーの行がクエリ結果に含まれないことを構造的に保証する。

#### 3.3.2 テストファイル一覧

| ファイルパス | 新規/変更 |
|---|---|
| `/Users/yuji/Documents/GitHub/brewia-issue-82/app/beans/repository.test.ts` | 新規 |
| `/Users/yuji/Documents/GitHub/brewia-issue-82/app/brews/repository.test.ts` | 新規 |

#### 3.3.3 テスト仕様

**ファイル: `app/beans/repository.test.ts`**

```
// @vitest-environment node
```

モック戦略: in-memory DB を使用。`vi.hoisted` で `better-sqlite3` の `:memory:` DB インスタンスを生成し、`vi.mock('@/lib/db/drizzle', () => ({ db: inMemoryDb }))` で注入する。`vi.mock('server-only', () => ({}))` も必要。

テストデータ設定（`beforeEach`）:
- `user-A`, `user-B` の 2 ユーザー分の bean 行を INSERT
- `bean-A1`: userId = 'user-A'
- `bean-A2`: userId = 'user-A'
- `bean-B1`: userId = 'user-B'

```
describe('BeansRepository', () => {
  describe('findAll(userId)', () => {
    it('BR_FA1: userId="user-A" のとき user-A の bean のみ返す（user-B の bean は含まれない）')
    // Arrange: beforeEach のテストデータ
    // Act: const beans = await repository.findAll('user-A')
    // Assert: beans.length === 2
    // Assert: beans.every(b => b.userId === 'user-A') === true
    // Assert: beans.find(b => b.id === 'bean-B1') が undefined

    it('BR_FA2: 該当ユーザーの bean が 0 件のとき空配列を返す')
    // Arrange: 'user-C' の bean は存在しない
    // Act: const beans = await repository.findAll('user-C')
    // Assert: beans.length === 0
  })

  describe('findById(userId, id)', () => {
    it('BR_FI1: 正しい userId + 存在する id のとき Bean を返す')
    // Arrange: beforeEach のテストデータ
    // Act: const bean = await repository.findById('user-A', 'bean-A1')
    // Assert: bean が undefined でない、bean.id === 'bean-A1'

    it('BR_FI2: 誤った userId（他ユーザーの bean id）のとき undefined を返す')
    // Arrange: beforeEach のテストデータ
    // Act: const bean = await repository.findById('user-A', 'bean-B1')
    // Assert: bean === undefined

    it('BR_FI3: 存在しない id のとき undefined を返す')
    // Arrange: beforeEach のテストデータ
    // Act: const bean = await repository.findById('user-A', 'nonexistent-id')
    // Assert: bean === undefined
  })

  describe('create(userId, input)', () => {
    it('BR_CR1: create を呼び出すと DB 行に userId が設定される')
    // Arrange: validBeanInput = { name: 'Ethiopia Yirgacheffe', ... }
    // Act: const bean = await repository.create('user-A', validBeanInput)
    // Assert: bean.userId === 'user-A' (または DB を直接 SELECT して user_id = 'user-A' を確認)
  })

  describe('update(userId, id, input)', () => {
    it('BR_UP1: 正しい userId のとき Bean を更新して返す')
    // Arrange: beforeEach のテストデータ
    // Act: const bean = await repository.update('user-A', 'bean-A1', updatedInput)
    // Assert: bean が undefined でない

    it('BR_UP2: 他ユーザーの bean id を指定したとき undefined を返す（行が変更されない）')
    // Arrange: beforeEach のテストデータ
    // Act: const bean = await repository.update('user-A', 'bean-B1', updatedInput)
    // Assert: bean === undefined
    // Assert: DB で bean-B1 の内容が変わっていないこと（再 SELECT して確認）
  })

  describe('delete(userId, id)', () => {
    it('BR_DE1: 正しい userId のとき true を返し行が削除される')
    // Arrange: beforeEach のテストデータ
    // Act: const result = await repository.delete('user-A', 'bean-A1')
    // Assert: result === true
    // Assert: DB で bean-A1 が存在しないこと

    it('BR_DE2: 他ユーザーの bean id を指定したとき false を返す（行が削除されない）')
    // Arrange: beforeEach のテストデータ
    // Act: const result = await repository.delete('user-A', 'bean-B1')
    // Assert: result === false
    // Assert: DB で bean-B1 が依然存在すること
  })
})
```

---

**ファイル: `app/brews/repository.test.ts`**

```
// @vitest-environment node
```

テストデータ設定（`beforeEach`）:
- `bean-A1` (userId = 'user-A'), `bean-B1` (userId = 'user-B') を bean テーブルに INSERT
- `brew-A1` (userId = 'user-A', beanId = 'bean-A1')
- `brew-A2` (userId = 'user-A', beanId = 'bean-A1')
- `brew-B1` (userId = 'user-B', beanId = 'bean-B1')

```
describe('BrewsRepository', () => {
  describe('findAll(userId)', () => {
    it('BRW_FA1: userId="user-A" のとき user-A の brew のみ返す')
    // Act: const brews = await repository.findAll('user-A')
    // Assert: brews.length === 2
    // Assert: brews.find(b => b.id === 'brew-B1') が undefined

    it('BRW_FA2: 該当ユーザーの brew が 0 件のとき空配列を返す')
    // Act: const brews = await repository.findAll('user-C')
    // Assert: brews.length === 0
  })

  describe('findByBeanId(userId, beanId)', () => {
    it('BRW_FB1: 自分の bean の beanId を渡したとき、その bean に紐づく自分の brew を返す')
    // Act: const brews = await repository.findByBeanId('user-A', 'bean-A1')
    // Assert: brews.length === 2

    it('BRW_FB2: 他ユーザーの bean の beanId を渡したとき空配列を返す（bean が見つからないため）')
    // Act: const brews = await repository.findByBeanId('user-A', 'bean-B1')
    // Assert: brews.length === 0
    // （内部で beansRepository.findById(userId, beanId) を呼び、beam が undefined なら空配列）
  })

  describe('findById(userId, id)', () => {
    it('BRW_FI1: 正しい userId + 存在する brew id のとき BrewWithBean を返す')
    // Act: const brew = await repository.findById('user-A', 'brew-A1')
    // Assert: brew が undefined でない、brew.id === 'brew-A1'

    it('BRW_FI2: 他ユーザーの brew id を渡したとき undefined を返す')
    // Act: const brew = await repository.findById('user-A', 'brew-B1')
    // Assert: brew === undefined
  })

  describe('findCountByBeanIdMap(userId)', () => {
    it('BRW_FC1: userId="user-A" のとき user-A の bean に紐づく brew 数のみ集計する')
    // Act: const map = await repository.findCountByBeanIdMap('user-A')
    // Assert: map.get('bean-A1') === 2
    // Assert: map.has('bean-B1') === false
  })

  describe('create(userId, input)', () => {
    it('BRW_CR1: create を呼び出すと DB 行に userId が設定される')
    // Act: const brew = await repository.create('user-A', validBrewInput)
    // Assert: DB で brew の user_id = 'user-A' を確認
  })

  describe('update(userId, id, input)', () => {
    it('BRW_UP1: 他ユーザーの brew id を指定したとき undefined を返す')
    // Act: const brew = await repository.update('user-A', 'brew-B1', updatedInput)
    // Assert: brew === undefined
  })

  describe('delete(userId, id)', () => {
    it('BRW_DE1: 他ユーザーの brew id を指定したとき false を返す（行が削除されない）')
    // Act: const result = await repository.delete('user-A', 'brew-B1')
    // Assert: result === false
    // Assert: DB で brew-B1 が依然存在すること
  })
})
```

#### 3.3.4 red にするための順序と最小 green

1. `app/beans/repository.test.ts` の BR_FI2（他ユーザーの id → undefined）から書き始める。これが最も端的に「userId フィルタなし → red、フィルタあり → green」を示す。
2. `BeansRepository.findById(userId, id)` に `AND user_id = userId` を追加して green にする。
3. BR_FA1、BR_UP2、BR_DE2 の順に追加する（どれも「他ユーザーのデータが返らない」を検証）。
4. BrewsRepository も同様の順序で BRW_FI2 → BRW_FA1 → BRW_FB2 の順に進める。

#### 3.3.5 受け入れ条件との対応

| 受け入れ条件 | カバーするテスト |
|---|---|
| findAll に userId を渡すと自分のデータのみ返る | BR_FA1, BR_FA2, BRW_FA1 |
| findById に誤った userId → undefined | BR_FI2, BRW_FI2 |
| findById に正しい userId → Bean/Brew を返す | BR_FI1, BRW_FI1 |
| create に userId を渡すと DB 行に user_id が入る | BR_CR1, BRW_CR1 |
| update 他ユーザー行は更新不可 | BR_UP2, BRW_UP1 |
| delete 他ユーザー行は削除されない | BR_DE2, BRW_DE1 |
| findByBeanId 他ユーザーの bean → 空配列 | BRW_FB2 |

#### 3.3.6 除外項目

- Repository の TypeScript コンパイルエラー（型変更による呼び出し元のエラー）は tsc で確認、テストは不要
- Drizzle の OR/AND クエリ生成の SQL テキスト検証（実行結果で代替）
- `findCountByBeanIdMap` の 0 件時動作（BRW_FC1 で間接的にカバー）

---

### Slice 4: Service / Route Handler / Server Component への波及

#### 3.4.1 スライスの目的

全 Route Handler が `getAuthenticatedUser()` を呼び、未認証時に 401 を返すこと、認証済み時に userId を Service に渡すことを確認する。Server Component (`app/page.tsx`) が `requireUser()` を呼ぶことを確認する。

#### 3.4.2 テストファイル一覧

| ファイルパス | 新規/変更 |
|---|---|
| `/Users/yuji/Documents/GitHub/brewia-issue-82/app/api/beans/route.test.ts` | 新規 |
| `/Users/yuji/Documents/GitHub/brewia-issue-82/app/api/beans/[id]/route.test.ts` | 新規 |
| `/Users/yuji/Documents/GitHub/brewia-issue-82/app/api/brews/route.test.ts` | 変更（既存） |
| `/Users/yuji/Documents/GitHub/brewia-issue-82/app/api/flavors/route.test.ts` | 新規 |
| `/Users/yuji/Documents/GitHub/brewia-issue-82/app/api/beans/extract/route.test.ts` | 変更（既存） |
| `/Users/yuji/Documents/GitHub/brewia-issue-82/app/page.render.test.tsx` | 新規 |

#### 3.4.3 テスト仕様

---

**ファイル: `app/api/beans/route.test.ts`（新規）**

```
// @vitest-environment node
```

モック設定:
```typescript
const { getAuthenticatedUserMock, getBeansMock, createBeanMock } = vi.hoisted(() => ({
  getAuthenticatedUserMock: vi.fn(),
  getBeansMock: vi.fn(),
  createBeanMock: vi.fn(),
}))

vi.mock('@/lib/auth/require-user', () => ({
  getAuthenticatedUser: getAuthenticatedUserMock,
}))

vi.mock('@/app/beans/service', () => ({
  beansService: {
    getBeans: getBeansMock,
    createBean: createBeanMock,
  },
}))
```

```
describe('GET /api/beans', () => {
  it('BGET1: 認証なしのとき 401 を返す')
  // Arrange: getAuthenticatedUserMock.mockResolvedValue(null)
  // Act: const response = await GET(createRequest('GET', 'http://localhost/api/beans'))
  // Assert: response.status === 401
  // Assert: getBeansMock が呼ばれていない

  it('BGET2: 認証済みのとき beansService.getBeans(userId) を呼び出し 200 を返す')
  // Arrange: getAuthenticatedUserMock.mockResolvedValue({ id: 'user-1', email: 'a@example.com', name: 'Alice' })
  //         getBeansMock.mockResolvedValue([{ id: 'bean-1', name: 'Ethiopia' }])
  // Act: const response = await GET(createRequest('GET', 'http://localhost/api/beans'))
  // Assert: response.status === 200
  // Assert: getBeansMock が 'user-1' で呼ばれている（expect(getBeansMock).toHaveBeenCalledWith('user-1')）
})

describe('POST /api/beans', () => {
  it('BPOST1: 認証なしのとき 401 を返す')
  // Arrange: getAuthenticatedUserMock.mockResolvedValue(null)
  // Act: POST(createRequest('POST', ..., validBeanBody))
  // Assert: response.status === 401
  // Assert: createBeanMock が呼ばれていない

  it('BPOST2: 認証済み + 有効なボディのとき beansService.createBean(userId, dto) を呼び出し 201 を返す')
  // Arrange: getAuthenticatedUserMock.mockResolvedValue({ id: 'user-1', ... })
  //         createBeanMock.mockResolvedValue({ id: 'bean-new' })
  // Act: POST(createRequest('POST', ..., validBeanBody))
  // Assert: response.status === 201
  // Assert: createBeanMock が ('user-1', expect.objectContaining({ name: ... })) で呼ばれている

  it('BPOST3: 認証済み + 無効なボディのとき 400 を返す（認証チェックより先にバリデーション or 後でも可）')
  // Arrange: getAuthenticatedUserMock.mockResolvedValue({ id: 'user-1', ... })
  // Act: POST with body = {}
  // Assert: response.status === 400
})
```

---

**ファイル: `app/api/beans/[id]/route.test.ts`（新規）**

```
// @vitest-environment node
```

同様のモック設定 (`getAuthenticatedUser`, `beansService.getBeanById`, `updateBean`, `deleteBean`)。

```
describe('GET /api/beans/[id]', () => {
  it('BID_GET1: 認証なしのとき 401 を返す')
  it('BID_GET2: 認証済み + 存在する自分の id のとき 200 を返す')
  // Assert: getBeanByIdMock が ('user-1', 'bean-1') で呼ばれている
})

describe('PUT /api/beans/[id]', () => {
  it('BID_PUT1: 認証なしのとき 401 を返す')
  it('BID_PUT2: 認証済み + 有効なボディのとき updateBeanMock が (userId, id, dto) で呼ばれ 200 を返す')
})

describe('DELETE /api/beans/[id]', () => {
  it('BID_DEL1: 認証なしのとき 401 を返す')
  it('BID_DEL2: 認証済みのとき deleteBeanMock が (userId, id) で呼ばれ 204 を返す')
})
```

---

**ファイル: `app/api/brews/route.test.ts`（既存変更）**

既存の `describe('POST /api/brews', ...)` の直前に以下を追加する。既存テストは変更せず、auth 関連のテストを新たな `describe` ブロックとして追記する。

追加するモック（既存 `createBrewMock` の vi.hoisted に `getAuthenticatedUserMock` を追加）:
```typescript
const { createBrewMock, getAuthenticatedUserMock } = vi.hoisted(() => ({
  createBrewMock: vi.fn(),
  getAuthenticatedUserMock: vi.fn(),
}))
vi.mock('@/lib/auth/require-user', () => ({
  getAuthenticatedUser: getAuthenticatedUserMock,
}))
```

```
describe('POST /api/brews — 認証', () => {
  it('BREW_AUTH1: 認証なしのとき 401 を返す')
  // Arrange: getAuthenticatedUserMock.mockResolvedValue(null)
  // Assert: response.status === 401
  // Assert: createBrewMock が呼ばれていない

  it('BREW_AUTH2: 認証済みのとき createBrewMock が userId を第 1 引数として呼ばれる')
  // Arrange: getAuthenticatedUserMock.mockResolvedValue({ id: 'user-1', ... })
  //         createBrewMock.mockResolvedValue({ id: 'brew-new' })
  // Assert: createBrewMock が ('user-1', expect.objectContaining({ beanId: 'bean-1' })) で呼ばれている
})
```

---

**ファイル: `app/api/flavors/route.test.ts`（新規）**

```
// @vitest-environment node
```

```
describe('GET /api/flavors', () => {
  it('FL1: 認証なしのとき 401 を返す')
  // Arrange: getAuthenticatedUserMock.mockResolvedValue(null)
  // Assert: response.status === 401
  // Assert: getFlavorsService が呼ばれていない

  it('FL2: 認証済みのとき getFlavors() を呼び出し 200 を返す（userId フィルタなし）')
  // Arrange: getAuthenticatedUserMock.mockResolvedValue({ id: 'user-1', ... })
  //         getFlavorsServiceMock.mockResolvedValue([{ id: 'flavor-1' }])
  // Assert: response.status === 200
  // Assert: getFlavorsServiceMock が userId なしで呼ばれている
  // （flavor は shared master なので userId を渡さない）
})
```

---

**ファイル: `app/api/beans/extract/route.test.ts`（既存変更）**

既存テストを壊さずに以下を追加:

```
describe('POST /api/beans/extract — 認証', () => {
  it('EXT_AUTH1: 認証なしのとき 401 を返す（ファイルが添付されていても）')
  // Arrange: getAuthenticatedUserMock.mockResolvedValue(null)
  //         有効な JPEG ファイルを含む FormData を作成
  // Assert: response.status === 401
  // Assert: extractFromImageMock が呼ばれていない
})
```

---

**ファイル: `app/page.render.test.tsx`（新規）**

```
// jsdom 環境（デフォルト）
```

モック設定:
```typescript
vi.mock('@/lib/auth/require-user', () => ({
  requireUser: requireUserMock,
}))
vi.mock('@/app/beans/service', () => ({ beansService: { getBeans: getBeansMock } }))
vi.mock('@/app/brews/service', () => ({ brewsService: { getBrews: getBrewsMock } }))
// next/font/google, globals.css 等は layout.render.test.tsx と同様にモック
```

```
describe('HomePage (Server Component)', () => {
  it('HP1: requireUser が呼ばれる')
  // Arrange: requireUserMock.mockResolvedValue({ id: 'user-1', ... })
  //         getBeansMock.mockResolvedValue([])
  //         getBrewsMock.mockResolvedValue([])
  // Act: await HomePage() の結果を render する（または直接 await して副作用を確認）
  // Assert: requireUserMock が呼ばれた回数 === 1

  it('HP2: 未認証のとき requireUser が redirect を発動し、ページ本体がレンダリングされない')
  // Arrange: requireUserMock.mockImplementation(() => { throw new Error('NEXT_REDIRECT') })
  //         ※ Next.js の redirect() は NEXT_REDIRECT エラーを throw する
  // Act: try { await HomePage() } catch {}
  // Assert: getBeansMock が呼ばれていない（ページが redirect で中断されたため）

  it('HP3: 認証済みのとき beansService.getBeans(userId) が正しい userId で呼ばれる')
  // Arrange: requireUserMock.mockResolvedValue({ id: 'user-1', ... })
  //         getBeansMock.mockResolvedValue([])
  //         getBrewsMock.mockResolvedValue([])
  // Assert: getBeansMock が 'user-1' で呼ばれている
})
```

#### 3.4.4 red にするための順序と最小 green

1. `app/api/beans/route.test.ts` の BGET1（認証なし → 401）から書き始める（最短 red）。
2. `GET /api/beans` に `getAuthenticatedUser()` を追加し、null の場合は 401 を返して green にする。
3. BGET2（userId が service に渡る）を追加。service シグネチャ変更を伴うため少し大きい。
4. 他の Route Handler（beans/[id]、brews、flavors、extract）の AUTH テストを追加しながら同様に進める。
5. 最後に `app/page.render.test.tsx` を追加（Server Component のモックが最も複雑なため後回し）。

#### 3.4.5 受け入れ条件との対応

| 受け入れ条件 | カバーするテスト |
|---|---|
| 未認証リクエストに 401 が返る | BGET1, BPOST1, BID_GET1, BID_PUT1, BID_DEL1, BREW_AUTH1, FL1, EXT_AUTH1 |
| ログイン済みで GET /api/beans → 自分の bean のみ返る | BGET2（service に userId を渡すことを確認） |
| flavors は認証必須だが userId フィルタ不要 | FL1, FL2 |
| ホームページで requireUser() が呼ばれる | HP1, HP2 |
| service に正しい userId が渡る | BGET2, BPOST2, BREW_AUTH2, HP3 |

#### 3.4.6 除外項目

- Service レイヤのユニットテスト（Service は Repository のパススルーであるため、Repository テストで担保）
- `app/beans/[id]/page.tsx` 等の他 Server Component の render テスト（パターンが HP1〜HP3 と同一のため省略可。必要に応じて追加）
- TypeScript のコンパイルエラー確認（tsc で確認、テストは不要）

---

### Slice 5: 他人リソース 404 化

#### 3.5.1 スライスの目的

認証済みユーザーが他ユーザーの bean/brew id を指定した場合に、Route Handler が 404 を返すことを確認する。Slice 3（Repository が undefined を返す）+ Slice 4（Route Handler が 404 に変換する）の統合確認。

#### 3.5.2 テストファイル一覧

| ファイルパス | 新規/変更 |
|---|---|
| `/Users/yuji/Documents/GitHub/brewia-issue-82/app/api/beans/[id]/route.test.ts` | 変更（Slice 4 で新規作成済み） |
| `/Users/yuji/Documents/GitHub/brewia-issue-82/app/api/brews/[id]/route.test.ts` | 新規 |

#### 3.5.3 テスト仕様

**ファイル: `app/api/beans/[id]/route.test.ts`（Slice 4 のファイルに追加）**

追加セットアップ: Service の `getBeanByIdMock`, `updateBeanMock`, `deleteBeanMock` が `undefined` / `false` を返すケースを追加。

```
describe('GET /api/beans/[id] — 他人リソース 404', () => {
  it('B404_GET1: 認証済みだが他ユーザーの bean id を指定したとき 404 を返す')
  // Arrange: getAuthenticatedUserMock.mockResolvedValue({ id: 'user-A', ... })
  //         getBeanByIdMock.mockResolvedValue(undefined) // Repository が undefined を返す
  // Act: GET request with params.id = 'bean-B1'
  // Assert: response.status === 404
  // Assert: getBeanByIdMock が ('user-A', 'bean-B1') で呼ばれている（403 でなく 404 を確認）
})

describe('PUT /api/beans/[id] — 他人リソース 404', () => {
  it('B404_PUT1: 認証済みだが他ユーザーの bean id を指定したとき 404 を返す')
  // Arrange: getAuthenticatedUserMock.mockResolvedValue({ id: 'user-A', ... })
  //         updateBeanMock.mockResolvedValue(undefined) // Repository が undefined を返す（user_id 不一致）
  // Act: PUT request with params.id = 'bean-B1' + valid body
  // Assert: response.status === 404
})

describe('DELETE /api/beans/[id] — 他人リソース 404', () => {
  it('B404_DEL1: 認証済みだが他ユーザーの bean id を指定したとき 404 を返す')
  // Arrange: getAuthenticatedUserMock.mockResolvedValue({ id: 'user-A', ... })
  //         deleteBeanMock.mockResolvedValue(false) // Repository が false を返す（user_id 不一致）
  // Act: DELETE request with params.id = 'bean-B1'
  // Assert: response.status === 404
})
```

---

**ファイル: `app/api/brews/[id]/route.test.ts`（新規）**

```
// @vitest-environment node
```

モック設定（`getAuthenticatedUser`, `brewsService.getBrewById`, `updateBrew`, `deleteBrew`）。

```
describe('GET /api/brews/[id]', () => {
  it('BRW404_GET1: 認証なしのとき 401 を返す')
  // Arrange: getAuthenticatedUserMock.mockResolvedValue(null)
  // Assert: response.status === 401

  it('BRW404_GET2: 認証済み + 他ユーザーの brew id のとき 404 を返す')
  // Arrange: getAuthenticatedUserMock.mockResolvedValue({ id: 'user-A', ... })
  //         getBrewByIdMock.mockResolvedValue(undefined)
  // Assert: response.status === 404
})

describe('PUT /api/brews/[id]', () => {
  it('BRW404_PUT1: 認証なしのとき 401 を返す')
  it('BRW404_PUT2: 認証済み + 他ユーザーの brew id のとき 404 を返す')
  // Arrange: updateBrewMock.mockResolvedValue(undefined)
  // Assert: response.status === 404
})

describe('DELETE /api/brews/[id]', () => {
  it('BRW404_DEL1: 認証なしのとき 401 を返す')
  it('BRW404_DEL2: 認証済み + 他ユーザーの brew id のとき 404 を返す')
  // Arrange: deleteBrewMock.mockResolvedValue(false)
  // Assert: response.status === 404
})
```

#### 3.5.4 red にするための順序と最小 green

1. B404_GET1 から書き始める（`GET /api/beans/[id]` が現状 Service に userId を渡していないため即 red）。
2. Route Handler が `getAuthenticatedUser()` を呼び、`getBeanById(userId, id)` を呼ぶよう変更して green にする。
3. B404_PUT1、B404_DEL1 の順に進める。
4. brews/[id] も同様の順序。

#### 3.5.5 受け入れ条件との対応

| 受け入れ条件 | カバーするテスト |
|---|---|
| GET /api/beans/:id 他人の id → 404 | B404_GET1 |
| PUT /api/beans/:id 他人の id → 404 | B404_PUT1 |
| DELETE /api/beans/:id 他人の id → 404（cascade 削除されない） | B404_DEL1 |
| GET/PUT/DELETE /api/brews/:id 他人の id → 404 | BRW404_GET2, BRW404_PUT2, BRW404_DEL2 |

#### 3.5.6 除外項目

- 実 DB を使った cascade 削除の非実行確認（Repository テスト BR_DE2 で代替）
- 403 が返っていないことの明示的な確認（ステータスコードが 404 であることで十分）

---

## 4. 受け入れ条件とテストのトレーサビリティ表

| スライス | 受け入れ条件 | テスト ID |
|---|---|---|
| S1 | 未ログインで `/` → `/login` リダイレクト | M4 |
| S1 | `/login`, `/api/auth/*`, `/offline` は未認証アクセス可 | M1, M2, M3 |
| S1 | `requireUser()` セッションあり → user 返却 | RU1, RU4 |
| S1 | `requireUser()` セッションなし → redirect('/login') | RU2, RU3 |
| S1 | `getAuthenticatedUser()` セッションなし → null | GAU2, GAU3 |
| S1 | ログインページに Google ボタンが存在 | LP1 |
| S1 | ログインページに Email フォームが存在 | LP2 |
| S1 | ログイン済みで `/login` → `/` リダイレクト | LP3 |
| S2 | 1人目サインイン → NULL 行がそのユーザーに割り当てられる | BF1, BF2, BF3 |
| S2 | 2回実行しても結果が変わらない（冪等） | BF4 |
| S2 | user_id 設定済み行は上書きされない | BF5 |
| S2 | NULL 行 0 件でもエラーにならない | BF6 |
| S3 | findAll(userId) → 自分のデータのみ | BR_FA1, BRW_FA1 |
| S3 | findById 正しい userId → Bean/Brew 返却 | BR_FI1, BRW_FI1 |
| S3 | findById 誤った userId → undefined | BR_FI2, BRW_FI2 |
| S3 | create で DB 行に userId が設定される | BR_CR1, BRW_CR1 |
| S3 | update 他ユーザー行は更新不可 | BR_UP2, BRW_UP1 |
| S3 | delete 他ユーザー行は削除不可 | BR_DE2, BRW_DE1 |
| S3 | findByBeanId 他ユーザーの beanId → 空配列 | BRW_FB2 |
| S4 | 未認証リクエスト → 401 (beans GET) | BGET1 |
| S4 | 未認証リクエスト → 401 (beans POST) | BPOST1 |
| S4 | 未認証リクエスト → 401 (beans/[id] GET/PUT/DELETE) | BID_GET1, BID_PUT1, BID_DEL1 |
| S4 | 未認証リクエスト → 401 (brews POST) | BREW_AUTH1 |
| S4 | 未認証リクエスト → 401 (flavors GET) | FL1 |
| S4 | 未認証リクエスト → 401 (extract POST) | EXT_AUTH1 |
| S4 | 認証済み GET /api/beans → service に userId 渡る | BGET2 |
| S4 | 認証済み POST /api/brews → service に userId 渡る | BREW_AUTH2 |
| S4 | flavors は全件返す（userId フィルタなし） | FL2 |
| S4 | ホームページで requireUser() が呼ばれる | HP1 |
| S4 | 未認証で HomePage → redirect が発動 | HP2 |
| S4 | 認証済みで HomePage → service に userId 渡る | HP3 |
| S5 | GET /api/beans/:id 他人 id → 404 | B404_GET1 |
| S5 | PUT /api/beans/:id 他人 id → 404 | B404_PUT1 |
| S5 | DELETE /api/beans/:id 他人 id → 404 | B404_DEL1 |
| S5 | GET/PUT/DELETE /api/brews/:id 他人 id → 404 | BRW404_GET2, BRW404_PUT2, BRW404_DEL2 |

---

## 5. テスト除外項目一覧

| 除外項目 | 理由 | 確認方法 |
|---|---|---|
| 実 Google OAuth フロー | 外部サービス依存・E2E レベル | 手動確認（Vercel プレビュー環境） |
| 実 Resend メール送信 | 外部サービス依存 | 手動確認（実メール受信） |
| Drizzle Adapter の session/user/account 書き込み | Auth.js 内部実装に依存 | 手動確認（DB 直接 SELECT） |
| `lib/auth/config.ts` の providers/adapter 設定 | Auth.js v5 beta の API に依存 | 手動確認 + 型チェック |
| マイグレーション SQL ファイルの内容検証 | SQL テスト環境が未整備 | 手動実行 + `SELECT COUNT(*)` 確認 |
| PWA オフライン時の認証挙動 | Service Worker + ネットワーク状態依存 | 手動確認（Chrome DevTools offline モード） |
| Server Component の完全レンダリングツリー | Next.js の RSC ランタイムが必要 | vitest では副作用（requireUser 呼び出し）のみ確認 |
| `app/beans/[id]/page.tsx` 等の他 Server Component | HP1〜HP3 と同一パターンのため省略 | 必要に応じて追加、型チェックで補完 |
| Slice 6 (NOT NULL 化) | 別 PR でスコープ外 | 別テスト計画で対応 |
| TypeScript コンパイルエラー（シグネチャ変更の波及） | tsc で確認 | `pnpm tsc --noEmit` |
| `findCountByBeanIdMap` の userId なし動作（現行） | Slice 3 で変更前の動作 | 変更後 BRW_FC1 でカバー |

---

## 6. code-writer が詰まる可能性が高いモック複雑箇所への注意点

### 6.1 `middleware.ts` のテスト

`middleware.ts` は `auth(handler)` の高階関数パターンを使う。`auth` 自体が `@/lib/auth` からエクスポートされるため、`vi.mock('@/lib/auth', ...)` をモジュールレベルで定義する必要がある。テストの書き方として以下の 2 択を推奨する。

**推奨 A（ハンドラを分離して純粋関数テスト）**: middleware 内のロジックを `export function handleMiddlewareRequest(pathname: string, url: string, isLoggedIn: boolean): Response | undefined` として切り出す。この場合 `auth` のモックが不要になり最もシンプル。

**推奨 B（auth のモック）**: `vi.hoisted` で `authCallbackCapturer` を定義し、`auth` がコールバックを受け取ってそのまま呼び出すように偽装する。複雑なため推奨 A を優先すること。

### 6.2 in-memory DB のセットアップ（Repository テスト）

`lib/db/drizzle.ts` は `import 'server-only'` を含む可能性がある。`vi.mock('server-only', () => ({}))` を必ず追加すること。また、`vi.mock('@/lib/db/drizzle', ...)` のファクトリ内でインスタンスを生成しようとすると hoisting の問題が起きる。`vi.hoisted` で `const testDb = drizzle(new Database(':memory:'))` を生成してからファクトリ内で参照すること。

スキーマの展開については、`drizzle-kit` の `migrate()` を使うか、`CREATE TABLE` SQL を直接実行するかを選択する。後者の方が `drizzle.config.ts` への依存がなく、テスト環境での実行が安定する。

### 6.3 Server Component テスト（`app/page.render.test.tsx`）

Next.js の Server Component を Vitest の jsdom 環境でテストする場合、`async` コンポーネントを直接 `await ComponentFunction()` で呼び出すか、`render()` に渡すかを選択する。`redirect()` が `NEXT_REDIRECT` エラーを throw するため、HP2 のテストでは `try/catch` でエラーをキャッチしつつ、service モックが呼ばれていないことを確認する。

`app/layout.render.test.tsx` の既存パターン（`vi.mock('next/font/google', ...)`, `vi.mock('./globals.css', ...)` 等）を参考に、Server Component のレンダリングに必要なモックを揃えること。

### 6.4 `vi.mock` のホイスティングと `@/lib/auth/require-user` の共有

Slice 4 の複数テストファイルが同一モジュール `@/lib/auth/require-user` をモックする。各テストファイルは独立した Vitest worker で動作するため問題ないが、同一ファイル内で `requireUser` と `getAuthenticatedUser` の両方をモックする場合は両方を `vi.mock` ファクトリに含めること。

### 6.5 `app/api/brews/route.test.ts` の既存テストへの影響

既存テストは Service をモックしているが、`getAuthenticatedUser` のモックは追加されていない。新しいモック追加後、既存テスト（BPOST 系）が auth のデフォルト戻り値（undefined = 未認証）で 401 を返すようになる可能性がある。既存テストの `beforeEach` に `getAuthenticatedUserMock.mockResolvedValue({ id: 'user-1', ... })` を追加するか、`beforeEach` で認証済み状態をデフォルトにすること。

### 6.6 `app/api/brews/[id]/route.test.ts` の `params` Promise

既存の `app/api/beans/[id]/route.ts` は `params: Promise<{ id: string }>` を受け取る App Router 形式。テストではハンドラを直接呼び出す際に `params: Promise.resolve({ id: 'some-id' })` を渡すこと（既存 `app/api/beans/[id]/route.ts` の実装を参照）。
