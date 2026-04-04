# テスト仕様書（Brewia）

このディレクトリは、Brewia のテスト方針とテストケース仕様をまとめるための入口です。

## ドキュメント構成

- `strategy.md`
  - t_wada 流 TDD を前提にしたテスト戦略
  - レイヤーごとの責務と、どこまでをテスト対象にするか
- `unit-usecases.md`
  - 現在実装済みの service / repository 契約テスト仕様
  - Given / When / Then ベースの観点一覧

## 参照実装

現時点での実装・テストコードは以下です。

- `lib/shared/nullable.ts`
- `lib/application/bean/service.ts`
- `lib/application/bean/repository.ts`
- `lib/application/brew/service.ts`
- `lib/application/brew/repository.ts`
- `test/lib/shared/nullable.spec.ts`
- `test/lib/application/bean/service.spec.ts`
- `test/lib/application/brew/service.spec.ts`

## 実行コマンド

```bash
pnpm test
```

