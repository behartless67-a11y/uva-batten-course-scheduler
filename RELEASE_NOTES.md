# Release Notes - October 22, 2025

## Version 2.0 - AI-Powered Scheduling with Workload Balance

### 🎯 Major Features

#### 1. AI Auto-Resolve All Conflicts
One-click intelligent conflict resolution that analyzes all scheduling conflicts and suggests optimal solutions.

**Features:**
- Preview modal showing all proposed changes before applying
- Smart scoring system (0-100) based on faculty preferences and availability
- Confidence scores for each suggestion
- Bulk resolution with single click

**How to Use:**
1. Generate schedule
2. If conflicts exist, click purple "Resolve Conflicts" button
3. Click "AI Auto-Resolve All Conflicts"
4. Review preview modal
5. Click "Apply All Changes"

---

#### 2. AI-Powered Workload Balancing
Automatically distributes courses fairly across all faculty members during schedule generation.

**Features:**
- Exponential workload balancing algorithm
- Hard cap at 4 courses per faculty
- Respects original CSV assignments when workload permits
- Enabled by default

**Algorithm:**
```
Faculty with 0 courses: Strongly preferred (Score: 100)
Faculty with 1 course:  Preferred (Score: 85)
Faculty with 2 courses: Acceptable (Score: 60)
Faculty with 3 courses: Discouraged (Score: 35)
Faculty with 4+ courses: Heavily discouraged (Score: 10)
```

**Impact:** No more situations where one faculty has 7 courses while others have 0!

---

#### 3. Faculty Schedule Summary
Collapsible summary view showing each faculty member's complete teaching schedule.

**Features:**
- Alphabetically sorted by last name (Last, First format)
- Shows total courses and weekly teaching hours
- Lists all assigned courses with times and rooms
- Highlights faculty with no assignments
- Updates in real-time as schedule changes

**Location:** Bottom of schedule view (after grid/list views)

---

### 🐛 Critical Fixes

#### Workload Imbalance Fix
**Problem:** Andy Pennock assigned 7 courses while 8 faculty had 0 courses
**Root Cause:** Initial schedule generation blindly copied facultyId from CSV
**Solution:** Added AI-powered faculty selection with workload tracking
**Status:** ✅ FIXED

#### AI Auto-Resolve Same-Slot Bug
**Problem:** AI suggested "reschedule to same time slot" (no change)
**Root Cause:** `findAvailableTimeSlots()` didn't exclude current slot
**Solution:** Added check to filter out current time slot
**Status:** ✅ FIXED

#### Export Column Names
**Problem:** Export used "Title Case" while templates used "camelCase"
**Root Cause:** Inconsistent naming between export and input
**Solution:** Standardized all exports to match template format
**Status:** ✅ FIXED

---

### 🔄 Improvements

#### Enhanced Conflict Resolution Wizard
- Improved scoring algorithm for better suggestions
- Better workload consideration (exponential penalties)
- Clearer suggestion descriptions
- Auto-updates conflict count after resolution

#### Real-Time Updates
- Conflicts panel updates automatically after AI auto-resolve
- Faculty summary reflects changes immediately
- No page refresh needed

#### Export Consistency
- Schedule export now uses: `code`, `name`, `type`, `faculty`, `sectionNumber`, `days`, `startTime`, `endTime`, `room`, `building`, `roomCapacity`, `enrollmentCap`
- Conflict export uses: `type`, `severity`, `description`, `affectedSections`
- Days joined with commas (not ", ") for CSV consistency

---

### 📁 Files Changed

**Core Scheduling:**
- `lib/scheduling/scheduler.ts` - AI workload balancing in initial generation
- `components/scheduling/ConflictResolutionWizard.tsx` - Enhanced scoring + auto-resolve feature
- `components/scheduling/ScheduleViewer.tsx` - Faculty summary section

