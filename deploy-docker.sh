#!/bin/bash

# Docker を使用した GCP デプロイ
set -e

PROJECT_ID="my-project-english-training"
REGION="asia-northeast1"

echo "========================================="
echo "Docker Build & Deploy"
echo "========================================="

# 1. Shared をビルド
echo "Building shared package..."
cd shared
npm install
npm run build
cd ..

# 2. Backend をビルド
echo "Building backend..."
cd backend
npm install
npm run build
cd ..

# 3. Docker イメージをビルド
echo "Building Docker image..."
docker build -t gcr.io/$PROJECT_ID/english-learning-backend:latest -f- . <<'EOF'
FROM node:18-alpine
WORKDIR /app
COPY shared/package*.json ./shared/
COPY shared/dist ./shared/dist
COPY shared/node_modules ./shared/node_modules
COPY backend/package*.json ./backend/
COPY backend/dist ./backend/dist
COPY backend/node_modules ./backend/node_modules
EXPOSE 8080
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app/backend
CMD ["node", "dist/index.js"]
EOF

# 4. Docker イメージをプッシュ
echo "Pushing Docker image..."
docker push gcr.io/$PROJECT_ID/english-learning-backend:latest

# 5. Cloud Run にデプロイ
echo "Deploying to Cloud Run..."
gcloud run deploy english-learning-backend \
    --image gcr.io/$PROJECT_ID/english-learning-backend:latest \
    --platform managed \
    --region $REGION \
    --project $PROJECT_ID \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --set-env-vars "NODE_ENV=production,AI_SERVICE=claude,CLAUDE_MODEL=claude-3-haiku-20240307" \
    --set-secrets "CLAUDE_API_KEY=CLAUDE_API_KEY:latest"

BACKEND_URL=$(gcloud run services describe english-learning-backend \
    --region $REGION \
    --project $PROJECT_ID \
    --format 'value(status.url)')

echo "✓ Backend deployed: $BACKEND_URL"

# Frontend
cd frontend
echo "VITE_API_BASE_URL=${BACKEND_URL}" > .env.production
npm install
npm run build

# Frontend Docker イメージ
echo "Building frontend Docker image..."
docker build -t gcr.io/$PROJECT_ID/english-learning-frontend:latest -f- . <<'EOF'
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
EOF

docker push gcr.io/$PROJECT_ID/english-learning-frontend:latest

gcloud run deploy english-learning-frontend \
    --image gcr.io/$PROJECT_ID/english-learning-frontend:latest \
    --platform managed \
    --region $REGION \
    --project $PROJECT_ID \
    --allow-unauthenticated \
    --port 8080 \
    --memory 256Mi

FRONTEND_URL=$(gcloud run services describe english-learning-frontend \
    --region $REGION \
    --project $PROJECT_ID \
    --format 'value(status.url)')

echo "========================================="
echo "🎉 Complete!"
echo "Frontend: $FRONTEND_URL"
echo "Backend: $BACKEND_URL"
echo "========================================="
