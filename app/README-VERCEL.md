# Deploying to Vercel

This project builds a static frontend into `dist/public` and exposes serverless API functions under `api/`.

Quick steps to deploy from your machine:

1. Install Vercel CLI (optional, you can also use the dashboard):

```powershell
npm i -g vercel
```

2. Build and preview locally:

```powershell
cd app
npm install
npm run build
npm run preview
```

3. Deploy with Vercel CLI (interactive):

```powershell
cd app
vercel login
vercel --prod
```

4. After deploy, Vercel will give you a URL like:

https://your-project-name.vercel.app

Notes and environment variables
- The API expects these environment variables to be set in Vercel:
  - DATABASE_URL
  - APP_ID
  - APP_SECRET
  - KIMI_AUTH_URL
  - AWS / S3 keys if you use uploads

If you want me to deploy the project directly, I will need either access to your Vercel account or you can run the `vercel --prod` command and paste me the deployment URL.
