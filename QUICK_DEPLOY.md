# クイックデプロイガイド

## 現在の状況
- Google Cloud SDK: インストール済み ✓
- デプロイファイル: 作成済み ✓
- プロジェクトID: my-project-english-training

## 手動デプロイ手順

### 1. 新しいターミナルを開く

現在のターミナルセッションでgcloudプロセスがブロックされているため、**新しいターミナルウィンドウ**を開いてください。

### 2. プロジェクトディレクトリに移動

```bash
cd "/Users/kotatsusaito/English Study"
```

### 3. gcloud設定

```bash
# プロジェクトを設定
gcloud config set project my-project-english-training

# 認証（ブラウザが開きます）
gcloud auth login

# デフォルトリージョンを設定（東京）
gcloud config set run/region asia-northeast1
```

### 4. 必要なAPIを有効化

```bash
# Cloud Run API
gcloud services enable run.googleapis.com

# Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# Container Registry API
gcloud services enable containerregistry.googleapis.com

# Secret Manager API
gcloud services enable secretmanager.googleapis.com
```

### 5. Claude API キーを設定

```bash
# backend/.env ファイルからClaude API キーを取得して設定
echo -n "YOUR_CLAUDE_API_KEY" | gcloud secrets create CLAUDE_API_KEY \
    --data-file=- \
    --replication-policy="automatic"
```

**注意**: `YOUR_CLAUDE_API_KEY` を実際のAPIキーに置き換えてください。

### 6. バックエンドをデプロイ

```bash
cd backend

gcloud run deploy english-learning-backend \
    --source . \
    --platform managed \
    --region asia-northeast1 \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --set-env-vars "NODE_ENV=production,AI_SERVICE=claude,CLAUDE_MODEL=claude-3-haiku-20240307" \
    --set-secrets "CLAUDE_API_KEY=CLAUDE_API_KEY:latest"
```

デプロイには5-10分かかります。完了すると、バックエンドのURLが表示されます。

### 7. バックエンドURLを取得

```bash
BACKEND_URL=$(gcloud run services describe english-learning-backend \
    --region asia-northeast1 \
    --format 'value(status.url)')

echo "Backend URL: $BACKEND_URL"
```

### 8. フロントエンド環境変数を設定

```bash
cd ../frontend

# 本番環境用の環境変数ファイルを作成
echo "VITE_API_BASE_URL=${BACKEND_URL}" > .env.production
```

### 9. フロントエンドをデプロイ

```bash
gcloud run deploy english-learning-frontend \
    --source . \
    --platform managed \
    --region asia-northeast1 \
    --allow-unauthenticated \
    --port 8080 \
    --memory 256Mi \
    --cpu 1
```

### 10. フロントエンドURLを取得

```bash
FRONTEND_URL=$(gcloud run services describe english-learning-frontend \
    --region asia-northeast1 \
    --format 'value(status.url)')

echo "=========================================="
echo "デプロイ完了！"
echo "=========================================="
echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL: $BACKEND_URL"
echo "=========================================="
```

## トラブルシューティング

### ビルドエラーが発生した場合

```bash
# ビルドログを確認
gcloud builds list --limit=5

# 詳細なログを確認
gcloud builds log [BUILD_ID]
```

### サービスが起動しない場合

```bash
# ログを確認
gcloud run services logs read english-learning-backend --region asia-northeast1 --limit 50
```

### Secret Managerの権限エラー

```bash
# プロジェクト番号を取得
PROJECT_NUMBER=$(gcloud projects describe my-project-english-training --format="value(projectNumber)")

# Cloud Run サービスアカウントに権限を付与
gcloud projects add-iam-policy-binding my-project-english-training \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

## 簡易デプロイスクリプト

上記の手順を自動化したい場合は、プロジェクトルートの `deploy.sh` を使用できます：

```bash
cd "/Users/kotatsusaito/English Study"

# 環境変数を設定
export GCP_PROJECT_ID="my-project-english-training"
export GCP_REGION="asia-northeast1"

# デプロイ実行
bash deploy.sh
```

## デプロイ後の確認

1. フロントエンドURLにアクセス
2. CEFRレベルを選択
3. セッションを開始
4. 質問が生成されることを確認
5. 音声入力と修正機能をテスト

## コスト管理

- Cloud Runは使用した分だけ課金
- 月間200万リクエストまで無料
- 推定コスト: 月額$5-20（使用量による）

## サポート

問題が発生した場合は、以下を確認してください：
1. gcloud CLIのバージョン: `gcloud --version`
2. 認証状態: `gcloud auth list`
3. プロジェクト設定: `gcloud config list`
4. サービスログ: `gcloud run services logs read [SERVICE_NAME] --region asia-northeast1`
