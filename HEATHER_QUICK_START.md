# Quick Start Guide for Heather

## What's New!

Your course scheduling tool now has **two major features**:

1. **Main Scheduler** - Generate course schedules from Excel/CSV files
2. **Faculty Submission System** (NEW!) - Let faculty submit their preferences online

## 🌐 Live URLs

**Main App**: https://green-moss-06d7e4210-preview.centralus.3.azurestaticapps.net

### Three Pages Available:

1. **Main Scheduler** - `/` (home page)
   - Upload faculty & course data files
   - Generate schedules automatically
   - View conflicts and export to Excel

2. **Faculty Form** - `/faculty-submit`
   - Share this link with faculty members
   - They fill out their teaching preferences
   - No login required!

3. **Admin Dashboard** - `/admin`
   - View all faculty submissions
   - Search and filter submissions
   - Export to Excel with one click

## 📋 Workflow Options

### Option A: Traditional (File Upload)

1. Collect faculty preferences via email (old way)
2. Create Excel file manually
3. Upload to main scheduler
4. Generate schedule

### Option B: New System (Recommended!)

1. **Send faculty the form link**: `/faculty-submit`
2. **Faculty submit preferences** online (takes 2 minutes!)
3. **You view submissions** at `/admin`
4. **Export to Excel** (one click!)
5. **Upload Excel** to main scheduler
6. **Generate schedule**

## 🎯 Testing the Faculty System

### Test as a Faculty Member:

1. Go to https://green-moss-06d7e4210-preview.centralus.3.azurestaticapps.net/faculty-submit
2. Fill out the form:
   - Your name and email
   - Select preferred teaching days
   - Select days you cannot teach
   - Choose preferred time slots
   - Add any notes
3. Click "Submit Preferences"
4. You'll see a success message!

### Test as Admin (You):

1. Go to https://green-moss-06d7e4210-preview.centralus.3.azurestaticapps.net/admin
2. You'll see your test submission in the table
3. Try the search box
4. Click "Export to Excel" - downloads immediately!
5. Open the Excel file - ready to upload to the scheduler

## 📂 Data Storage (Important!)

**Current Setup**: Uses **mock storage** (testing mode)
- ✅ Perfect for testing right now
- ⚠️ Data is NOT persistent between deployments
- 💡 When you're ready for real use, set up Azure Table Storage

**To Make Data Permanent**:
- See [FACULTY_SUBMISSION_SETUP.md](FACULTY_SUBMISSION_SETUP.md) for Azure setup
- Takes 10 minutes
- Costs ~$0/month (free tier)

## 🚀 Main Scheduler Features

- **Smart Column Matching** - Excel columns can have different names now!
  - "facultyName", "name", "faculty" all work
  - "preferredDays", "preferred_days", "prefers" all work

- **Automatic Room Assignment** - Priority: Dell → Rouss → Pavilion VIII

- **Conflict Detection** - Shows warnings for:
  - Faculty teaching conflicts
  - Student cohort conflicts
  - Room capacity issues
  - Batten Hour violations

- **Export to Excel** - Download the final schedule

## 📖 Documentation

- **Main README**: [README.md](README.md) - Full technical documentation
- **Faculty System Setup**: [FACULTY_SUBMISSION_SETUP.md](FACULTY_SUBMISSION_SETUP.md) - Detailed guide
- **Requirements**: [REQUIREMENTS.md](REQUIREMENTS.md) - Scheduling criteria (update this as needed!)

## 🆘 Quick Troubleshooting

**"Failed to generate schedule"**
- Some courses couldn't be scheduled due to tight constraints
- Check the conflicts panel for details
- Try adjusting time slots or faculty preferences

**"Export to Excel" doesn't download**
- Make sure you have submissions in the table first
- Try a different browser
- Check your Downloads folder

**Faculty submissions disappear**
- Normal in testing mode (mock storage)
- Set up Azure Table Storage for permanence

## 💡 Tips for Faculty

When sharing the form with faculty, tell them:
- Takes 2 minutes to fill out
- Can submit notes for special requests
- Submissions help create a better schedule
- They'll get a confirmation message when done

## 🔄 Updating the App

When we make changes and redeploy:

```bash
cd C:\Users\bh4hb\Desktop\AI_Working\CourseSchedulingTool
npm run build
swa deploy ./out --deployment-token YOUR_TOKEN
```

Same deployment token as before!

## 📧 Share These Links

**For Faculty**:
"Please submit your teaching preferences here: https://green-moss-06d7e4210-preview.centralus.3.azurestaticapps.net/faculty-submit"

**For You**:
- Main scheduler: https://green-moss-06d7e4210-preview.centralus.3.azurestaticapps.net
- Admin dashboard: https://green-moss-06d7e4210-preview.centralus.3.azurestaticapps.net/admin

## ✨ What's Cool About This

1. **No more email back-and-forth** - Faculty submit directly
2. **No manual data entry** - Export to Excel with one click
3. **Always available** - 24/7 online access
4. **Professional look** - UVA Batten branding
5. **Easy to use** - Clear, simple forms
6. **Flexible** - Faculty can add notes for special cases

## 🎓 Next Steps

1. **Test the system** - Submit a few test faculty preferences
2. **Export to Excel** - See how the data looks
3. **Try the main scheduler** - Upload the Excel and generate a schedule
4. **Give feedback** - What works? What needs improvement?
5. **Roll out to faculty** - When you're ready, share the link!

## 📞 Questions?

- Check the documentation files
- GitHub: https://github.com/behartless67-a11y/uva-batten-course-scheduler
- Everything is open source and well-documented!

---

**Have fun testing! Let me know what you think!** 🎉

Built with ❤️ for UVA Batten School
October 2025
