# Rename Netlify Site to BulkDM

## Current Status
- **Current Site Name**: `dmflow-saas`
- **Current URL**: `https://dmflow-saas.netlify.app`
- **Target Site Name**: `bulkdm-saas`
- **Target URL**: `https://bulkdm-saas.netlify.app`

## Code Updates Completed ✅
All code references have been updated:
- ✅ `extension/background.js` - Updated production URL
- ✅ `extension/popup.js` - Updated production URLs
- ✅ `extension/manifest.json` - Updated host permissions

## Manual Steps Required

### Option 1: Rename via Netlify Dashboard (Recommended)

1. **Go to Netlify Dashboard**
   - Visit https://app.netlify.com
   - Navigate to your site: `dmflow-saas`

2. **Access Site Settings**
   - Click on "Site settings" in the left sidebar
   - Or go directly to: https://app.netlify.com/projects/dmflow-saas/configuration/general

3. **Change Site Name**
   - Scroll to "Site information" section
   - Click "Change site name"
   - Enter: `bulkdm-saas`
   - Click "Save"

4. **Verify**
   - Your site will be accessible at: `https://bulkdm-saas.netlify.app`
   - The old URL (`dmflow-saas.netlify.app`) will stop working

### Option 2: Create New Site (If Name is Taken)

If `bulkdm-saas` is already taken, you can:

1. **Create New Site**
   ```bash
   cd frontend
   npx netlify sites:create --name bulkdm-saas
   ```

2. **Link to New Site**
   ```bash
   npx netlify link --name bulkdm-saas
   ```

3. **Deploy to New Site**
   ```bash
   npx netlify deploy --prod
   ```

4. **Update Environment Variables**
   - Copy all environment variables from old site
   - Add them to the new site

5. **Delete Old Site** (Optional)
   - After verifying new site works
   - Delete `dmflow-saas` site from dashboard

## Important Notes

⚠️ **URL Change Impact:**
- The old URL will stop working after renaming
- Update any bookmarks, integrations, or external references
- Update Chrome extension if it references the URL
- Update any OAuth redirect URIs in Supabase/Meta apps

⚠️ **Environment Variables:**
- No changes needed - they're tied to the site, not the name
- Verify all variables are still present after rename

⚠️ **Custom Domain:**
- If you have a custom domain, it will continue to work
- No DNS changes needed

## Verification Checklist

After renaming, verify:
- [ ] Site accessible at new URL: `https://bulkdm-saas.netlify.app`
- [ ] All environment variables present
- [ ] Site builds successfully
- [ ] Authentication works
- [ ] Extension can connect to new URL
- [ ] OAuth redirects work (if configured)

## Rollback

If you need to rollback:
1. Rename site back to `dmflow-saas` in dashboard
2. Or restore from a previous deploy

