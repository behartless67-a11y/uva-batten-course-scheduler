# Quick Start Guide - UVA Batten Course Scheduler

**For:** Judy and course scheduling coordinators
**Time to complete:** 5-10 minutes

---

## Step 1: Start the Application

```bash
cd CourseSchedulingTool
npm run dev
```

Open your browser to: **http://localhost:3001**

---

## Step 2: Prepare Your Data Files

You need two Excel or CSV files:

### Faculty Preferences File
Required columns:
- `facultyName` - Full name
- `email` - Email address (optional)
- `preferredDays` - Comma-separated (e.g., "Monday, Wednesday")
- `cannotTeachDays` - Days they absolutely cannot teach
- `shareParentingWith` - Partner faculty name (optional)

**Download template:** [public/templates/faculty-template.csv](public/templates/faculty-template.csv)

### Course Data File
Required columns:
- `code` - Course code (e.g., "LPPA 7110")
- `name` - Course name
- `type` - Core, Elective, Capstone, or Advanced Project
- `faculty` - Faculty member name
- `enrollmentCap` - Maximum students
- `numberOfSections` - How many sections to create
- `duration` - Class length in minutes (e.g., 80, 150)
- `sessionsPerWeek` - 1, 2, or 3

**Download template:** [public/templates/course-template.csv](public/templates/course-template.csv)

---

## Step 3: Upload Files

1. Click **"Choose File"** under Faculty Preferences
2. Click **"Choose File"** under Course Data
3. Click **"Continue to Configuration"**

---

## Step 4: Configure Settings

Adjust these settings based on your needs:

- **Semester:** Fall or Spring
- **Year:** Academic year
- **Max Electives Per Slot:** Usually 2
- **Allow Friday Electives:** ☐ Usually unchecked (no Friday classes)
- **Enforce Batten Hour:** ☑ Checked (Monday 12:30-1:30)

Click **"Generate Schedule"**

---

## Step 5: Review Results

### Conflict Panel (Expandable)
- **Red (Errors):** Must fix - room conflicts, faculty double-booking
- **Yellow (Warnings):** Should fix - preferences violated, too many electives
- **Blue (Info):** Nice to fix - room capacity issues

### Schedule Views
- **Grid View:** See entire week at a glance
- **List View:** Detailed section information

---

## Step 6: Export

Click **"Export Schedule"** to download Excel file with:
- All scheduled courses
- Room assignments
- Time slots (12-hour format)
- Faculty assignments

Click **"Export Conflicts"** to download conflict report

---

## Common Issues & Solutions

### ❌ "Failed to generate schedule"
- **Try:** Enable Friday electives
- **Try:** Increase max electives per slot to 3
- **Check:** Faculty preferences for conflicts

### ⚠️ Only partial schedule generated (e.g., 17 of 26 sections)
- **Normal:** Some courses may not fit with strict constraints
- **Review:** Conflict panel for specific issues
- **Solution:** Manually assign problem courses after viewing conflicts

### 📁 File upload errors
- **Check:** Column names match template exactly
- **Check:** No special characters in names
- **Use:** Sample templates as reference

---

## Tips for Best Results

1. **Start simple:** Upload minimal data first to test
2. **Iterate:** Generate schedule, review conflicts, adjust preferences, regenerate
3. **Flexibility helps:** Allow some Friday slots if struggling to fit all courses
4. **Check REQUIREMENTS.md:** Review all constraints before uploading data
5. **Export early:** Save your work frequently

---

## Getting Help

- **Documentation:** See [README.md](README.md) for full details
- **Requirements:** See [REQUIREMENTS.md](REQUIREMENTS.md) for all constraints
- **GitHub Issues:** Report bugs at repository issues page
- **Contact:** Judy (Course Scheduling Coordinator)

---

## Next Steps After Generating Schedule

1. ✅ Review all conflicts (especially red errors)
2. ✅ Check room assignments are appropriate
3. ✅ Verify faculty preferences are honored
4. ✅ Export to Excel for distribution
5. ✅ Manually adjust any problem courses
6. ✅ Generate final schedule for registrar

---

## Updating Requirements

When scheduling requirements change:

1. Update **[REQUIREMENTS.md](REQUIREMENTS.md)**
2. Update version number and change log
3. Test with sample data
4. Commit changes to Git
5. Push to GitHub

```bash
git add REQUIREMENTS.md
git commit -m "Updated requirements for Spring 2026"
git push
```

---

**Happy Scheduling! 📅**
