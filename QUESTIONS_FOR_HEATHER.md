# Questions for Heather - December 15, 2024

## Priority Questions (Need Answers to Continue Development)

### 1. Color Coding Issue - CSV Data Format
**Current Problem**: The schedule is showing all courses in gray instead of the color-coded cohort colors.

**Question**: What format does the `targetPrograms` column use in your CSV file?

Please share 2-3 example values from your actual CSV, such as:
- "MPP Year 1" ✅
- "MPP_Postgrad Year 1" ✅
- "BA Year 2" ✅
- "MPP1" ❌ (won't work - missing "Year")
- "First year MPP" ❌ (won't work - wrong format)

**Why this matters**: The parser needs to match the exact format to extract cohort data correctly.

---

## Schedule Versioning Questions

### 2. Version Naming Convention
When saving different versions of a schedule, what naming style would work best for your team?

**Options:**
- A) Descriptive: "Fall 2025 - Morning Focus", "Spring 2025 - Final Draft"
- B) Sequential: "Version 1", "Version 2", "Version 3"
- C) Date-based: "Schedule 2024-12-15", "Schedule 2024-12-20"
- D) Hybrid: "Fall 2025 v3 - Final Draft"

**Your preference**: _______________

### 3. Version Storage and Retention
- How long do you need to keep old schedule versions?
  - [ ] Just current semester
  - [ ] One academic year
  - [ ] Multiple years
  - [ ] Forever

- Do multiple people need to access and edit the same schedules?
  - [ ] Yes (requires cloud backend)
  - [ ] No (local storage is fine)

### 4. Version Comparison Priority
Is side-by-side comparison of two schedule versions important?
- [ ] Yes, high priority
- [ ] Nice to have, but not urgent
- [ ] Not needed

If yes, what differences are most important to highlight?
- [ ] Faculty reassignments
- [ ] Time slot changes
- [ ] Room changes
- [ ] Conflict count changes
- [ ] Other: _______________

### 5. Approval Workflow
Do schedules need formal approval before being finalized?
- [ ] Yes - need Draft → Review → Approved workflow
- [ ] No - just save and load functionality is fine

If yes, who are the approvers? _______________

---

## Discussion Section Scheduling Questions

### 6. LPPL 6050 Discussion Day Constraint Clarification
Current rule: "All discussion sections must be on Tuesday OR Thursday"

**Question**: Does this mean:
- [ ] A) Each discussion section picks ONE day (either Tue OR Thu)
      - Example: Discussion 1 on Tuesday, Discussion 2 on Thursday ✅
- [ ] B) ALL discussions must be on the SAME day (all Tue or all Thu)
      - Example: Discussion 1 on Tuesday, Discussion 2 on Tuesday ✅

**Your answer**: _______________

### 7. Discussion Time Preferences
Are there preferred times for discussion sections?
- Preferred time range: _______________
- Times to avoid: _______________
- Should discussions be immediately before/after lectures? [ ] Yes [ ] No

### 8. LPPA 7110/7160 Overlap with LPPL 6050
Current rule: "Minimize overlap with LPPL 6050 lectures and discussions"

**Question**: How strict is this?
- [ ] Hard constraint - absolutely no overlap allowed (scheduling will fail if can't avoid)
- [ ] Soft constraint - avoid when possible, but overlap is acceptable if necessary (shows warning)

**Follow-up**: Which is higher priority to avoid?
- [ ] Overlap with LPPL 6050 lectures
- [ ] Overlap with LPPL 6050 discussions
- [ ] Both equally important

---

## General Scheduling Questions

### 9. LPPP 7750 Section Distribution
You mentioned sections were clustering on Tuesdays. We added anti-clustering logic.

**Question**: Is the current distribution better now? (See attached screenshot if available)

**Follow-up**: What's the ideal distribution?
- [ ] One section per day (M, T, W, Th, F)
- [ ] At least 2 different days
- [ ] Just avoid having all sections at the same time
- [ ] Other: _______________

### 10. Multiple Cohort Courses
Some courses target multiple student cohorts (e.g., "MPP Year 1, BA Year 3").

**Question**: Which cohort's color should we display?
- [ ] A) Primary/first cohort only (current approach)
- [ ] B) Show multiple colors (multiple color bars or split colors)
- [ ] C) Use a neutral color for multi-cohort courses

**Example course with multiple cohorts**: _______________

### 11. Color Scheme Preferences
Are the current color assignments acceptable?

| Cohort | Color | Acceptable? |
|--------|-------|-------------|
| MPP Year 1 | Blue | [ ] Yes [ ] No |
| MPP Year 2 | Indigo | [ ] Yes [ ] No |
| BA Year 1 | Purple | [ ] Yes [ ] No |
| BA Year 2 | Pink | [ ] Yes [ ] No |
| BA Year 3 | Rose | [ ] Yes [ ] No |
| BA Year 4 | Red | [ ] Yes [ ] No |
| Minor | Green | [ ] Yes [ ] No |
| Certificate | Amber | [ ] Yes [ ] No |

If any are not acceptable, what colors would you prefer? _______________

### 12. Faculty Workload Limits
What's considered a reasonable teaching load for faculty?
- Maximum hours per week: _______________
- Maximum number of courses: _______________
- Maximum number of different course preparations: _______________

### 13. Room Assignment Priorities
Current priority order:
1. Monroe 120 (60 capacity) - for large lectures
2. Rouss Hall (48 capacity) - for medium courses
3. Pavilion VIII (18 capacity) - for small courses/capstones

**Question**: Is this correct?
- [ ] Yes, this is correct
- [ ] No, adjust to: _______________

**Follow-up**: Are there any courses that require specific rooms beyond what's in the notes column?
- [ ] No, notes column covers everything
- [ ] Yes: _______________

### 14. Block-Busting Courses
Are there courses that should always be scheduled outside standard university time blocks?

- [ ] No block-busting courses
- [ ] Yes, the following courses: _______________

If yes, why? _______________
Preferred times: _______________

---

## Feature Priority Ranking

Please rank these upcoming features by priority (1 = highest, 5 = lowest):

- [ ] ___ Fix color coding display issue
- [ ] ___ Implement schedule versioning (save/load multiple versions)
- [ ] ___ Add version comparison (side-by-side diff)
- [ ] ___ Implement discussion section day constraints in scheduler
- [ ] ___ Add faculty workload balancing across semesters

---

## Additional Comments or Questions

Please share any other feedback, concerns, or questions:

_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________

---

## Response Instructions

You can either:
1. Fill out this document and send it back
2. Schedule a brief call to go through these questions
3. Answer the priority questions first, then we can address others later

**Most Urgent**: Questions #1 (color coding CSV format) and #6 (discussion day constraints)

Thank you!
