# Development Session Notes - December 15, 2024

## Session Overview
Continued development of the UVA Batten Course Scheduling Tool with focus on student cohort color coding and schedule versioning features.

---

## 1. Student Cohort Color Coding Implementation

### Goal
Add visual differentiation to the schedule display based on which student cohorts each course targets (MPP Year 1, MPP Year 2, BA Year 1-4, Minor, Certificate).

### What Was Implemented

#### A. Color Scheme Design
Created a comprehensive color mapping for all student cohorts:
- **MPP Year 1**: Blue (`bg-blue-100`, `border-blue-400`)
- **MPP Year 2**: Indigo (`bg-indigo-100`, `border-indigo-400`)
- **BA Year 1**: Purple (`bg-purple-100`, `border-purple-400`)
- **BA Year 2**: Pink (`bg-pink-100`, `border-pink-400`)
- **BA Year 3**: Rose (`bg-rose-100`, `border-rose-400`)
- **BA Year 4**: Red (`bg-red-100`, `border-red-400`)
- **Minor Programs**: Green (`bg-green-100`, `border-green-400`)
- **Certificate Programs**: Amber (`bg-amber-100`, `border-amber-400`)

#### B. Code Changes

**File: `components/scheduling/ScheduleViewer.tsx`**
- Added `getCohortColors()` utility function to map course cohorts to Tailwind CSS color classes
- Added `getCohortLabel()` utility function for display-friendly cohort names
- Updated Grid View to show cohort-based colors on course cards
- Updated Faculty Schedule Summary to use cohort colors with left border accents
- Added visual Color Legend at top of schedule for easy reference
- Added cohort labels below course names (e.g., "[MPP Year 1]")

**File: `lib/utils/fileParser.ts`**
- Enhanced `parseTargetPrograms()` function to handle multiple input formats:
  - "MPP Year 1" or "MPP_Postgrad Year 1"
  - "MPP_Accel Year 2"
  - "BA Year 1", "BA Year 2", etc.
  - "Minor", "Cert"
- Added normalization logic to convert various formats to standard type names
- Improved regex patterns to handle underscores, spaces, and case variations

#### C. Debugging Features Added
- Console logging to track cohort data parsing
- Warning messages when cohort keys don't match color mappings
- Helps diagnose CSV data format issues

