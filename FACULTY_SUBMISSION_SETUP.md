# Faculty Submission System Setup Guide

## Overview

The Faculty Submission System allows faculty members to submit their teaching preferences online, and gives Heather an admin dashboard to view, manage, and export these submissions to Excel for use in the scheduling tool.

## Architecture

### Components

1. **Faculty Submission Form** (`/faculty-submit`)
   - Public-facing form for faculty to submit preferences
   - Fields: Name, email, preferred days, cannot teach days, time preferences, parenting responsibilities, notes
   - Real-time validation
   - Success confirmation

2. **Admin Dashboard** (`/admin`)
   - View all faculty submissions in a table
   - Search/filter functionality
   - Export to Excel with one click
   - Delete submissions
   - Refresh data

3. **API Routes** (`/api/faculty-submissions`)
   - POST: Submit new preferences
   - GET: Fetch all submissions (for admin)
   - DELETE: Remove a submission (for admin)

4. **Storage Options**:
   - **Local Development**: Mock in-memory storage (automatic fallback)
   - **Production**: Azure Table Storage (when configured)

## Local Testing (No Azure Setup Required)

The system automatically uses **mock storage** for local development, so you can test immediately:

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open the app: http://localhost:3001

3. Test the workflow:
   - Click **"Faculty Form"** in the header
   - Fill out the form and submit
   - Click **"Admin Dashboard"** in the header
   - See your submission in the table
   - Click **"Export to Excel"** to download

### Mock Storage Features

- Stores submissions in memory during the dev session
- Persists across page refreshes (until you restart the server)
- Perfect for development and testing
- No configuration needed

## Azure Table Storage Setup (For Production)

When you're ready to deploy, set up Azure Table Storage for persistent data:

### Step 1: Create Azure Storage Account

1. Go to [Azure Portal](https://portal.azure.com)
2. Click **"Create a resource"** → Search **"Storage account"** → **"Create"**
3. Fill in:
   - **Name**: `uvabattenstorage` (or your choice - must be globally unique)
   - **Location**: East US 2 (or closest to you)
   - **Performance**: Standard
   - **Redundancy**: LRS (cheapest option)
4. Click **"Review + Create"** → **"Create"**

### Step 2: Get Access Credentials

1. Go to your new Storage Account
2. In the left menu, click **"Access keys"**
3. Copy:
   - **Storage account name**: (e.g., `uvabattenstorage`)
   - **Key**: Click "Show" and copy **key1**

### Step 3: Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
AZURE_STORAGE_ACCOUNT_NAME=uvabattenstorage
AZURE_STORAGE_ACCOUNT_KEY=your-key-here
```

**Important**: Never commit `.env.local` to git! It's already in `.gitignore`.

### Step 4: Deploy to Azure

For Azure Static Web Apps deployment, add these environment variables in the portal:

1. Go to your Static Web App resource
2. Click **"Configuration"** in the left menu
3. Click **"+ Add"** and add:
   - Name: `AZURE_STORAGE_ACCOUNT_NAME`, Value: `uvabattenstorage`
   - Name: `AZURE_STORAGE_ACCOUNT_KEY`, Value: (your key)
4. Click **"Save"**

## Cost

**Azure Table Storage Pricing**:
- First 100,000 transactions/month: **FREE**
- $0.05 per 10,000 transactions after that
- $0.05/GB storage per month

**Estimated cost for Batten School**: **$0-1/month** (essentially free)

## Faculty Workflow

1. **Heather sends faculty the link**: `https://your-app-url/faculty-submit`
2. **Faculty fill out the form** with their preferences
3. **Faculty submit** - they see a success message
4. **Heather views submissions** at `/admin`
5. **Heather exports to Excel** - downloads in correct format
6. **Heather uploads Excel** to main scheduler tool

## Admin Dashboard Features

### View Submissions
- See all faculty submissions in a sortable table
- Real-time data (click "Refresh" for latest)
- Shows: Name, email, preferred days, cannot teach days, time preferences, submission date

### Search/Filter
- Search by faculty name or email
- Filters results in real-time

### Export to Excel
- One-click download
- Generates file: `faculty-preferences-YYYY-MM-DD.xlsx`
- Columns match the format expected by the scheduler
- Opens directly in Excel

### Delete Submissions
- Remove outdated or duplicate submissions
- Confirmation dialog prevents accidental deletions

## Integration with Scheduler

The exported Excel file has these columns:
- Faculty Name
- Email
- Preferred Days (comma-separated)
- Cannot Teach Days (comma-separated)
- Preferred Time Slots
- Share Parenting With
- Additional Notes
- Submitted At

This format can be directly uploaded to the main scheduling tool.

## Navigation

The main scheduler page now has two buttons in the header:
- **"Faculty Form"** → Takes faculty to submission form
- **"Admin Dashboard"** → Takes Heather to admin view

## Testing Checklist

- [ ] Submit a faculty preference form
- [ ] View the submission in the admin dashboard
- [ ] Search for a submission
- [ ] Export to Excel
- [ ] Open the Excel file and verify columns
- [ ] Delete a submission
- [ ] Submit multiple faculty preferences
- [ ] Export again with multiple submissions

## Troubleshooting

### "Azure Storage not configured" error
- **Solution**: You're seeing this in production. Add environment variables to Azure Static Web App settings (see Step 4 above)
- **During development**: This is normal - mock storage will be used automatically

### Submissions disappear after restart
- **If using mock storage**: This is expected behavior. Mock storage is in-memory only.
- **Solution**: Set up Azure Table Storage for persistence (see production setup above)

### Export to Excel doesn't work
- **Check**: Make sure you have submissions in the table first
- **Browser**: Try a different browser if download doesn't start
- **File location**: Check your Downloads folder

## Future Enhancements

Potential features to add:
1. **Email notifications** - Send confirmation emails to faculty when they submit
2. **Edit submissions** - Allow faculty to update their preferences
3. **Deadline management** - Set cutoff dates for submissions
4. **Reminders** - Email faculty who haven't submitted yet
5. **Import submissions** - Bulk import from previous semester

## Support

For questions or issues:
- GitHub: https://github.com/behartless67-a11y/uva-batten-course-scheduler/issues
- Documentation: See README.md for main scheduler docs

---

**Last Updated**: October 21, 2025
**Version**: 1.0
