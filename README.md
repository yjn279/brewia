# Brewia

世界各国のコーヒー豆との出会いと、その豆をどのように抽出してどのように味わったかを、記録するアプリ。単なる記録ではなく、豆ごとの履歴と、抽出ごとの体験が積み重なっていく「コーヒー体験の航海日誌」のようなプロダクトです。

### Core Features

- コーヒー豆の情報管理
- コーヒーの抽出レシピや、抽出したカップのログ管理
- 抽出したカップのテイスティングノート

### PWA 対応

ホーム画面に追加することでアプリとしてインストール可能です。オフライン時はフォールバックページが表示されます。マニフェストは `/manifest.webmanifest`、Service Worker は `/sw.js` として配信されます。

## Getting Started

このリポジトリをクローンした後、以下のコードを実行してサーバーを起動することができます。ブラウザで `http://localhost:3000` を開き、アプリケーションへアクセスしましょう！

```shell
cd brewia
pnpm install
pnpm start
```

## Documentation

### 仕様書（開発資産）

- [要件定義書](./docs/requirements.md)
- [API 仕様書](./docs/api-spec.md)
- [データ仕様書](./docs/data-spec.md)
- [画面仕様書](./docs/screen-spec.md)

### 開発ガイド

- [Development Guide](./docs/development-guide.md)
- [認証アーキテクチャ](./docs/auth-architecture.md)
- [写真フォーム抽出](./docs/photo-form-extraction.md)
- [Data Structures（型早見表）](./docs/data-structures.md)
