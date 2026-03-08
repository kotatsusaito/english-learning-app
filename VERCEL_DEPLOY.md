# Vercel デプロイガイド（最も簡単な方法）

Vercelを使用すると、GitHubリポジトリと連携して自動デプロイできます。

## 方法1: Vercel CLI（最速）

### 1. Vercel CLIをインストール

```bash
npm install -g vercel
```

### 2. ログイン

```bash
vercel login
```

### 3. デプロイ

```bash
cd "/Users/kotatsusaito/English Study"
vercel
```

プロンプトに従って：
- プロジェクト名を入力
- 環境変数を設定（CLAUDE_API_KEY）

### 4. 本番環境にデプロイ

```bash
vercel --prod
```

## 方法2: GitHub + Vercel（推奨）

### 1. GitHubリポジトリを作成

```bash
cd "/Users/kotatsusaito/English Study"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/english-learning-app.git
git push -u origin main
```

### 2. Vercelでインポート

1. [Vercel](https://vercel.com) にアクセス
2. 「New Project」をクリック
3. GitHubリポジトリを選択
4. 環境変数を設定：
   - `CLAUDE_API_KEY`: あなたのClaude APIキー
   - `AI_SERVICE`: claude
   - `CLAUDE_MODEL`: claude-3-haiku-20240307
5. 「Deploy」をクリック

### 3. 自動デプロイ

以降、mainブランチにpushすると自動的にデプロイされます。

## 環境変数の設定

Vercelダッシュボードで：
1. プロジェクトを選択
2. Settings → Environment Variables
3. 以下を追加：
   - `CLAUDE_API_KEY`
   - `AI_SERVICE=claude`
   - `CLAUDE_MODEL=claude-3-haiku-20240307`
   - `NODE_ENV=production`

## メリット

- ✓ 無料プラン利用可能
- ✓ 自動HTTPS
- ✓ グローバルCDN
- ✓ 自動スケーリング
- ✓ GitHubと連携した自動デプロイ
- ✓ プレビューデプロイ（PRごと）

## 制限事項

- サーバーレス関数の実行時間: 10秒（Hobby）/ 60秒（Pro）
- メモリ: 1024MB
- 月間実行時間: 100時間（Hobby）

長時間実行が必要な場合はGoogle Cloud Runを使用してください。
