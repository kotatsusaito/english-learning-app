#!/bin/bash

# Google Cloud Deployment Script for English Learning App
# This script deploys both backend and frontend to Cloud Run

set -e

# Configuration
PROJECT_ID="${GCP_PROJECT_ID}"
REGION="${GCP_REGION:-asia-northeast1}"
BACKEND_SERVICE="english-learning-backend"
FRONTEND_SERVICE="english-learning-frontend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}English Learning App - GCP Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if PROJECT_ID is set
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: GCP_PROJECT_ID environment variable is not set${NC}"
    echo "Please set it with: export GCP_PROJECT_ID=your-project-id"
    exit 1
fi

echo -e "${YELLOW}Project ID: ${PROJECT_ID}${NC}"
echo -e "${YELLOW}Region: ${REGION}${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set the project
echo -e "\n${YELLOW}Setting GCP project...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "\n${YELLOW}Enabling required APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Deploy Backend
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deploying Backend to Cloud Run${NC}"
echo -e "${GREEN}========================================${NC}"

gcloud run deploy $BACKEND_SERVICE \
    --source ./backend \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --timeout 300 \
    --set-env-vars "NODE_ENV=production" \
    --set-secrets "CLAUDE_API_KEY=CLAUDE_API_KEY:latest,OPENAI_API_KEY=OPENAI_API_KEY:latest" \
    || echo -e "${YELLOW}Note: Secrets not found. Please set them in Secret Manager if needed.${NC}"

# Get backend URL
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region $REGION --format 'value(status.url)')
echo -e "${GREEN}Backend deployed at: ${BACKEND_URL}${NC}"

# Update frontend config with backend URL
echo -e "\n${YELLOW}Updating frontend configuration...${NC}"
cat > frontend/.env.production << EOF
VITE_API_BASE_URL=${BACKEND_URL}
EOF

# Deploy Frontend
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deploying Frontend to Cloud Run${NC}"
echo -e "${GREEN}========================================${NC}"

gcloud run deploy $FRONTEND_SERVICE \
    --source ./frontend \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --memory 256Mi \
    --cpu 1 \
    --timeout 60

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --region $REGION --format 'value(status.url)')

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Frontend URL: ${FRONTEND_URL}${NC}"
echo -e "${GREEN}Backend URL: ${BACKEND_URL}${NC}"
echo -e "\n${YELLOW}Note: Make sure to set your API keys in Secret Manager:${NC}"
echo -e "  - CLAUDE_API_KEY"
echo -e "  - OPENAI_API_KEY (optional)"
