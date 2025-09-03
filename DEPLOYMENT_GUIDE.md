# AI Expense Tracker - Deployment Guide

This guide will walk you through deploying your AI Expense Tracker application on Render, a free cloud hosting platform.

## Prerequisites

1. **Git Repository**: Ensure your code is pushed to GitHub, GitLab, or any Git hosting service
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **API Keys**: You'll need to set up your OpenAI and Google API keys

## Step 1: Prepare Your Repository

1. **Push your code to Git** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Ensure your render.yaml is committed** - this file configures both services

## Step 2: Deploy on Render

### Option A: Automatic Deployment (Recommended)

1. **Go to [render.com](https://render.com)** and sign in
2. **Click "New +" → "Blueprint"**
3. **Connect your Git repository** and select it
4. **Click "Use this blueprint"**
5. **Review the configuration** and click "Apply"

This will automatically create both your backend and frontend services using the `render.yaml` configuration.

### Option B: Manual Deployment

#### Backend Service

1. **Click "New +" → "Web Service"**
2. **Connect your Git repository**
3. **Configure the service**:
   - **Name**: `expenseai-backend`
   - **Environment**: `Python 3`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python run.py`
4. **Add Environment Variables**:
   - `PORT`: `8000`
   - `HOST`: `0.0.0.0`
   - `OPENAI_API_KEY`: [Your OpenAI API Key]
   - `GOOGLE_API_KEY`: [Your Google API Key]
5. **Click "Create Web Service"**

#### Frontend Service

1. **Click "New +" → "Web Service"** again
2. **Connect the same Git repository**
3. **Configure the service**:
   - **Name**: `expenseai-frontend`
   - **Environment**: `Node`
   - **Root Directory**: Leave empty (root)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. **Add Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: `https://expenseai-backend.onrender.com`
5. **Click "Create Web Service"**

## Step 3: Set Up API Keys

1. **Go to your backend service** in Render
2. **Click "Environment" tab**
3. **Add your API keys**:
   - `OPENAI_API_KEY`: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
   - `GOOGLE_API_KEY`: Get from [Google Cloud Console](https://console.cloud.google.com/)

## Step 4: Access Your Application

After deployment, you'll get two URLs:

- **Backend API**: `https://expenseai-backend.onrender.com`
- **Frontend App**: `https://expenseai-frontend.onrender.com`

**Your main application will be accessible at the frontend URL!**

## Step 5: Test Your Deployment

1. **Visit your frontend URL** in a browser
2. **Test the voice recording feature**
3. **Test adding expenses**
4. **Test the AI spending analysis**

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check the build logs in Render
   - Ensure all dependencies are in `requirements.txt` and `package.json`

2. **API Connection Errors**:
   - Verify `NEXT_PUBLIC_API_URL` is set correctly
   - Check CORS configuration in backend

3. **Environment Variables**:
   - Ensure all required environment variables are set
   - Check that API keys are valid

### Checking Logs

1. **In Render dashboard**, go to your service
2. **Click "Logs" tab** to see real-time logs
3. **Check for error messages** during startup

## Environment Variables Reference

### Backend (Python)
- `PORT`: Port number (default: 8000)
- `HOST`: Host address (default: 0.0.0.0)
- `OPENAI_API_KEY`: Your OpenAI API key
- `GOOGLE_API_KEY`: Your Google API key

### Frontend (Next.js)
- `NEXT_PUBLIC_API_URL`: Backend service URL

## Cost Information

- **Free Tier**: Both services are free on Render's free plan
- **Limitations**: 
  - Services may sleep after 15 minutes of inactivity
  - 750 hours/month free
  - 512MB RAM per service

## Next Steps

1. **Set up a custom domain** (optional)
2. **Configure monitoring** and alerts
3. **Set up automatic backups** for your database
4. **Scale up** if you need more resources

## Support

- **Render Documentation**: [docs.render.com](https://docs.render.com)
- **Render Community**: [community.render.com](https://community.render.com)
- **Project Issues**: Check your Git repository issues

---

**Your AI Expense Tracker is now live! 🎉**

Access it at: `https://expenseai-frontend.onrender.com`


