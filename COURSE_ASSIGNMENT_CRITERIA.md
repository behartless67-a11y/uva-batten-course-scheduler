# Course Assignment Criteria - UVA Batten School

**Last Updated:** November 11, 2025
**Maintained By:** Heather Hartless and Team
**Purpose:** Living document outlining all rules, constraints, and criteria for course scheduling

---

## Table of Contents

1. [Hard Constraints (Must Be Satisfied)](#hard-constraints-must-be-satisfied)
2. [Soft Constraints (Preferences & Optimization)](#soft-constraints-preferences--optimization)
3. [Faculty Assignment Rules](#faculty-assignment-rules)
4. [Time Slot Allocation Rules](#time-slot-allocation-rules)
5. [Room Assignment Rules](#room-assignment-rules)
6. [Student Cohort Considerations](#student-cohort-considerations)
7. [Workload Balancing Criteria](#workload-balancing-criteria)
8. [Conflict Resolution Priorities](#conflict-resolution-priorities)
9. [Course-Specific Rules](#course-specific-rules)
10. [Multi-Factor Weighted Scoring System](#multi-factor-weighted-scoring-system)

---

## Hard Constraints (Must Be Satisfied)

These constraints **CANNOT** be violated. The scheduler will reject any schedule that breaks these rules.

### 1. Faculty Availability Constraints

**Rule:** Faculty cannot be assigned to courses on days they've marked as "cannot teach"

**Source Data:** `cannotTeachDays` field in faculty CSV

**Example:**
- Sebastian Tello-Trillo: Cannot teach Friday
- System MUST NOT assign him any Friday classes

**Implementation:** Checked in `scheduler.ts` conflict detection

---

### 2. Parenting Schedule Conflicts

**Rule:** Faculty who share parenting responsibilities cannot both teach on the same days

**Source Data:** `shareParentingWith` field in faculty CSV

**Example:**
- Eileen Chou shares parenting with Noah Myung
- If Eileen teaches Monday/Wednesday, Noah MUST teach Tuesday/Thursday
- They cannot both teach on the same day

**Couples:**
- Eileen Chou ↔ Noah Myung
- Ben Converse ↔ Sophie Trawalter
- Paul Martin ↔ Michelle Claiborne

**Implementation:** Validated during schedule generation

---

### 3. Batten Hour Protection (Tuesday 12:30-1:45pm)

**Rule:** NO elective courses can be scheduled during Batten Hour

**Applies To:** Only elective courses (Core and Capstone courses CAN use this slot)

**Time Block:** Tuesday 12:30-1:45pm

**Rationale:** Reserved time for community events, speaker series, and student activities

**Implementation:** `battenHourEnabled` config flag in scheduler

**User Control:** Can be disabled via config if needed for special semesters

---

### 4. Faculty Double-Booking Prevention

**Rule:** No faculty member can be assigned to teach two sections at the same time

**Checked For:**
- Overlapping lecture times
- Overlapping discussion section times
- Same faculty teaching lecture and discussion simultaneously

**Implementation:** Real-time conflict detection in scheduler

---

### 5. Room Capacity Requirements

**Rule:** Room capacity must be ≥ enrollment cap for assigned section

**Source Data:**
- Course `enrollmentCap` from course CSV
- Room capacities from system configuration

**Example:**
- LPPP 2200 has 240 students → Requires large lecture hall
- Cannot be assigned to a 30-seat classroom

**Implementation:** Room assignment algorithm checks capacity before assignment

---

### 6. Block-Busting Room Requirements

**Rule:** Classes scheduled outside standard university scheduling blocks MUST use designated block-busting rooms

**What is Block-Busting?**

"Block-busting" means scheduling outside the standard university time blocks:

**Standard Blocks (NOT block-busting):**
- **Monday/Wednesday/Friday classes:** Must be 50 minutes long AND start before 3:00 PM
- **Tuesday/Thursday classes:** Must be 75 minutes long AND start before 2:30 PM

**Block-Busting Examples:**
- 80-minute Monday/Wednesday class (violates 50-min requirement)
- Tuesday/Thursday class starting at 2:30 PM or later (violates time cutoff)
- Any class that doesn't fit the standard university blocks

**Required Block-Busting Rooms:**

Block-busting classes MUST be assigned to ONE of these rooms:
- **Rouss 403** (capacity: 48 students)
- **Monroe 120** (capacity: 60 students)
- **Pavilion VIII Block-Bust** (capacity: 18 students)

**Rationale:** University scheduling policy requires special room reservations for non-standard time blocks

**Examples:**

✅ **Valid:**
- 80-minute MW class in Rouss 403
- TR class starting at 3:00 PM in Monroe 120

❌ **Invalid (will generate ERROR conflict):**
- 80-minute MW class in Monroe 120 (standard room)
- TR class starting at 3:00 PM in Rouss Hall (standard room)

**Implementation:**
- Detection: `isBlockBusting()` in `lib/utils/blockBusting.ts`
- Room assignment: `assignRoomWithBlockBusting()` in `lib/scheduling/roomAssignment.ts`
- Conflict detection: `detectBlockBustingViolations()` in `lib/scheduling/conflictDetection.ts`

**Conflict Severity:**
- ERROR: Block-busting course not in block-busting room
- WARNING: Standard course assigned to block-busting room (reserves room unnecessarily)

---

### 7. Earliest Start Time

**Rule:** No classes can start before 9:30 AM

**Rationale:** Accommodates student schedules and faculty preferences

**Implementation:** All time slots in `lib/scheduling/timeSlots.ts` start at 9:30 AM or later

**Example:**
- ✅ Valid: Class at 9:30 AM
- ❌ Invalid: Class at 8:30 AM (slot removed from system)

---

### 8. Student Cohort Schedule Protection

**Rule:** Required courses for the same student cohort (program + year) cannot overlap

**Cohorts Tracked:**
- MPP Year 1 (MPP_Postgrad first-year students)
- MPP Year 2 (MPP_Postgrad second-year students)
- BA Year 1, 2, 3, 4 (Undergraduate students by year)
- Minor students
- Certificate students

**Source Data:** `targetPrograms` field in course CSV (e.g., "MPP Year 1", "BA Year 3")

**Examples:**

❌ **Invalid:**
- LPPA 7110 (MPP Year 1) scheduled Monday 9:30-10:50
- LPPA 7160 (MPP Year 1) scheduled Monday 9:30-10:50
- → These overlap, preventing MPP Year 1 students from taking both required courses

✅ **Valid:**
- LPPA 7110 (MPP Year 1) scheduled Monday 9:30-10:50
- LPPA 7160 (MPP Year 1) scheduled Tuesday 9:30-10:50
- → Different times allow all MPP Year 1 students to enroll in both

**Implementation:**
- Detection: `detectStudentCohortOverlaps()` in `lib/scheduling/conflictDetection.ts`
- Checks `targetStudents` array in Course type
- Generates ERROR conflict if same cohort courses overlap

**Rationale:** Students in a specific program/year must be able to take all required courses for their cohort

---

## Soft Constraints (Preferences & Optimization)

These constraints should be satisfied when possible, but can be relaxed if necessary.

### 1. Preferred Teaching Days

**Rule:** Prefer assigning faculty to their preferred teaching days when possible

**Source Data:** `preferredDays` field in faculty CSV

**Scoring Impact:** Considered in `facultyPreference` scoring component

**Example:**
- Jay Shimshack prefers Monday/Wednesday
- If multiple time slots available, prioritize Monday/Wednesday options

**Flexibility:** Can be overridden if needed to resolve conflicts

---

### 2. Friday Electives Avoidance

**Rule:** Avoid scheduling elective courses on Fridays unless specifically allowed or requested by faculty

**Config Flag:** `allowFridayElectives` (default: false)

**Rationale:** Friday attendance tends to be lower for electives

**Exceptions:**
- Core courses can be scheduled on Friday
- Capstone courses can be scheduled on Friday
- Allow two sections of LPPP 7750 on Friday morning
- Can be enabled if Friday sections are necessary or requested by faculty

**Implementation:** Time slot generation skips Friday for electives when flag is false

---

### 3. Thursday Evening Discussion Section Avoidance

**Rule:** Avoid scheduling discussion sections after 5:00pm on Thursdays

**Config Flag:** `avoidThursdayDiscussionsAfter5pm` (default: true)

**Rationale:** Student engagement and attendance concerns

**Flexibility:** Can be disabled if necessary for capacity reasons

---

### 4. Section Distribution for Multi-Section Courses

**Rule:** Sections of the same course should be distributed across different times and days

**Purpose:** Provides students with multiple time options for scheduling flexibility

**Warning Generated When:**
- 2+ sections of the same course are scheduled at identical times
- Special case: Courses with 4+ sections (like LPPP 7750) should span at least 3 different days

**Examples:**

❌ **Poor Distribution:**
- LPPP 7750 Section 1: Friday 9:30-12:00
- LPPP 7750 Section 2: Friday 9:30-12:00
- LPPP 7750 Section 3: Friday 1:00-3:30
- → All sections on same day, limiting student choice

✅ **Good Distribution:**
- LPPP 7750 Section 1: Monday 9:30-12:00
- LPPP 7750 Section 2: Wednesday 1:00-3:30
- LPPP 7750 Section 3: Friday 9:30-12:00
- → Spread across multiple days provides flexibility

**Implementation:**
- Detection: `detectSectionClustering()` in `lib/scheduling/conflictDetection.ts`
- Conflict type: `SECTION_CLUSTERING`
- Severity: WARNING (soft constraint)

**Special Cases:**
- **LPPP 7750** (6 sections): Should be distributed across at least 3 different days of the week
- Helps accommodate MPP Year 2 students' varying schedules

---

### 5. Maximum Electives Per Slot

**Rule:** Limit the number of elective sections scheduled in the same time slot

**Config Value:** `maxElectivesPerSlot` (default: 2)

**Rationale:** Spread electives across multiple time slots for student flexibility

**Implementation:** Checked during time slot assignment

---

### 6. Course-Specific Discussion Scheduling Constraints

**Overview:** Different courses have specific requirements for discussion section scheduling

**Special Constraints:**

**LPPL 6050 (Leadership in the Public Arena)**
- **Rule:** All discussion sections must be scheduled on Tuesday OR Thursday only
- **Duration:** 75 minutes (not the standard 50 minutes)
- **Rationale:** Maintains consistency with course pedagogy and allows lecture/discussion integration

**LPPL 2100**
- **Rule:** All discussion sections must be scheduled on Thursday only
- **Duration:** 75 minutes (not the standard 50 minutes)
- **Rationale:** Concentrates all discussions on one day for optimal coordination

**Default Discussion Duration:** 50 minutes (unless course-specific override exists)

**Implementation:**
- Course type has `discussionDuration` field (defaults to 50)
- Course type has `discussionDaysConstraint` field with values:
  - `'tuesday-thursday'` for LPPL 6050
  - `'thursday-only'` for LPPL 2100
  - `'same-as-lecture'` for courses wanting discussions on lecture day

---

### 7. Minimize LPPA 7110/7160 Discussion Overlap with LPPL 6050

**Rule:** Discussion sections for LPPA 7110 and LPPA 7160 should minimize overlap with LPPL 6050 lectures and discussions

**Rationale:** Students may be taking LPPL 6050 concurrently with LPPA courses, so avoiding conflicts maximizes scheduling flexibility

**Severity:** Warning (soft constraint)

**Implementation:** `detectDiscussionOverlapWithLPPL6050()` in conflict detection

**Example:**
- ❌ **Avoid:** LPPA 7110 discussion at 2:00-3:15 PM, LPPL 6050 lecture at 2:00-3:15 PM
- ✅ **Prefer:** LPPA 7110 discussion at 11:00 AM, LPPL 6050 lecture at 2:00 PM

---

## Faculty Assignment Rules

### 1. Multi-Factor Weighted Scoring System (v2.1+)

**Objective:** Balance multiple competing priorities in faculty assignment

**Scoring Factors:**

| Factor | Default Weight | Range | Purpose |
|--------|----------------|-------|---------|
| Workload Equity | 35% | 0-150 | Ensure fair distribution |
| Faculty Preference | 25% | 0-100 | Respect faculty preferences |
| Course Type Match | 15% | 0-100 | Match expertise to course type |
| Historical Consistency | 10% | 0-100 | Maintain semester-to-semester consistency |
| Time Efficiency | 10% | 0-100 | Minimize schedule gaps |
| Room Proximity | 5% | 0-100 | Minimize room changes |

**Total Score Calculation:**
```
Final Score = (workloadEquity × 0.35) +
              (facultyPreference × 0.25) +
              (courseTypeMatch × 0.15) +
              (historicalConsistency × 0.10) +
              (timeEfficiency × 0.10) +
              (roomProximity × 0.05)
```

**Customization:** Weights can be adjusted via the Assignment Weights Configuration panel in the UI

---

### 2. Workload Equity Scoring (CRITICAL)

**Purpose:** Ensure every faculty member teaches at least one course before anyone teaches multiple courses

**Scoring Table:**

| Current Workload | Score | Weighted (35%) | Notes |
|------------------|-------|----------------|-------|
| 0 courses        | **150** | **52.5** | MASSIVE bonus - ensures everyone teaches |
| 1 course         | 80 | 28.0 | Preferred |
| 2 courses        | 60 | 21.0 | Acceptable |
| 3 courses        | 35 | 12.25 | Discouraged |
| 4+ courses       | 10 | 3.5 | Heavily discouraged |

**Key Insight:**
- 0-course faculty: 52.5 pts from workload equity
- 1-course faculty (even if original assignment): max 28.0 + 25 + 19.5 = 72.5 pts
- 0-course faculty (not original): 52.5 + 12.5 + 20 = 85 pts

**Result:** 0-course faculty ALWAYS wins, ensuring equitable distribution

---

### 3. Faculty Preference Scoring

**Purpose:** Respect faculty preferences and original CSV assignments

**Scoring:**
- Original CSV assignment: **100 points**
- Other faculty: **50 points** (neutral)

**Future Enhancements:**
- Check preferred teaching days (bonus for matches)
- Check course type preferences
- Check time of day preferences

---

### 4. Course Type Match Scoring

**Purpose:** Match faculty expertise to course type (Core, Elective, Capstone)

**Current Implementation:**
- Original CSV assignment: **80 points**
- Other faculty: **50 points** (neutral)

**Future Enhancements:**
- Track faculty expertise by course type
- Bonus for faculty who have taught this type before
- Penalty for mismatches (e.g., research faculty teaching intro courses)

**Notes for Heather:** Add faculty expertise data here

---

### 5. Historical Consistency Scoring

**Purpose:** Maintain consistency with past semester assignments

**Current Implementation:**
- Original CSV assignment: **100 points**
- Other faculty: **50 points** (neutral)

**Future Enhancements:**
- Query historical assignment database
- Bonus for faculty who taught this specific course before
- Track multi-semester patterns

**Notes for Heather:** Would you like us to build a historical assignment database?

---

### 6. Time Efficiency Scoring

**Purpose:** Minimize schedule gaps for faculty (cluster courses together)

**Current Implementation:**
- Faculty with 1-2 courses: **70 points** (good clustering potential)
- Faculty with 0 courses: **60 points** (neutral)
- Faculty with 3+ courses: **50 points** (likely to have gaps)

**Future Enhancements:**
- Analyze faculty's actual schedule for time gaps
- Bonus for assignments that fill gaps
- Penalty for assignments that create new gaps

---

### 7. Room Proximity Scoring

**Purpose:** Minimize room changes for faculty between courses

**Current Implementation:**
- All faculty: **50 points** (neutral - not yet implemented)

**Future Enhancements:**
- Track assigned rooms for each faculty member
- Bonus for assignments in same building
- Penalty for assignments in distant buildings

---

## Time Slot Allocation Rules

### 1. Standard Time Blocks

**Graduate Courses (80 minutes, 2x per week):**
- Monday/Wednesday: 9:30-10:50am, 11:00am-12:20pm, 2:00-3:20pm, 3:30-4:50pm
- Tuesday/Thursday: 9:30-10:50am, 11:00am-12:20pm, 2:00-3:20pm, 3:30-4:50pm

**Graduate Courses (150 minutes, 1x per week):**
- Monday: 3:30-6:00pm
- Tuesday: 3:30-6:00pm (NOT during Batten Hour)
- Wednesday: 9:30-12:00pm, 2:00-4:30pm
- Thursday: 3:30-6:00pm
- Friday: 9:30-12:00pm (if allowed)

**Undergraduate Courses (80 minutes, 2x per week):**
- Similar to graduate slots
- Additional afternoon slots: 5:00-6:20pm (avoid for discussions on Thursday)

**Undergraduate Courses (150 minutes, 1x per week):**
- Wednesday: 2:00-4:30pm, 3:30-6:00pm
- Other days as needed

---

### 2. Course Duration Rules

**Source Data:** `duration` field in course CSV (in minutes)

**Standard Durations:**
- 80 minutes → 2 sessions per week
- 150 minutes → 1 session per week
- 75 minutes → 2 sessions per week (special cases like LPPA 6050)

**Implementation:** `sessionsPerWeek` field drives time slot selection

---

### 3. Discussion Section Time Allocation

**Rule:** Discussion sections scheduled separately from lectures

**Typical Pattern:**
- Lectures: Standard time blocks
- Discussions: 80-minute blocks, spread across the week

**Capacity Consideration:**
- Large courses (e.g., LPPP 2200 with 12 discussion sections) need many time slots
- System must reserve sufficient slots for all sections

**Implementation:** Separate scheduling pass for discussion sections

---

## Room Assignment Rules

### 1. Room Priority by Building

**Priority Order:**
1. **Monroe 120** (highest priority - 60 capacity, large lecture hall)
2. **Rouss Hall** (secondary priority - 48 capacity, medium courses)
3. **Pavilion VIII** (18 capacity - small courses, capstones)
4. **UREG Assigned** (fallback - registrar assigns later)

**Implementation:** `assignRoom()` method in roomAssignment.ts

**Rationale:** Monroe 120 is the primary large lecture hall for the Batten School

---

### 2. Room Capacity Matching

**Rule:** Assign smallest room that satisfies enrollment cap

**Algorithm:**
1. Filter rooms by capacity ≥ enrollmentCap
2. Sort by capacity (ascending)
3. Apply building priority as tiebreaker
4. Assign first available room

**Example:**
- Section has 50 students
- Monroe 120: 60 capacity ✅ (preferred - fits requirement)
- Rouss Hall: 48 capacity (too small)
- UREG: 30 capacity (fallback if Monroe unavailable)

---

### 3. Special Room Requirements

**Large Lectures:**
- Courses like LPPP 2200 (240 students) require auditorium
- LPPL 3210 (162 students) requires large lecture hall

**Seminar Courses:**
- Capstone courses (18 students) prefer smaller seminar rooms
- Discussion sections (20-30 students) use standard classrooms

**Special Rooms:**
- LPPL 4680 specifically requests "CSC room" for Wednesday sessions
- Check course `notes` field for room requirements

**Notes for Heather:** Add any additional special room requirements here

---

## Student Cohort Considerations

### 1. Target Program Scheduling

**Source Data:** `targetPrograms` field in course CSV

**Common Cohorts:**
- MPP Year 1 (requires specific core courses)
- MPP Year 2 (capstones and electives)
- BA Year 1, 2, 3, 4
- Minor students
- Certificate students

**Constraint:** Courses for the same cohort should not conflict with each other

**Example:**
- LPPA 7110 (Economics 2) - MPP Year 1
- LPPA 7160 (Research Methods) - MPP Year 1
- These CANNOT be scheduled at the same time (MPP Year 1 students need both)

**Implementation:** Currently detected as conflicts; future enhancement could prevent during initial generation

---

### 2. Multi-Section Course Scheduling

**Rule:** Multiple sections of the same course should be scheduled at different times

**Rationale:** Allows students to choose between section times

**Example:**
- LPPA 6250 has 2 sections: "Morning and afternoon sections for athletes"
- One section should be AM, one should be PM
- Accommodates student schedules (especially athletes)

**Implementation:** Scheduler automatically assigns different time slots to different sections

---

### 3. Discussion Section Distribution

**Rule:** Spread discussion sections across multiple days and times

**Rationale:** Maximizes student scheduling flexibility

**Example:**
- LPPP 2200 has 12 discussion sections
- Distribute across Monday-Thursday in various time slots
- Avoid clustering all discussions on the same day

**Implementation:** Discussion section scheduling algorithm

---

## Workload Balancing Criteria

### 1. Course Count Balancing (Current Implementation)

**Metric:** Number of courses assigned to each faculty member

**Target:** Everyone teaches at least 1 course; most faculty have 1-3 courses

**Algorithm:** Multi-factor weighted scoring with massive bonus for 0-course faculty

**Status:** ✅ Implemented in v2.1

---

### 2. Teaching Hours Balancing (Future Enhancement)

**Metric:** Total weekly teaching hours (not just course count)

**Rationale:**
- A 150-minute course (2.5 hours) is heavier than an 80-minute course (1.3 hours)
- Faculty with 3 short courses ≠ faculty with 3 long courses

**Proposed Calculation:**
```
Teaching Load = Σ (course_duration × sessions_per_week / 60)
```

**Example:**
- Faculty A: 2 courses × 80min × 2 sessions/week = 5.3 hours/week
- Faculty B: 2 courses × 150min × 1 session/week = 5.0 hours/week
- Roughly equivalent workload despite same course count

**Status:** Not yet implemented - needs discussion

**Notes for Heather:** Should we weight by hours or stick with course count?

---

### 3. Multi-Semester Balancing (Future Enhancement)

**Concept:** Balance workload across Fall and Spring semesters

**Example:**
- Faculty teaches 3 courses in Fall → Assign only 1-2 in Spring
- Faculty teaches 1 course in Fall → Can teach 2-3 in Spring

**Requirements:**
- Need to track Fall semester assignments
- Import/export semester workload data
- Adjust scoring based on previous semester

**Status:** Under consideration

---

### 4. Course Type Distribution

**Concept:** Balance Core vs. Elective vs. Capstone assignments

**Considerations:**
- Core courses: Higher workload (more students, more grading)
- Electives: Medium workload (smaller classes)
- Capstones: High time commitment (intensive student interaction)

**Proposed Rule:** Faculty teaching a capstone should have lighter load in other courses

**Status:** Not yet implemented

**Notes for Heather:** What's the relative workload difference between course types?

---

## Conflict Resolution Priorities

When AI auto-resolve encounters conflicts, it uses this priority order:

### 1. Faculty Reassignment (Highest Priority)

**When Used:** Faculty double-booking or preference violations

**Scoring Factors:**
1. Workload balance (dominant factor)
2. Day preferences match (+5 pts/day)
3. Not on "cannot teach" days
4. Not conflicting with parenting partner

**Confidence Threshold:** 70+ = High confidence

---

### 2. Time Slot Rescheduling (Secondary Priority)

**When Used:** Room conflicts, student cohort conflicts, Batten Hour violations

**Scoring Factors:**
1. Available room in preferred building
2. Not during Batten Hour (for electives)
3. Matches faculty preferred days
4. Doesn't create new conflicts

**Confidence Threshold:** 60+ = Medium confidence

---

### 3. Mark as Reviewed (Last Resort)

**When Used:** No viable alternatives found

**User Action Required:** Manual resolution needed

**Confidence:** 0 (requires human decision)

---

## Course-Specific Rules

### LPPP 2200 - Introduction to Public Policy

- **Enrollment:** 240 students (large lecture)
- **Structure:** 1 lecture + 12 discussion sections
- **Room Requirement:** Large auditorium for lecture
- **Discussion Sections:** Spread across multiple days
- **Target:** BA Year 2

---

### LPPA 6050 - Leadership in the Public Arena

- **Structure:** Lecture + 14 discussion sections (!!)
- **Special Rule:** "Discussion sections on same day as lecture"
- **Enrollment:** 89 students
- **Target:** MPP Year 1, MPP Year 2

---

### LPPA 7750 - Advanced Policy Project 2 (Capstone)

- **Structure:** 6 sections, 0 discussion sections
- **Duration:** 150 minutes (2.5 hours)
- **Special:** One section on Friday 9:30-12:00
- **Target:** MPP Year 2
- **Note:** Heavy faculty time commitment despite 1 session/week

---

### LPPL 4680 - Lead From Anywhere

- **Structure:** 2 sections, no discussions
- **Special Schedule:** Wednesday 9:30-12:00 AND Wednesday 2:00-4:30
- **Room:** "CSC room" specifically requested
- **Target:** BA Year 4

---

### LPPL 3210 - Behavioral Science for Civic Leadership

- **Enrollment:** 162 students (large lecture)
- **Duration:** 150 minutes
- **Preferred Time:** 3:30-6:00pm
- **Target:** BA Year 3, Minor Year 4

---

**Notes for Heather:** Please add any additional course-specific rules or exceptions here as you discover them

---

## Multi-Factor Weighted Scoring System

### Configuration

The multi-factor scoring system allows customization via the **Assignment Weights Configuration** panel in the UI.

**Access:** Click "Configure Assignment Weights" button on the main page

**Available Weights:**
- Workload Equity (default: 35%)
- Faculty Preference (default: 25%)
- Course Type Match (default: 15%)
- Historical Consistency (default: 10%)
- Time Efficiency (default: 10%)
- Room Proximity (default: 5%)

**Constraints:**
- All weights must sum to 100%
- Minimum weight: 0%
- Maximum weight: 100%

---

### Scoring Component Details

#### 1. Workload Equity (0-150 points)

**Purpose:** Ensure fair distribution with everyone teaching at least 1 course

**Scoring:**
- 0 courses: **150 points** (MASSIVE bonus)
- 1 course: **80 points**
- 2 courses: **60 points**
- 3 courses: **35 points**
- 4+ courses: **10 points**

**Weight:** 35% (default)

**Weighted Contribution:**
- 0 courses: 52.5 pts
- 1 course: 28.0 pts

**Critical:** The gap ensures 0-course faculty always wins

---

#### 2. Faculty Preference (0-100 points)

**Purpose:** Respect faculty preferences and CSV assignments

**Scoring:**
- Original CSV assignment: **100 points**
- Other faculty: **50 points**

**Weight:** 25% (default)

**Weighted Contribution:**
- Original: 25 pts
- Other: 12.5 pts

---

#### 3. Course Type Match (0-100 points)

**Purpose:** Match expertise to course type

**Scoring:**
- Original CSV assignment: **80 points**
- Other faculty: **50 points**

**Weight:** 15% (default)

**Future:** Track faculty expertise for better matching

---

#### 4. Historical Consistency (0-100 points)

**Purpose:** Maintain semester-to-semester consistency

**Scoring:**
- Original CSV assignment: **100 points**
- Other faculty: **50 points**

**Weight:** 10% (default)

**Future:** Query historical assignment database

---

#### 5. Time Efficiency (0-100 points)

**Purpose:** Cluster courses to minimize gaps

**Scoring:**
- 1-2 existing courses: **70 points** (good clustering)
- 0 courses: **60 points** (neutral)
- 3+ courses: **50 points** (likely gaps)

**Weight:** 10% (default)

**Future:** Analyze actual schedule for gaps

---

#### 6. Room Proximity (0-100 points)

**Purpose:** Minimize room changes between courses

**Scoring:**
- All faculty: **50 points** (neutral - not yet implemented)

**Weight:** 5% (default)

**Future:** Track assigned rooms and calculate proximity

---

### Example Scoring Scenarios

#### Scenario 1: 0-Course Faculty (Not Original)

| Factor | Score | Weight | Weighted |
|--------|-------|--------|----------|
| Workload Equity | 150 | 35% | 52.5 |
| Faculty Preference | 50 | 25% | 12.5 |
| Course Type Match | 50 | 15% | 7.5 |
| Historical Consistency | 50 | 10% | 5.0 |
| Time Efficiency | 60 | 10% | 6.0 |
| Room Proximity | 50 | 5% | 2.5 |
| **Total** | | | **86.0** |

---

#### Scenario 2: 1-Course Faculty (Original Assignment)

| Factor | Score | Weight | Weighted |
|--------|-------|--------|----------|
| Workload Equity | 80 | 35% | 28.0 |
| Faculty Preference | 100 | 25% | 25.0 |
| Course Type Match | 80 | 15% | 12.0 |
| Historical Consistency | 100 | 10% | 10.0 |
| Time Efficiency | 70 | 10% | 7.0 |
| Room Proximity | 50 | 5% | 2.5 |
| **Total** | | | **84.5** |

**Result:** 0-course faculty (86.0) wins over 1-course original (84.5) ✅

This guarantees equitable distribution!

---

## Notes Section

**For Heather and Team - Please Add:**

1. Any faculty expertise areas or subject matter preferences
2. Additional course-specific scheduling requirements
3. Changes to room availability or capacities
4. New constraints discovered during real-world usage
5. Student feedback on schedule patterns
6. Adjustments to scoring weights based on outcomes
7. Special considerations for specific semesters (e.g., visiting faculty, sabbaticals)
8. Historical assignment data from previous semesters

---

## Document History

| Date | Changes | Author |
|------|---------|--------|
| Nov 11, 2025 | Initial creation with multi-factor weighted scoring | Claude Code |
| | | |

---

**End of Document**

*This is a living document. Please update as scheduling criteria evolve and new requirements emerge.*