### Current Status
✅ **Implemented**: All color coding logic and UI components
⚠️ **Testing Required**: Colors not appearing in schedule (see Issue #1 below)

---

## 2. Schedule Versioning Feature - Planning Phase

### Goal
Enable users to save multiple versions of schedules, compare them, and restore previous versions.

### What Was Created
Comprehensive planning document: `SCHEDULE_VERSIONING_PLAN.md`

### Key Features Planned

#### Phase 1: Core Versioning (4-6 hours estimated)
**Must-Have Features:**
- Save current schedule with custom name and description
- Load previously saved version
- List all saved versions with metadata (conflicts, timestamps)
- Delete unwanted versions
- Rename existing versions
- Export specific version to Excel
- Auto-save every 5 minutes
- Storage usage indicator with warnings

**Technical Approach:**
- Use browser LocalStorage for initial implementation (5-10MB limit)
- Store full schedule data including courses, faculty, and configuration
- Version metadata includes conflict counts, timestamps, creator info

**Data Structure:**
```typescript
interface SavedScheduleVersion {
  id: string;
  name: string;
  description?: string;
  schedule: Schedule;
  courses: Course[];
  faculty: Faculty[];
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    totalSections: number;
    errorCount: number;
    warningCount: number;
  };
}
```

#### Phase 2: Version Comparison (6-8 hours estimated)
**Enhanced Features:**
- Side-by-side comparison of two schedule versions
- Highlight differences:
  - Courses that moved time slots (yellow)
  - Faculty reassignments (blue)
  - New/removed sections (green/red)
- Export comparison report
- Duplicate version functionality
- Add tags/labels to versions

#### Phase 3: Backend Migration (Future)
**Advanced Features:**
- Cloud sync across devices
- Backend database storage (PostgreSQL/MongoDB)
- User authentication and accounts
- Collaborative editing with version control
- Approval workflow (draft → review → approved → published)

### UI Components Planned
1. **Save Schedule Dialog**: Modal with name input and description textarea
2. **Versions List Panel**: Sidebar showing all saved versions with actions
3. **Version Comparison View**: Split screen with diff highlighting
4. **Auto-Save Indicator**: Top-right corner showing last save time

### User Workflow Examples

**Example 1: Creating Multiple Scenarios**
1. Generate initial schedule → Save as "Version 1 - Initial"
2. Make adjustments → Save as "Version 2 - More Morning Classes"
3. Try different approach → Save as "Version 3 - Balance Afternoon"
4. Compare V2 vs V3 side-by-side
5. Export preferred version to Excel

**Example 2: Recovering from Mistakes**
1. User makes several changes to current schedule
2. Realizes a mistake was made
3. Opens Versions panel
4. Loads auto-save from 10 minutes ago
5. Continues from that restore point

### Implementation Status
✅ **Completed**: Comprehensive planning document with specs
⏳ **Pending**: Phase 1 implementation (awaiting approval to proceed)

---

## 3. Previous Session Recap (Implemented Earlier)

### Discussion Section Constraints
- LPPL 6050: 75-minute discussions on Tuesday OR Thursday only
- LPPL 2100: 75-minute discussions on Thursday only
- LPPA 7110/7160: Minimize overlap with LPPL 6050 lectures/discussions
- Added `discussionDuration` and `discussionDaysConstraint` fields to Course type
- Auto-detection in file parser for special cases

### Documentation Updates
- Removed "Mixed Elective Sections Preference" (no longer used)
- Removed "Maximum Workload Cap" constraint
- Changed all "Dell" references to "Monroe 120"
- Updated Friday Electives rule for LPPP 7750

### Anti-Clustering for LPPP 7750
- Added scoring system to prevent sections clustering on same day/time
- Penalties: -50 for exact time match, -20 for same day
- Bonus: +30 for LPPP 7750 using new days when 4+ sections exist
- Implemented in `scheduler.ts` via `rankSlotsByDistribution()` method

---

## 4. Known Issues and Next Steps

### Issue #1: Color Coding Not Displaying (PRIORITY)
**Problem**: Schedule shows all courses with same beige/gray background instead of cohort colors

**Possible Causes:**
1. CSV file missing `targetPrograms` column
2. CSV data not in expected format (e.g., missing "Year" keyword)
3. Parser not correctly extracting cohort data
4. Cohort data parsed but keys not matching color map

**Debugging Steps:**
1. Open browser console (F12) after loading schedule
2. Look for console messages showing parsed cohort data
3. Check messages like: `Course LPPA 7110: cohortKey = "...", program = "...", year = ...`
4. If seeing "No cohort data" messages → CSV missing targetPrograms
5. If seeing "No color mapping found" → format mismatch between parser and colors

**Expected CSV Format for targetPrograms Column:**
- ✅ "MPP Year 1"
- ✅ "MPP_Postgrad Year 1"
- ✅ "BA Year 2"
- ✅ "Minor"
- ❌ "MPP 1" (missing "Year" keyword)
- ❌ "First year MPP" (wrong format)

**Next Action Required:**
- User needs to check browser console and share output
- Or share sample row from CSV showing targetPrograms column value

### Issue #2: Schedule Versioning Implementation
**Status**: Planning complete, awaiting approval to implement

**Decision Points:**
1. Should we proceed with Phase 1 implementation?
2. Any changes to feature priorities?
3. Naming preferences for versions (e.g., "Fall 2025 - Draft A" vs "Version 1")?

---

## 5. Questions for Heather

### A. Color Coding Questions

**Q1: CSV Data Format Confirmation**
What format does the `targetPrograms` column currently use in your CSV files?
- Examples: "MPP Year 1", "MPP_Postgrad Year 1", "BA1", "First year BA"?
- Can you share 2-3 example values from actual course data?

**Q2: Multiple Cohort Courses**
Some courses may target multiple cohorts (e.g., "MPP Year 1, BA Year 3").
- Which cohort's color should be displayed? (Current: uses first/primary cohort)
- Should we show multiple color bars or indicators?
- Example: LPPP 7750 Advanced Policy Project might have both MPP2 and BA4 students

**Q3: Color Preferences**
Are the current color assignments acceptable?
- MPP Year 1 = Blue
- MPP Year 2 = Indigo
- BA Year 1-4 = Purple, Pink, Rose, Red gradient
- Minor = Green, Certificate = Amber

Would you prefer different colors or a different scheme?

### B. Schedule Versioning Questions

**Q4: Version Naming Convention**
What naming convention would work best for your workflow?
- Descriptive: "Fall 2025 - Morning Focus", "Spring 2025 - Approved"
- Sequential: "Version 1", "Version 2", "Version 3"
- Date-based: "Schedule 2024-12-15", "Schedule 2024-12-20"
- Hybrid: "Fall 2025 v3 - Final Draft"

**Q5: Version Comparison Priority**
Is side-by-side version comparison a high priority?
- If yes, what specific differences are most important to see?
  - Faculty changes?
  - Time slot changes?
  - Room changes?
  - Conflict count changes?

**Q6: Approval Workflow**
Do schedules need an approval process?
- Draft → Under Review → Approved → Published?
- Or simpler: just save/load with no status tracking?
- Who would be the approvers? (e.g., Dean, Department Chair)

**Q7: Storage and Sharing**
- How long do you need to keep schedule versions? (1 semester, 1 year, forever?)
- Do multiple people need access to the same versions? (If yes, need backend)
- Do you need to share versions with colleagues? (Export/import functionality?)

### C. Discussion Section Scheduling Questions

**Q8: Discussion Day Constraints Verification**
For LPPL 6050 discussions on "Tuesday OR Thursday":
- Does this mean each discussion section picks ONE day (either Tue or Thu)?
- Or do ALL discussions need to be on the same day?
- Can one discussion be Tuesday and another be Thursday?

**Q9: Discussion Time Preferences**
Are there preferred times for discussion sections?
- Morning vs afternoon preference?
- Any times to avoid for discussions?
- Should discussions be immediately before/after lectures?

**Q10: LPPA 7110/7160 Overlap Constraint**
When minimizing overlap with LPPL 6050:
- How strict is this? (Hard constraint or soft warning?)
- Is some overlap acceptable if necessary?
- Should we prioritize avoiding lecture overlap vs discussion overlap?

### D. General Scheduling Questions

**Q11: LPPP 7750 Section Distribution**
You mentioned LPPP 7750 sections were clustering on Tuesdays.
- Is the current anti-clustering working better now?
- Ideal distribution: one section per day M-F? Or just avoid clustering?
- Any sections that should intentionally be at the same time? (e.g., for student choice)

**Q12: Block-Busting Courses**
Are there courses that should always be scheduled outside standard time blocks?
- If yes, which ones and why?
- Specific time preferences for these courses?

**Q13: Faculty Workload**
What's considered a reasonable teaching load?
- Hours per week?
- Number of courses?
- Maximum number of preparations?

**Q14: Room Priorities**
Current priority: Monroe 120 (60) > Rouss Hall (48) > Pavilion VIII (18)
- Is this correct?
- Any rooms that should never be used for certain course types?
- Any courses that require specific rooms beyond what's in notes column?

---

## 6. Files Modified This Session

### Modified Files
1. `components/scheduling/ScheduleViewer.tsx` - Added color coding functions and UI updates
2. `lib/utils/fileParser.ts` - Enhanced parseTargetPrograms() function
3. `COURSE_ASSIGNMENT_CRITERIA.md` - Previous updates (Dell→Monroe, discussion rules)

### New Files
1. `SCHEDULE_VERSIONING_PLAN.md` - Comprehensive planning document (11 sections, ~500 lines)
2. `SESSION_NOTES_2024-12-15.md` - This document

---

## 7. Git Commits Made

### Commit 1: Color Coding Implementation
```
Add color coding for student cohorts in schedule views

- Added getCohortColors() and getCohortLabel() utility functions
- Updated Grid View and Faculty Schedule Summary with cohort colors
- Added Color Legend at top of schedule
- 8 distinct color schemes for different cohorts
```

### Commit 2: Versioning Plan and Parser Fix
```
Add schedule versioning plan and fix color coding parser

- Created comprehensive SCHEDULE_VERSIONING_PLAN.md
- Fixed parseTargetPrograms() to handle MPP_Postgrad/MPP_Accel
- Added console logging for debugging
- Normalized program names to match color keys
```

---

## 8. Build Status

✅ All builds successful
✅ No TypeScript errors
✅ All code pushed to GitHub
✅ Branch: main

---

## 9. Next Session Priorities

### Priority 1 (Must Do)
1. **Debug Color Coding**: Resolve why colors aren't displaying
   - Get console output from user
   - Fix CSV parsing if needed
   - Test with actual course data

### Priority 2 (Should Do)
2. **Implement Schedule Versioning Phase 1**
   - Create storage service (`lib/storage/scheduleVersions.ts`)
   - Build Save Schedule Dialog component
   - Build Versions List Panel component
   - Implement auto-save functionality
   - Add storage usage tracking

### Priority 3 (Nice to Do)
3. **Discussion Section Scheduling Enhancement**
   - Implement scheduler logic to respect `discussionDaysConstraint`
   - Filter time slots based on Tuesday/Thursday requirements
   - Apply `discussionDuration` override (75 vs 50 minutes)

### Priority 4 (Future)
4. **Testing with Real Data**
   - Test with full semester course list
   - Verify all constraints working correctly
   - Performance testing with 50+ courses

---

## 10. Technical Debt / Future Improvements

1. **Remove Console Logging**: Once color coding is working, remove debug logs
2. **IndexedDB Migration**: If LocalStorage limits become issue (>5MB schedules)
3. **Backend API**: For multi-user access and cloud sync
4. **Automated Testing**: Unit tests for parser, scheduler, conflict detection
5. **Performance Optimization**: Lazy loading for large schedules
6. **Accessibility**: Ensure color coding works with color blind users (add patterns/icons)
7. **Export Improvements**: PDF export, calendar integration (.ics files)

---

## 11. Resources and Documentation

### Key Documents
- `SCHEDULE_VERSIONING_PLAN.md` - Complete versioning feature spec
- `COURSE_ASSIGNMENT_CRITERIA.md` - All scheduling rules and constraints
- `TESTING_GUIDE.md` - How to test the application
- `REQUIREMENTS.md` - Original project requirements

### GitHub Repository
- URL: https://github.com/behartless67-a11y/uva-batten-course-scheduler
- Branch: main
- All changes pushed and up-to-date

### Color Legend Reference
```
MPP Year 1    → Blue     (bg-blue-100, border-blue-400)
MPP Year 2    → Indigo   (bg-indigo-100, border-indigo-400)
BA Year 1     → Purple   (bg-purple-100, border-purple-400)
BA Year 2     → Pink     (bg-pink-100, border-pink-400)
BA Year 3     → Rose     (bg-rose-100, border-rose-400)
BA Year 4     → Red      (bg-red-100, border-red-400)
Minor         → Green    (bg-green-100, border-green-400)
Certificate   → Amber    (bg-amber-100, border-amber-400)
```

---

## 12. Session Summary

**Time Investment**: ~2-3 hours
**Lines of Code**: ~400 new, ~50 modified
**Features Added**: 1 complete (color coding UI), 1 planned (versioning)
**Issues Found**: 1 (color coding not displaying - needs debugging)
**Documentation**: 2 new comprehensive documents

**Overall Progress**: Good forward momentum on visual features and planning. Need to resolve CSV data format issue to complete color coding feature. Ready to implement schedule versioning once approved.

---

## End of Session Notes
