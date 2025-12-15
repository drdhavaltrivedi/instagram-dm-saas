# Netlify Environment Variables Setup

## Required Environment Variables

For the extension to work correctly, you need to set the backend URL in Netlify:

### 1. Go to Netlify Dashboard
- Open your site: `https://bulkdm-saas.netlify.app`
- Go to **Site settings** → **Environment variables**

### 2. Add Backend URL

**Variable Name**: `NEXT_PUBLIC_BACKEND_URL`

**Variable Value**: Your Railway backend URL (e.g., `https://your-backend.railway.app`)

**How to find your Railway backend URL:**
1. Go to Railway Dashboard
2. Open your backend service
3. Go to **Settings** → **Networking**
4. Copy the **Public Domain** (e.g., `https://bulkdm-backend-production.up.railway.app`)

### 3. Redeploy

After adding the environment variable:
1. Go to **Deploys** tab in Netlify
2. Click **Trigger deploy** → **Deploy site**
3. Wait for deployment to complete

### 4. Verify

The extension should now be able to connect to the backend through the frontend proxy routes:
- `/api/proxy/instagram/cookie/verify`
- `/api/proxy/instagram/cookie/connect`

These routes will forward requests to your Railway backend using the `NEXT_PUBLIC_BACKEND_URL` environment variable.

## Current Status

✅ Extension is configured to use proxy routes
✅ Proxy routes are created in Next.js
⚠️ **Need to set `NEXT_PUBLIC_BACKEND_URL` in Netlify**

## Troubleshooting

If the extension still can't connect:

1. **Check Netlify Environment Variables**:
   - Make sure `NEXT_PUBLIC_BACKEND_URL` is set
   - Make sure it's the full URL (including `https://`)
   - No trailing slash

2. **Check Railway Backend**:
   - Make sure backend is running
   - Check Railway logs for errors
   - Verify the backend URL is accessible

3. **Check Browser Console**:
   - Open extension popup
   - Open DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests

4. **Test Proxy Routes Directly**:
   - Visit: `https://bulkdm-saas.netlify.app/api/proxy/instagram/cookie/verify`
   - Should return an error (expected - needs POST with cookies)
   - If you get a 404, the route isn't deployed
   - If you get a 500, check Netlify function logs

