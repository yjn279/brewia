# brewia

## Concept

世界各国のコーヒー豆との出会いと、その豆をどのように抽出し、どのように味わったかを、飛行機のフライトログのように記録するモバイルアプリ。単なる記録ではなく、豆ごとの履歴と、抽出ごとの体験が積み重なっていく「コーヒー体験の航海日誌」のようなプロダクトです。

## Specification

### Core Features
- 豆（Bean）情報の登録・閲覧
- 抽出（Brew）ログの作成・閲覧
- 風味（Flavor）タグ付け
- 抽出ステップ（時間と注湯量）の記録
- テイスティングスコア（aroma / acidity / sweetness / body / overall）の記録

### Primary Screens
- トップ: 豆・抽出のサマリー表示
- 新規作成: 豆登録 / 抽出登録
- 豆詳細: 豆の基本情報 + 紐づく抽出履歴
- 抽出詳細: レシピ、ステップ、評価、フレーバー

### Non-functional Requirements
- モバイル利用を前提にした操作性
- 数値入力のしやすさ（グラム、秒、温度）
- 将来の永続化層差し替えを考慮した型中心設計

## Data Structures

- [data-structures.md](./docs/data-structures.md)

## Setup

```bash
pnpm install
```

## Run

```bash
pnpm dev
```

ブラウザで `http://localhost:3000` を開いて確認してください。
