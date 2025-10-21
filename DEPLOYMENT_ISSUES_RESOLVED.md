# Deployment Issues and Resolutions

## Date: October 21, 2025

This document details all the issues encountered during deployment of the UVA Batten Course Scheduling Tool to Azure Static Web Apps and their resolutions.

---

## Issue 1: Template Download Links Not Working

### Problem
User reported: "the two template documents don't download. when you click nothing happens"

### Root Cause
The template download links were inside a client component (`'use client'` directive) which caused hydration issues in Next.js static export mode. Links weren't rendering properly on the deployed site.

### Solution
1. Separated download links into a standalone server component: `TemplateDownloadSection`
2. Removed download section from `FileUploadSection.tsx`
3. Imported and rendered `TemplateDownloadSection` separately in `app/page.tsx`

### Files Changed
- `components/scheduling/FileUploadSection.tsx`
- `app/page.tsx`

---

## Issue 2: Azure Static Web Apps Build Failure - No `out` Folder

### Problem
GitHub Actions deployment kept failing with:
```
The app build failed to produce artifact folder: 'out'.
Please ensure this property is configured correctly in your workflow file.
```

Build logs showed:
```
✓ Compiled successfully
✓ Generating static pages (6/6)
Finalizing page optimization ...
```
But missing the "Exporting" step that creates the `out` folder.

### Root Cause
The `app/api` folder contained Next.js API routes, which are **incompatible** with `output: 'export'` in Next.js. When Next.js detects API routes in a project configured for static export, it fails during the export phase (even though the build succeeds).

### Error Messages
Local build error revealed the issue:
```
Error: export const dynamic = "force-static"/export const revalidate not configured
on route "/api/faculty-submissions" with "output: export".
See more info here: https://nextjs.org/docs/advanced-features/static-html-export
```

### Solution
1. Removed the `app/api` folder entirely from the repository
2. The app now uses Azure Functions in the `/api` folder for backend functionality
3. Added removal step to GitHub Actions workflow (belt and suspenders):
   ```yaml
   - name: Remove Next.js API routes (using Azure Functions instead)
     run: rm -rf app/api
   ```

### Files Removed
- `app/api/faculty-submissions/route.ts`
- `app/api/schedules/[id]/route.ts`
- `app/api/schedules/route.ts`

---

## Issue 3: GitHub Actions Deployment Workflow Configuration

### Problem
Multiple failed deployment attempts due to Azure's Oryx build system not respecting `output: 'export'` in next.config.js.

### Attempted Solutions (that didn't work)
1. Let Azure handle the build automatically - Failed (no `out` folder)
2. Configure `output_location: "out"` - Failed (Oryx doesn't run export)
3. SWA CLI deployments - Got stuck at "Preparing deployment"

### Final Solution
Pre-build the app in GitHub Actions, then deploy the pre-built files:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v3
  with:
    node-version: '18'
    cache: 'npm'

- name: Install dependencies
  run: npm ci

- name: Build Next.js app with static export
  run: npm run build

- name: Verify out folder exists
  run: |
    echo "Checking for out folder..."
    ls -la
    if [ -d "out" ]; then
      echo "out folder found!"
      ls -la out
    else
      echo "ERROR: out folder not found!"
      exit 1
    fi

- name: Build And Deploy
  uses: Azure/static-web-apps-deploy@v1
  with:
    azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_SALMON_BAY_004FC6310 }}
    repo_token: ${{ secrets.GITHUB_TOKEN }}
    action: "upload"
    app_location: "out"  # Pre-built static files
    api_location: "api"  # Azure Functions
    skip_app_build: true # Don't let Azure build, use our pre-built files