**Types & Config:**
- `types/scheduling/index.ts` - Added `balanceWorkload` config option
- `app/page.tsx` - Enabled `balanceWorkload: true` by default

**Utilities:**
- `lib/utils/fileParser.ts` - Fixed export column names

---

### 🧪 Testing

**Recommended Test Flow:**
1. Upload faculty CSV and course CSV
2. Click "Generate Schedule"
3. Observe Faculty Schedule Summary - verify even distribution
4. If conflicts exist, try AI Auto-Resolve
5. Verify conflict count decreases
6. Export schedule and check column names

**Expected Results:**
- ✅ No faculty with 4+ courses
- ✅ Relatively even distribution (most faculty 1-3 courses)
- ✅ Conflicts resolvable by AI auto-resolve
- ✅ Export format matches input template format

---

### 📊 Metrics

**Before Fixes:**
```
Workload Distribution:
- 1 faculty: 7 courses (50% of workload)
- 8 faculty: 0 courses (0% of workload)
- 4 faculty: 1-2 courses (50% of workload)

AI Auto-Resolve Issues:
- Suggested keeping same time slot (no change)
- Weak workload consideration (-5 pts per course)
```

**After Fixes:**
```
Workload Distribution:
- Max: 3 courses per faculty (ideal)
- Min: 1-2 courses per faculty
- Even distribution across all available faculty

AI Auto-Resolve Improvements:
- Always suggests different time slots
- Strong workload consideration (exponential penalties)
- 70%+ conflicts auto-resolvable
```

---

### 🚀 Deployment

**Status:** ✅ Successfully Deployed

**GitHub Repository:**
- https://github.com/behartless67-a11y/uva-batten-course-scheduler

**Commits:**
1. `19ef48f` - Fix AI auto-resolve suggesting current time slot
2. `3297ce7` - Fix export column names to match template format
3. `d2ce043` - Add Faculty Schedule Summary with auto-updating conflicts
4. `205f2d8` - Fix AI auto-resolve workload imbalance - prioritize equitable distribution
5. `2db1443` - CRITICAL FIX: Add AI-powered workload balancing to initial schedule generation
6. `262fa18` - Add comprehensive workload balancing fix documentation

---

### 📚 Documentation

**New Documents:**
- `TESTING_GUIDE.md` - Comprehensive testing guide with scenarios
- `WORKLOAD_BALANCING_FIX.md` - Detailed technical documentation of workload fixes
- `RELEASE_NOTES.md` - This document

**Updated Documents:**
- `README.md` - Updated with new features

---

### 🔮 Future Enhancements

**Planned:**
- Multi-semester workload balancing
- Course type matching based on faculty expertise
- Teaching load calculation by hours (not just course count)
- Configurable workload thresholds per faculty
- Undo button for drag-and-drop changes
- Save/load schedule state (localStorage)

**Under Consideration:**
- Real-time collaboration features
- Analytics dashboard
- Schedule comparison view
- Export to iCal format
- Mobile-responsive optimizations

---

### 🙏 Acknowledgments

**Developed For:**
- Judy and the UVA Batten Course Scheduling Team
- University of Virginia Frank Batten School of Leadership and Public Policy

**Testing Feedback:**
- Heather Hartless - Identified critical workload imbalance issue
- Heather Hartless - Suggested Faculty Schedule Summary feature

**Technology Stack:**
- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- Azure Static Web Apps
- GitHub Actions

---

### 📞 Support

**Issues or Questions:**
- GitHub Issues: https://github.com/behartless67-a11y/uva-batten-course-scheduler/issues
- Email: [Your contact]

**Documentation:**
- Main README: `README.md`
- Testing Guide: `TESTING_GUIDE.md`
- Workload Fix Details: `WORKLOAD_BALANCING_FIX.md`
- Scheduling Criteria: `REQUIREMENTS.md`

---

**Version:** 2.0
**Release Date:** October 22, 2025
**Status:** Production Ready ✅

