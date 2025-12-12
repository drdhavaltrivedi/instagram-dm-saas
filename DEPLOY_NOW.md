# 🚀 Deploy to Netlify - Quick Start

Follow these steps to deploy your DMflow application to Netlify.

## Step 1: Deploy Frontend to Netlify

### Via Netlify Dashboard (Easiest)

1. **Go to Netlify**
   - Visit: https://app.netlify.com
   - Make sure you're logged in

2. **Import Your Project**
   - Click "Add new site" → "Import an existing project"
   - Click "Deploy with GitHub"
   - Authorize Netlify if needed
   - Select repository: `instagram-dm-saas`

3. **Configure Build Settings**
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Node version**: `20` (or leave default)

4. **Add Environment Variables**
   Click "Show advanced" → "New variable" and add each:

   ```
   NEXT_PUBLIC_SUPABASE_URL
   = your_supabase_url_here
   
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   = your_supabase_anon_key_here
   
   NEXT_PUBLIC_BACKEND_URL
   = http://localhost:3001
   (Update this after backend is deployed)
   
   NEXT_PUBLIC_POSTHOG_KEY
   = phc_24Q6SdPJCXZNP7GfojwBdEIVIEZOmqgrgjOR8014afI
   
   NEXT_PUBLIC_POSTHOG_HOST
   = https://us.i.posthog.com
   
   NEXT_PUBLIC_META_APP_ID
   = your_meta_app_id (optional)
   
   NEXT_PUBLIC_META_OAUTH_REDIRECT_URI
   = https://your-site-name.netlify.app/api/instagram/callback
   (Update with your actual Netlify URL after deployment)
   ```

5. **Deploy!**
   - Click "Deploy site"
   - Wait 2-5 minutes for build
   - Your site will be live! 🎉

## Step 2: Deploy Backend

The backend (NestJS) needs to be deployed separately. Choose one:

### Option A: Railway (Recommended - Free tier available)

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `instagram-dm-saas` repository
5. Click "Add Service" → "GitHub Repo"
6. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
7. Add Environment Variables:
   ```
   DATABASE_URL=your_postgresql_url
   DIRECT_URL=your_direct_postgresql_url
   JWT_SECRET=your_jwt_secret
   ENCRYPTION_KEY=your_32_char_encryption_key
   NODE_ENV=production
   PORT=3001
   ```
8. Get your Railway URL (e.g., `https://your-app.up.railway.app`)
9. Update `NEXT_PUBLIC_BACKEND_URL` in Netlify with this URL

### Option B: Render

1. Go to https://render.com
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect your GitHub repo
5. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
6. Add same environment variables as Railway
7. Get Render URL and update Netlify

## Step 3: Update Configuration

After both are deployed:

1. **Update Netlify Environment Variable**
   - Go to Netlify Dashboard → Site Settings → Environment Variables
   - Update `NEXT_PUBLIC_BACKEND_URL` with your backend URL
   - Trigger a new deploy

2. **Update Extension URLs** (if you've published it)
   - See `EXTENSION_DEPLOYMENT.md`
   - Update extension with production URLs

## Step 4: Test Everything

1. Visit your Netlify site
2. Test login/signup
3. Test Instagram account connection
4. Test campaign creation
5. Test lead search
6. Check PostHog dashboard for events

## ✅ Deployment Checklist

- [ ] Frontend deployed to Netlify
- [ ] Environment variables set in Netlify
- [ ] Backend deployed (Railway/Render/etc)
- [ ] Backend environment variables set
- [ ] `NEXT_PUBLIC_BACKEND_URL` updated in Netlify
- [ ] Site is accessible
- [ ] All features tested
- [ ] PostHog tracking verified

## 🆘 Troubleshooting

**Build fails?**
- Check build logs in Netlify
- Verify Node version is 20
- Check environment variables are set

**API calls fail?**
- Verify `NEXT_PUBLIC_BACKEND_URL` is correct
- Check backend is running
- Check CORS settings in backend

**Database errors?**
- Run migrations: `npx prisma migrate deploy` (in backend)
- Verify `DATABASE_URL` is correct

## 📞 Need Help?

- Netlify Docs: https://docs.netlify.com
- Railway Docs: https://docs.railway.app
- Check `NETLIFY_DEPLOYMENT.md` for detailed guide

---

**Ready? Let's deploy! 🚀**

