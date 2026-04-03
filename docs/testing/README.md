# テスト仕様書（Brewia）

このディレクトリは、Brewia のテスト方針とテストケース仕様をまとめるための入口です。

## ドキュメント構成

- `strategy.md`
  - t_wada 流 TDD を前提にしたテスト戦略
  - レイヤーごとの責務と、どこまでをテスト対象にするか
- `unit-usecases.md`
  - 現在実装済みのユースケース単体テスト仕様
  - Given / When / Then ベースの観点一覧

## 参照実装

現時点での実装・テストコードは以下です。

- `lib/shared/nullable.ts`
- `lib/application/usecases/create-bean.ts`
- `lib/application/usecases/create-brew.ts`
- `test/lib/shared/nullable.spec.ts`
- `test/lib/application/usecases/create-bean.spec.ts`
- `test/lib/application/usecases/create-brew.spec.ts`

## 実行コマンド

```bash
pnpm test
```

