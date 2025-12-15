# 🔧 Netlify Dashboard Settings - REQUIRED FIX

## The Plugin is Already Installed!

The `@netlify/plugin-nextjs` plugin is:
- ✅ Installed in `package.json` 
- ✅ Configured in `netlify.toml`
- ✅ Will work automatically (doesn't need to show in dashboard)

## ⚠️ CRITICAL: Dashboard Settings

You **MUST** configure these settings in the Netlify Dashboard:

### Step 1: Go to Build Settings
1. Visit: https://app.netlify.com/projects/bulkdm-saas
2. Click **Site settings** (gear icon)
3. Go to **Build & deploy** → **Build settings**

### Step 2: Configure These Settings

**Base directory**: `frontend` (if deploying from repo root)
- OR leave empty if deploying from `frontend` folder

**Build command**: `npm run build`
- Should already be set

**Publish directory**: **LEAVE EMPTY** ⚠️
- **This is CRITICAL!**
- The Next.js plugin handles this automatically
- If you set it to `.next`, it will break static file serving

### Step 3: Verify Environment Variables
1. Go to **Build & deploy** → **Environment variables**
2. Make sure these are set:
   - `NEXT_PUBLIC_BACKEND_URL` = `https://instagram-dm-saas-production.up.railway.app`
   - `NEXT_PUBLIC_SUPABASE_URL` = (your Supabase URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (your Supabase key)
   - `META_APP_SECRET` = (if needed)
   - `NODE_VERSION` = `20`

### Step 4: Clear Cache and Redeploy
1. Go to **Build & deploy** → **Post processing**
2. Click **Clear cache and deploy site**
3. Wait for deployment (2-3 minutes)

## ✅ How to Verify Plugin is Working

After deployment, check the build logs:
1. Go to **Deploys** tab
2. Click on the latest deploy
3. Look for: `Using Next.js Runtime - v5.x.x`
4. If you see this, the plugin is working! ✅

## 🔍 If Still Not Working

If static files still return HTML after following these steps:

1. **Check Build Logs** for plugin errors
2. **Verify Publish Directory is EMPTY** in dashboard
3. **Try Manual Publish Directory**: Set to `.next` (temporary workaround)
4. **Check if Base Directory is correct**: Should be `frontend` if deploying from repo root

## 📝 Current Configuration

- ✅ Plugin in `package.json`: `@netlify/plugin-nextjs@5.15.1`
- ✅ Plugin in `netlify.toml`: `[[plugins]] package = "@netlify/plugin-nextjs"`
- ⚠️ **Dashboard Publish Directory**: Must be EMPTY
- ⚠️ **Dashboard Base Directory**: Should be `frontend` (if needed)

The plugin works automatically from `netlify.toml` - you don't need to install it from the dashboard!

