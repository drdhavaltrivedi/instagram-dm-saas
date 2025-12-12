# Netlify Deployment Guide

Complete guide to deploy DMflow to Netlify.

## 🚀 Quick Deploy

### Option 1: Deploy via Netlify UI (Recommended)

1. **Go to Netlify Dashboard**
   - Visit https://app.netlify.com
   - Click "Add new site" → "Import an existing project"

2. **Connect to GitHub**
   - Select "GitHub" as your Git provider
   - Authorize Netlify to access your repositories
   - Select `instagram-dm-saas` repository

3. **Configure Build Settings**
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Node version**: `20`

4. **Add Environment Variables**
   Click "Show advanced" → "New variable" and add:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com
   NEXT_PUBLIC_POSTHOG_KEY=phc_24Q6SdPJCXZNP7GfojwBdEIVIEZOmqgrgjOR8014afI
   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
   NEXT_PUBLIC_META_APP_ID=your_meta_app_id (optional)
   NEXT_PUBLIC_META_OAUTH_REDIRECT_URI=https://your-site.netlify.app/api/instagram/callback
   ```

5. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete
   - Your site will be live at `https://your-site-name.netlify.app`

### Option 2: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Navigate to frontend directory
cd frontend

# Initialize site
netlify init

# Deploy
netlify deploy --prod
```

## 🔧 Backend Deployment

The NestJS backend needs to be deployed separately. Options:

### Option A: Railway (Recommended for NestJS)

1. **Go to Railway**
   - Visit https://railway.app
   - Sign up/login with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your `instagram-dm-saas` repository

3. **Configure Service**
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`

4. **Add Environment Variables**
   ```
   DATABASE_URL=your_postgresql_connection_string
   DIRECT_URL=your_direct_postgresql_connection_string
   JWT_SECRET=your_jwt_secret
   ENCRYPTION_KEY=your_32_character_encryption_key
   NODE_ENV=production
   PORT=3001
   ```

5. **Get Backend URL**
   - Railway will provide a URL like `https://your-app.up.railway.app`
   - Update `NEXT_PUBLIC_BACKEND_URL` in Netlify with this URL

### Option B: Render

1. **Go to Render**
   - Visit https://render.com
   - Sign up/login

2. **Create New Web Service**
   - Connect GitHub repository
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`

3. **Add Environment Variables** (same as Railway)

### Option C: Fly.io

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Create Fly App**
   ```bash
   cd backend
   fly launch
   ```

3. **Set Secrets**
   ```bash
   fly secrets set DATABASE_URL=your_url
   fly secrets set JWT_SECRET=your_secret
   # ... etc
   ```

## 📝 Post-Deployment Checklist

### Frontend (Netlify)

- [ ] Site is accessible at Netlify URL
- [ ] Environment variables are set
- [ ] Build completes successfully
- [ ] Pages load correctly
- [ ] API calls work (check browser console)
- [ ] PostHog tracking works (check PostHog dashboard)

### Backend

- [ ] Backend is accessible
- [ ] Database migrations are run
- [ ] Environment variables are set
- [ ] API endpoints respond correctly
- [ ] CORS is configured (if needed)

### Integration

- [ ] Update `NEXT_PUBLIC_BACKEND_URL` in Netlify with backend URL
- [ ] Update extension URLs (see `EXTENSION_DEPLOYMENT.md`)
- [ ] Test Instagram account connection
- [ ] Test campaign creation
- [ ] Test lead search

## 🔄 Continuous Deployment

Netlify automatically deploys on every push to main branch:

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Netlify will automatically:**
   - Detect the push
   - Run build command
   - Deploy new version
   - Update your site

## 🌐 Custom Domain (Optional)

1. **In Netlify Dashboard**
   - Go to Site Settings → Domain management
   - Click "Add custom domain"
   - Enter your domain

2. **Update DNS**
   - Add CNAME record pointing to your Netlify site
   - Or use Netlify DNS

3. **Update Environment Variables**
   - Update `NEXT_PUBLIC_META_OAUTH_REDIRECT_URI` with new domain
   - Update extension URLs if needed

## 🔍 Troubleshooting

### Build Fails

1. **Check Build Logs**
   - Go to Netlify Dashboard → Deploys
   - Click on failed deploy
   - Review error messages

2. **Common Issues**
   - Missing environment variables
   - Node version mismatch (use Node 20)
   - Build command incorrect
   - Missing dependencies

### API Calls Fail

1. **Check Backend URL**
   - Verify `NEXT_PUBLIC_BACKEND_URL` is correct
   - Test backend URL directly in browser

2. **Check CORS**
   - Backend should allow requests from Netlify domain
   - Update CORS settings in backend if needed

### Database Issues

1. **Run Migrations**
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

2. **Check Connection**
   - Verify `DATABASE_URL` is correct
   - Test connection from backend

## 📊 Monitoring

### Netlify Analytics
- View site analytics in Netlify Dashboard
- Monitor build times and success rates

### PostHog
- Track user behavior and events
- Monitor feature usage

### Backend Logs
- Check Railway/Render/Fly.io logs
- Monitor API errors and performance

## 🔐 Security Checklist

- [ ] Environment variables are set (not hardcoded)
- [ ] API keys are secure
- [ ] Database credentials are protected
- [ ] HTTPS is enabled (automatic on Netlify)
- [ ] CORS is properly configured
- [ ] Rate limiting is in place (if needed)

## 🚀 Next Steps After Deployment

1. **Update Extension**
   - Update extension URLs with production URLs
   - Rebuild and republish extension

2. **Test Everything**
   - Test all features end-to-end
   - Verify all integrations work

3. **Monitor**
   - Set up alerts for errors
   - Monitor user activity
   - Track performance metrics

4. **Optimize**
   - Review build times
   - Optimize bundle size
   - Improve load times

---

**Need Help?**
- Netlify Docs: https://docs.netlify.com
- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs

