# 🚀 JobJourneyAI Deployment Guide

JobJourneyAI is production-ready. Follow the instructions below to deploy to **Render**, **Railway**, **Fly.io**, or any **Node.js Cloud Provider**.

---

## 🛠️ Step 1: Pre-Deployment Verification

Run the production build and type checking commands locally:

```bash
# 1. Verify TypeScript type safety
npm run check

# 2. Build client and server bundles
npm run build

# 3. Test production runtime locally
npm run start
```

Your app will be served on `http://localhost:5000`.

---

## 🌐 Option A: Deploy to Render (Recommended - Free/Low Cost)

1. **Push your repository** to GitHub.
2. Sign in to [Render Console](https://dashboard.render.com/) and click **New +** -> **Web Service**.
3. Connect your GitHub repository `JobJourneyAI`.
4. Configure service settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
5. Add **Environment Variables**:
   - `MONGODB_URI`: Your MongoDB Atlas URI string
   - `SESSION_SECRET`: Random secure string (e.g. `openssl rand -hex 32`)
   - `GROQ_API_KEY`: Groq API key from [Console Groq](https://console.groq.com)
   - `SERPER_API_KEY`: Serper dev API key from [Serper.dev](https://serper.dev)
   - `GEMINI_API_KEY` (Optional): Google Gemini API key
   - `NODE_ENV`: `production`
6. Click **Create Web Service**.

---

## 🚆 Option B: Deploy to Railway

1. Sign in to [Railway.app](https://railway.app/).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select `JobJourneyAI`.
4. Railway will automatically detect the `Dockerfile` or `package.json`.
5. Add environment variables in the **Variables** tab (`MONGODB_URI`, `GROQ_API_KEY`, `SERPER_API_KEY`, `SESSION_SECRET`).
6. Click **Deploy**.

---

## 🐳 Option C: Docker Container Deployment

Build and run using Docker locally or on cloud providers (AWS ECS, GCP Cloud Run, DigitalOcean App Platform):

```bash
# Build Docker image
docker build -t jobjourneyai .

# Run Docker container
docker run -p 5000:5000 \
  -e MONGODB_URI="your_mongodb_uri" \
  -e SESSION_SECRET="your_secret" \
  -e GROQ_API_KEY="your_groq_api_key" \
  -e SERPER_API_KEY="your_serper_api_key" \
  jobjourneyai
```

---

## 🔑 Required Environment Variables Reference

| Variable Name | Required | Description |
| :--- | :---: | :--- |
| `PORT` | Optional | Port for the Node server (Default: `5000` or provided by host) |
| `NODE_ENV` | Required | Set to `production` in live environments |
| `MONGODB_URI` | Required | Connection string for MongoDB database |
| `SESSION_SECRET` | Required | Encryption secret string for user sessions |
| `GROQ_API_KEY` | Required | API Key for primary AI inference engine ([Get Key](https://console.groq.com)) |
| `SERPER_API_KEY` | Required | API Key for live Google job search indexing ([Get Key](https://serper.dev)) |
| `GEMINI_API_KEY` | Optional | Fallback Google Gemini AI key ([Get Key](https://aistudio.google.com/)) |

---

## ✅ Deployment Checklist

- [x] Tested production bundle compilation (`npm run build`)
- [x] Verified static client asset serving in production (`dist/public`)
- [x] Configured MongoDB session fallback store
- [x] Added `Dockerfile` multi-stage container build
- [x] Pushed latest main branch to GitHub
