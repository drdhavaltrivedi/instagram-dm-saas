# 🔧 Railway Build Error Fix

## Error: "npm: command not found"

This happens when Railway doesn't detect Node.js properly. Here's how to fix it:

## ✅ Solution 1: Verify Root Directory (MOST IMPORTANT)

1. **Go to Railway Dashboard**
   - Open your service
   - Click **Settings** tab
   - Scroll to **"Root Directory"**
   - **MUST be set to**: `backend`
   - Click **Save**

2. **Redeploy**
   - Railway will rebuild automatically
   - Or click **"Redeploy"** button

## ✅ Solution 2: Check Build Settings

1. **In Railway Settings → Build & Deploy**
2. **Build Command**: Should be empty (auto-detects) OR:
   ```
   npm install && npm run build
   ```
3. **Start Command**: Should be empty (auto-detects) OR:
   ```
   npm run start:prod
   ```

## ✅ Solution 3: Use Nixpacks Configuration

I've created `backend/nixpacks.toml` which should help Railway detect Node.js.

If it still doesn't work:

1. **Delete the service** in Railway
2. **Create a new service**
3. **When adding the repo**, immediately set:
   - **Root Directory**: `backend`
4. **Then add environment variables**
5. **Deploy**

## ✅ Solution 4: Manual Dockerfile (If needed)

If Nixpacks still fails, create `backend/Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build
RUN npm run build

# Expose port
EXPOSE 3001

# Start
CMD ["npm", "run", "start:prod"]
```

Then in Railway:
- **Build Command**: Leave empty
- **Start Command**: Leave empty
- Railway will use the Dockerfile

## 🔍 Troubleshooting Steps

1. **Check Root Directory**
   - Must be `backend` (not root)
   - This is the #1 cause of this error

2. **Check Build Logs**
   - Look for Node.js detection
   - Should see "Detected Node.js" message

3. **Verify package.json exists**
   - Should be at `backend/package.json`
   - Railway reads this to detect Node.js

4. **Check Environment Variables**
   - Make sure all required vars are set
   - Especially `NODE_ENV=production`

## 📝 Quick Checklist

- [ ] Root Directory = `backend` ✅
- [ ] `backend/package.json` exists ✅
- [ ] `backend/nixpacks.toml` exists ✅
- [ ] Environment variables set ✅
- [ ] Service is redeployed ✅

## 🆘 Still Not Working?

1. **Delete and recreate the service**
2. **Set Root Directory FIRST** (before anything else)
3. **Then add environment variables**
4. **Then deploy**

The Root Directory setting is CRITICAL - Railway must know to look in the `backend` folder!

