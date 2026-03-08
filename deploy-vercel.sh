#!/bin/bash

# Vercel デプロイスクリプト
set -e

echo "========================================="
echo "Vercel Deployment"
echo "========================================="

# Vercel CLIがインストールされているか確認
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Backend をデプロイ
echo ""
echo "Step 1: Deploying Backend..."
echo "========================================="
cd backend

# 環境変数ファイルを作成
if [ -f .env ]; then
    echo "Creating .env.production from .env..."
    cp .env .env.production
fi

# デプロイ
vercel --prod --yes

echo ""
echo "Backend deployed! Please copy the URL shown above."
echo ""
read -p "Enter the backend URL (e.g., https://xxx.vercel.app): " BACKEND_URL

# Frontend をデプロイ
echo ""
echo "Step 2: Deploying Frontend..."
echo "========================================="
cd ../frontend

# バックエンドURLを設定
echo "VITE_API_BASE_URL=${BACKEND_URL}" > .env.production

# デプロイ
vercel --prod --yes

echo ""
echo "========================================="
echo "🎉 Deployment Complete!"
echo "========================================="
echo "Backend: $BACKEND_URL"
echo "Frontend: Check the URL above"
echo "========================================="
