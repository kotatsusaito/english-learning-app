# Vercel クイックスタート（最も簡単）

## 5分でデプロイ完了

### 1. Vercel CLIをインストール

```bash
npm install -g vercel
```

### 2. ログイン

```bash
vercel login
```

ブラウザが開いてログインします（GitHubアカウントでOK）

### 3. バックエンドをデプロイ

```bash
cd backend
vercel --prod
```

プロンプトで：
- Set up and deploy? **Y**
- Which scope? あなたのアカウントを選択
- Link to existing project? **N**
- Project name? **english-learning-backend**
- In which directory is your code located? **./** (Enterを押す)

### 4. 環境変数を設定

```bash
# Claude API キー
vercel env add CLAUDE_API_KEY production
# 値を入力: あなたのClaude APIキー

# AI Service
vercel env add AI_SERVICE production
# 値を入力: claude

# Claude Model
vercel env add CLAUDE_MODEL production
# 値を入力: claude-3-haiku-20240307
```

### 5. バックエンドを再デプロイ（環境変数を反映）

```bash
vercel --prod
```

デプロイ完了後、URLが表示されます（例: https://english-learning-backend-xxx.vercel.app）

### 6. フロントエンドをデプロイ

```bash
cd ../frontend

# バックエンドURLを設定
echo "VITE_API_BASE_URL=https://your-backend-url.vercel.app" > .env.production

# デプロイ
vercel --prod
```

プロンプトで：
- Set up and deploy? **Y**
- Which scope? あなたのアカウントを選択
- Link to existing project? **N**
- Project name? **english-learning-frontend**
- In which directory is your code located? **./** (Enterを押す)

### 完了！

フロントエンドのURLが表示されます。そのURLにアクセスしてアプリを使用できます。

## メリット

- ✓ 5分でデプロイ完了
- ✓ 無料プラン利用可能
- ✓ 自動HTTPS
- ✓ グローバルCDN
- ✓ 簡単な環境変数管理

## トラブルシューティング

### ビルドエラーが発生した場合

```bash
# ローカルでビルドテスト
npm run build

# エラーを修正してから再デプロイ
vercel --prod
```

### 環境変数を更新したい場合

```bash
# Vercelダッシュボードで更新
# または
vercel env rm VARIABLE_NAME production
vercel env add VARIABLE_NAME production
vercel --prod
```
