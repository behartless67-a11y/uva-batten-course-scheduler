# Session Notes - December 17, 2024

## Team Meeting: Scheduling Requirements Clarification

### Attendees
- Full Batten scheduling team

### Questions Asked and Answers Received

#### 1. Time Slot Preferences / Protected Times
**Q:** Are there specific time slots to prioritize or avoid? Protected times?
**A:** Maximize time in Batten rooms (non-UREG rooms); schedule based on faculty preference.

#### 2. Back-to-Back Classes
**Q:** Should we prevent back-to-back classes for faculty?
**A:** Based on faculty preference (to be addressed later).

#### 3. Course Conflicts / Cohorts
**Q:** Beyond faculty conflicts, are there student cohort conflicts?
**A:** Yes - cohorts cannot overlap with other cohort classes.

**Cohort Groups Identified:**
| Cohort ID | Description |
|-----------|-------------|
| MPP1 | MPP Year 1 |
| MPP2 | MPP Year 2 |
| BA1 | BA Year 1 |
| BA2 | BA Year 2 |
| BA3 | BA Year 3 |
| BA4 | BA Year 4 |
| Minor | Minor students |
| Certificate | Certificate students |
| Accel1 | Accelerated Year 1 |
| Accel2 | Accelerated Year 2 |
| G/U Electives | Graduate/Undergrad Electives |

#### 4. Room Capacities
**Q:** Do courses have enrollment caps to match room sizes?
**A:** Yes - enrollment numbers will come in course data upload. Match room size to enrollment.

#### 5. Room Preferences
**Q:** Do specific courses/faculty have room requirements?
**A:** A couple do, but will be addressed via preferences later.

#### 6. Pavilion VIII Usage
**Q:** When should Pavilion VIII be used?
**A:** 2.5 hour classes with 18 or fewer students should be prioritized for Pavilion VIII.

#### 7. Teaching Loads
**Q:** Is there a max courses per faculty to validate?
**A:** Faculty do not get to choose their course load (assigned by department).

#### 8. Cross-Listed / Co-Taught Courses
**Q:** How to handle courses with multiple instructors?
**A:** There will be a primary instructor indicated - no option for multiple instructors.

#### 9. Discussion Sections
**Q:** Are there other course types with special needs?
**A:** No (already handled LPPL 6050 and LPPL 2100 discussions).

#### 10. Conflict Resolution Priority
**Q:** When scheduler can't satisfy all preferences, what's the priority?
**A:** Core classes get priority. (Long sticky question - more follow-ups needed later.)

#### 11. Manual Overrides
**Q:** Do you need ability to lock assignments?
**A:** Yes - on the calendar view. Will implement.

#### 12. Export Format
**Q:** Is current Excel export meeting needs?
**A:** Will address later.

### Key Clarifications

#### Multi-Cohort Courses = ERROR
- **BA3,BA4** in a single course = **ERROR** (impossible)
- A course can only belong to ONE cohort

#### Cohort Conflict Rules
- **Same cohort core classes** cannot overlap (e.g., two MPP1 classes at same time = CONFLICT)
- **Different cohorts** can overlap (MPP1 + BA3 at same time = OK)
- **Electives** can conflict with each other and with core classes (since there are multiple sections)

#### Room Updates
- **Dell has been replaced by Monroe** (capacity 68)
- **Monroe and Rouss are both high priority** rooms

#### Core vs Elective Detection
- Anything with a cohort value = **Core class**
- No cohort or "G/U Electives" = **Elective**

---

## Code Changes Implemented

### 1. New Cohort System (`types/scheduling/index.ts`)
Added `CohortId` type with all valid cohort identifiers:
```typescript
export type CohortId =
  | 'MPP1' | 'MPP2'
  | 'BA1' | 'BA2' | 'BA3' | 'BA4'
  | 'Minor' | 'Certificate'
  | 'Accel1' | 'Accel2'
  | 'G/U Electives'
  | null;
```

Added `cohort` field to `Course` interface.

### 2. File Parser Updates (`lib/utils/fileParser.ts`)
- Added `parseCohort()` function to read cohort column from spreadsheet
- Validates single cohort per course
- **Flags error** if multi-cohort detected (e.g., "BA3,BA4")
- Auto-detects core vs elective based on cohort presence
- Supports multiple column name formats (cohort, studentCohort, targetCohort)

### 3. Conflict Detection (`lib/scheduling/conflictDetection.ts`)
Updated `detectStudentCohortOverlaps()` to use new cohort-based logic:
- Same cohort = CONFLICT
- Different cohorts = OK
- Electives (null or G/U Electives) never conflict

Added `hasCohortConflict()` helper function.

### 4. Scheduler Updates (`lib/scheduling/scheduler.ts`)
Updated `violatesHardConstraints()` to check cohort conflicts:
- Courses with same cohort cannot be scheduled at overlapping times
- Electives bypass this check

### 5. Room Assignment (`lib/scheduling/roomAssignment.ts`)
Updated room priority logic:
- **Priority 1:** Explicit preferred room (if specified)
- **Priority 2:** 2.5hr (150min) classes with ≤18 students → Pavilion VIII
- **Priority 3:** Core courses → Monroe 120 or Rouss 403
- **Priority 4:** Capstones → Pavilion VIII
- **Priority 5:** Small courses (≤18) → Pavilion VIII
- **Priority 6:** Medium courses (≤48) → Rouss 403
- **Priority 7:** Large courses (≤68) → Monroe 120
- **Default:** UREG (only as fallback)

---

## Git Commit

**Commit:** `0875032`
**Message:** Add cohort-based scheduling conflicts and room priority updates

**Files Changed:**
- `types/scheduling/index.ts` - Added CohortId type and cohort field
- `lib/utils/fileParser.ts` - Added cohort parsing and validation
- `lib/scheduling/conflictDetection.ts` - Updated cohort conflict logic
- `lib/scheduling/scheduler.ts` - Updated hard constraint checking
- `lib/scheduling/roomAssignment.ts` - Updated room priority rules

---

## Spreadsheet Column Requirements

The course data spreadsheet should now include a `cohort` column with values like:
- `MPP1`, `MPP2`
- `BA1`, `BA2`, `BA3`, `BA4`
- `Minor`, `Certificate`
- `Accel1`, `Accel2`
- `G/U Electives` (or leave blank for electives)

---

## Follow-Up Items for Future Sessions

1. **Conflict resolution priority** - Need detailed rules for when scheduler can't satisfy all constraints
2. **Manual lock/override on calendar** - Implement ability to lock specific assignments
3. **Room preferences** - Will come via faculty preference form
4. **Export format enhancements** - Address later
5. **Accelerated cohort sequencing** - Accel1/Accel2 have specific class sequences to elaborate
