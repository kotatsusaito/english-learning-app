#!/bin/bash

# Google Cloud Run デプロイスクリプト
# 新しいターミナルで実行してください

set -e

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}English Learning App - GCP デプロイ${NC}"
echo -e "${GREEN}========================================${NC}"

# プロジェクトIDの設定
PROJECT_ID="my-project-english-training"
REGION="asia-northeast1"

echo -e "${BLUE}プロジェクトID: ${PROJECT_ID}${NC}"
echo -e "${BLUE}リージョン: ${REGION}${NC}"

# gcloudの確認
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}エラー: gcloud CLIが見つかりません${NC}"
    echo "インストール: brew install google-cloud-sdk"
    exit 1
fi

echo -e "\n${YELLOW}ステップ 1/8: プロジェクト設定${NC}"
gcloud config set project $PROJECT_ID

echo -e "\n${YELLOW}ステップ 2/8: 認証確認${NC}"
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo -e "${YELLOW}認証が必要です。ブラウザが開きます...${NC}"
    gcloud auth login
fi

echo -e "\n${YELLOW}ステップ 3/8: 必要なAPIを有効化${NC}"
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com

echo -e "\n${YELLOW}ステップ 4/8: Claude API キーの設定${NC}"
if gcloud secrets describe CLAUDE_API_KEY &>/dev/null; then
    echo -e "${GREEN}CLAUDE_API_KEY は既に存在します${NC}"
else
    echo -e "${YELLOW}backend/.env からClaude API キーを読み込みます${NC}"
    if [ -f backend/.env ]; then
        CLAUDE_KEY=$(grep CLAUDE_API_KEY backend/.env | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)
        if [ -n "$CLAUDE_KEY" ]; then
            echo -n "$CLAUDE_KEY" | gcloud secrets create CLAUDE_API_KEY \
                --data-file=- \
                --replication-policy="automatic"
            echo -e "${GREEN}Claude API キーを設定しました${NC}"
        else
            echo -e "${RED}エラー: backend/.env にCLAUDE_API_KEYが見つかりません${NC}"
            echo "手動で設定してください:"
            echo "echo -n 'YOUR_API_KEY' | gcloud secrets create CLAUDE_API_KEY --data-file=- --replication-policy='automatic'"
            exit 1
        fi
    else
        echo -e "${RED}エラー: backend/.env が見つかりません${NC}"
        exit 1
    fi
fi

echo -e "\n${YELLOW}ステップ 5/8: Secret Manager権限の設定${NC}"
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor" \
    --condition=None 2>/dev/null || echo "権限は既に設定されています"

echo -e "\n${YELLOW}ステップ 6/8: バックエンドをデプロイ${NC}"
echo -e "${BLUE}これには5-10分かかります...${NC}"

# Dockerfileを使用してビルド
gcloud run deploy english-learning-backend \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --timeout 300 \
    --set-env-vars "NODE_ENV=production,AI_SERVICE=claude,CLAUDE_MODEL=claude-3-haiku-20240307" \
    --set-secrets "CLAUDE_API_KEY=CLAUDE_API_KEY:latest" \
    --ignore-file=backend/.dockerignore

BACKEND_URL=$(gcloud run services describe english-learning-backend \
    --region $REGION \
    --format 'value(status.url)')

echo -e "${GREEN}✓ バックエンドデプロイ完了${NC}"
echo -e "${GREEN}  URL: ${BACKEND_URL}${NC}"

echo -e "\n${YELLOW}ステップ 7/8: フロントエンド環境変数を設定${NC}"
cat > frontend/.env.production << EOF
VITE_API_BASE_URL=${BACKEND_URL}
EOF
echo -e "${GREEN}✓ 環境変数を設定しました${NC}"

echo -e "\n${YELLOW}ステップ 8/8: フロントエンドをデプロイ${NC}"
echo -e "${BLUE}これには5-10分かかります...${NC}"

gcloud run deploy english-learning-frontend \
    --source ./frontend \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --memory 256Mi \
    --cpu 1 \
    --timeout 60

FRONTEND_URL=$(gcloud run services describe english-learning-frontend \
    --region $REGION \
    --format 'value(status.url)')

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 デプロイ完了！${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}フロントエンド: ${FRONTEND_URL}${NC}"
echo -e "${GREEN}バックエンド: ${BACKEND_URL}${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n${YELLOW}次のステップ:${NC}"
echo -e "1. フロントエンドURLにアクセス"
echo -e "2. CEFRレベルを選択"
echo -e "3. 学習セッションを開始"
echo -e "\n${YELLOW}ログの確認:${NC}"
echo -e "gcloud run services logs read english-learning-backend --region $REGION"
echo -e "gcloud run services logs read english-learning-frontend --region $REGION"