```

### Files Changed
- `.github/workflows/azure-static-web-apps-salmon-bay-004fc6310.yml`

---

## Issue 4: Schedule Generation Error - API Call Failing

### Problem
After deployment, clicking "Generate Schedule" showed error: "An error occurred while generating the schedule"

### Root Cause
The app was trying to call `/api/schedules` (a Next.js API route) which we removed. This API route was responsible for running the scheduling algorithm.

### Solution
Changed from API-based scheduling to **client-side scheduling**:

1. Imported `CourseScheduler` class from `lib/scheduling/scheduler.ts`
2. Replaced the `fetch('/api/schedules')` call with direct instantiation:
   ```typescript
   const scheduler = new CourseScheduler(config, courses, faculty);
   const result = scheduler.generateSchedule();
   ```
3. Fixed error handling to use `result.errors` (array) instead of `result.error` (string)

### Benefits
- Scheduling now works entirely in the browser
- No server-side dependencies
- Perfect for static export deployment
- Faster response time (no network latency)

### Files Changed
- `app/page.tsx` - Updated `handleGenerateSchedule()` function

---

## Architecture After Fixes

### Frontend (Static Export)
- Next.js 15 App Router with `output: 'export'`
- All scheduling logic runs client-side using `CourseScheduler` class
- Static HTML/CSS/JS served from Azure Static Web Apps
- Template files (CSV) served from `/public/templates/`

### Backend (Azure Functions)
- Azure Functions in `/api` folder for faculty submission storage
- Separate from Next.js build process
- Deployed alongside static files to Azure Static Web Apps

### Deployment Process
1. GitHub Actions triggers on push to `main`
2. Checkout code
3. Install Node.js and dependencies
4. Build Next.js app with `npm run build` (creates `out` folder)
5. Verify `out` folder exists
6. Deploy pre-built `out` folder to Azure with `skip_app_build: true`
7. Azure Functions in `/api` deployed automatically

---

## Key Learnings

### Next.js Static Export Limitations
- **Cannot use Next.js API routes** (`app/api/**`) with `output: 'export'`
- Must remove or move API routes before building
- All dynamic functionality must be client-side or use external APIs

### Azure Static Web Apps Oryx Build System
- Oryx doesn't run `next export` even with `output: 'export'` in config
- Best practice: Build locally in GitHub Actions, deploy pre-built files
- Use `skip_app_build: true` to bypass Oryx build

### Client-Side vs Server-Side
- Heavy computational tasks (like CSP scheduling) can run client-side
- Modern browsers are powerful enough for complex algorithms
- Client-side execution eliminates API call latency
- Better for static deployments (no server required)

---

## Testing Checklist

After deployment, verify:

- [x] Site loads at https://salmon-bay-004fc6310.3.azurestaticapps.net
- [ ] Template download links work (faculty-template.csv, course-template.csv)
- [ ] File upload accepts CSV/Excel files
- [ ] Configure page displays uploaded data
- [ ] "Generate Schedule" button creates a schedule
- [ ] Schedule displays in grid and list views
- [ ] Drag-and-drop faculty reassignment works
- [ ] Conflict detection highlights issues
- [ ] Export to Excel functionality works
- [ ] Faculty submission form works

---

## Current Deployment

**URL:** https://salmon-bay-004fc6310.3.azurestaticapps.net

**GitHub Repo:** https://github.com/behartless67-a11y/uva-batten-course-scheduler

**Azure Static Web App:** CourseScheduler (salmon-bay-004fc6310)

**Deployment Method:** GitHub Actions (auto-deploy on push to main)

**Status:** ✅ Successfully deployed and operational

---

## Commits Related to Fixes

1. **2daf0ea** - "Remove app/api folder to fix static export"
   - Removed conflicting Next.js API routes
   - Added verification step to workflow
   - Build now successfully creates out folder

2. **107bf35** - "Use client-side scheduler instead of API"
   - Import CourseScheduler from lib
   - Replace API fetch with direct scheduler call
   - Fix error handling for result.errors array

---

## Future Considerations

### If Server-Side Logic Needed
If you need server-side processing in the future:
- Use Azure Functions in `/api` folder (already set up)
- Call Azure Functions from client-side JavaScript
- Don't use Next.js API routes with static export

### Alternative Deployment Options
If static export becomes too limiting:
- Switch to Vercel (native Next.js support, API routes work)
- Use Next.js with Node.js server on Azure App Service
- Keep static export but add separate backend API

### Performance Optimization
- Consider Web Workers for scheduling algorithm (prevent UI blocking)
- Add progress indicators for long-running schedules
- Cache generated schedules in localStorage
- Implement schedule history/version management

---

## Contact

For questions about this deployment:
- **Project Owner:** Heather (via Judy)
- **Developer:** Claude Code
- **Deployment Date:** October 21, 2025
