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

- [Requirements](./docs/requirements.md)
- [API Spec](./docs/api-spec.md)
- [Data Spec](./docs/data-spec.md)
- [Screen Spec](./docs/screen-spec.md)
- [Development Guide](./docs/development-guide.md)
- [Data Structures](./docs/data-structures.md)
