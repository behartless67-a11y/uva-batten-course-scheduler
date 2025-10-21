# Azure Static Web Apps Deployment Guide

## Quick Steps for Heather to Test

### Option 1: Deploy via Azure Portal (Recommended)

1. **Go to Azure Portal**: https://portal.azure.com

2. **Create Static Web App**:
   - Click "Create a resource"
   - Search for "Static Web App"
   - Click "Create"

3. **Configuration**:
   - **Subscription**: Your Azure subscription
   - **Resource Group**: Create new or use existing
   - **Name**: `uva-batten-scheduler` (or your choice)
   - **Plan type**: Free (perfect for testing)
   - **Region**: East US 2 (or closest to you)
   - **Deployment source**: GitHub
   - **GitHub account**: Connect to `behartless67-a11y/uva-batten-course-scheduler`
   - **Branch**: `main`
   - **Build Details**:
     - Build Presets: Custom
     - App location: `/`
     - Output location: `out`

4. **Deploy**:
   - Click "Review + Create"
   - Click "Create"
   - Wait 2-3 minutes for deployment

5. **Get Your URL**:
   - Once deployed, go to your Static Web App resource
   - Find the URL (looks like: `https://uva-batten-scheduler.azurestaticapps.net`)
   - Share this URL with Heather!

### Option 2: Manual Upload (Fastest for Testing)

1. **Install Azure Static Web Apps CLI**:
   ```bash
   npm install -g @azure/static-web-apps-cli
   ```

2. **Create Static Web App in Azure Portal** (steps 1-3 above, but skip GitHub connection)

3. **Get Deployment Token**:
   - Go to your Static Web App in Azure Portal
   - Click "Manage deployment token"
   - Copy the token

4. **Deploy from Command Line**:
   ```bash
   cd C:\Users\bh4hb\Desktop\AI_Working\CourseSchedulingTool
   npm run build
   swa deploy ./out --deployment-token <YOUR_DEPLOYMENT_TOKEN>
   ```

5. **Access Your Site**:
   - URL will be shown after deployment completes
   - Share with Heather!

## What Works in Deployed Version

✅ File upload (Faculty & Course data)
✅ Excel/CSV parsing with smart column matching
✅ Schedule generation (CSP algorithm + greedy fallback)
✅ Conflict detection and visualization
✅ Grid and list schedule views
✅ Export to Excel
✅ Drag-and-drop schedule editing
✅ All client-side functionality

## What Doesn't Work (and why)

❌ **API Routes** - Removed for static export
  - Not needed for current functionality
  - Everything runs client-side
  - Can add Azure Functions later if needed

## Automatic Updates

If you used Option 1 (GitHub deployment):
- Every push to `main` branch automatically rebuilds and redeploys
- Changes go live in 2-3 minutes
- No manual steps needed

## Testing Checklist for Heather

- [ ] Upload faculty preferences file
- [ ] Upload course data file
- [ ] Click "Continue to Configuration"
- [ ] Review time slots and constraints
- [ ] Click "Generate Schedule"
- [ ] Check schedule grid view
- [ ] Check schedule list view
- [ ] Review conflicts panel
- [ ] Export schedule to Excel
- [ ] Try drag-and-drop to fix conflicts

## Cost

**Free tier includes**:
- 100 GB bandwidth per month
- 0.5 GB storage
- Unlimited custom domains
- Free SSL certificates
- Perfect for testing and production use at Batten School scale

## Support

For issues or questions:
- GitHub Issues: https://github.com/behartless67-a11y/uva-batten-course-scheduler/issues
- Azure Support: https://portal.azure.com

## Next Steps After Testing

1. Get feedback from Heather
2. Iterate on requirements (update REQUIREMENTS.md)
3. Add features based on real-world usage
4. Consider adding backend API if needed for:
   - Saving schedules to database
   - Multi-user access
   - Historical schedule data
   - Advanced analytics

---

**Last Updated**: October 21, 2025
**Version**: 1.0
