# Heather's Responses - Implementation Action Plan
**Date**: November 11, 2025 (received)
**Analyzed**: December 15, 2024

## Executive Summary

Heather provided comprehensive answers to all 14 questions. Based on her responses, here are the prioritized implementation tasks:

### Feature Priority (Per Heather's Ranking)
1. **Schedule Versioning** (save/load multiple versions)
2. **Discussion Section Day Constraints** (in scheduler logic)
3. **Version Comparison** (side-by-side diff)
4. **Color Coding Parser Fix** (CSV format update)

---

## Priority 1: Schedule Versioning

### Requirements from Heather
- **Naming Convention**: Date-based format (e.g., "Schedule 2024-12-15", "Schedule 2024-12-20")
- **Storage Duration**: One academic year
- **Multi-user**: Local storage for now (may evolve to multi-user later)
- **Delete Functionality**: MUST be able to delete drafts to avoid confusion
- **No Approval Workflow**: Schedules enter SIS in stages, no formal approval needed

### Implementation Tasks
1. Create `lib/storage/scheduleVersions.ts` with CRUD operations
2. Implement auto-naming with date format: `Schedule YYYY-MM-DD`
3. Add manual rename capability
4. Add delete confirmation dialog
5. Show versions sorted by date (newest first)
6. Add version metadata: created date, conflict counts, section counts
7. Filter versions by academic year
8. Add "Delete All Old Versions" utility for cleanup

### UI Components Needed
- Save Schedule button with automatic date naming
- Versions List Panel with delete buttons
- Rename dialog
- Storage usage indicator
- Academic year filter dropdown

---

## Priority 2: Discussion Section Day Constraints

### Requirements from Heather

**LPPL 6050 Discussions:**
- Each discussion section picks ONE day (Tuesday OR Thursday)
- Example: Discussion 1 on Tuesday, Discussion 2 on Thursday ✅
- Duration: 75 minutes (already implemented)

**LPPL 2100 Discussions:**
- All discussions on Thursday only
- Duration: 75 minutes (already implemented)

**Discussion Time Preferences:**
- Ideally limit conflicts with lectures for courses in their cohort
- Should NOT be immediately before/after lectures

**LPPA 7110/7160 vs LPPL 6050:**
- **Soft constraint** (warning, not error)
- **Higher priority**: Avoid overlap with LPPL 6050 **lectures** (discussions are lower priority)

### Implementation Tasks

1. **Update Scheduler Logic** (`lib/scheduling/scheduler.ts`):
   ```typescript
   // When scheduling discussion sections:
   - Check course.discussionDaysConstraint
   - If 'tuesday-thursday': filter to only Tue OR Thu slots
   - If 'thursday-only': filter to only Thu slots
   - Use course.discussionDuration (75 or 50 minutes)
   ```

2. **Update Time Slot Filtering**:
   ```typescript
   private getPossibleTimeSlotsForDiscussion(
     course: Course,
     sectionNumber: number
   ): TimeSlot[] {
     let slots = this.allTimeSlots;

     // Apply discussion day constraints
     if (course.discussionDaysConstraint === 'tuesday-thursday') {
       slots = slots.filter(slot =>
         slot.days.includes(DayOfWeek.TUESDAY) ||
         slot.days.includes(DayOfWeek.THURSDAY)
       );
     } else if (course.discussionDaysConstraint === 'thursday-only') {
       slots = slots.filter(slot =>
         slot.days.includes(DayOfWeek.THURSDAY)
       );
     }

     // Filter by discussion duration
     const duration = course.discussionDuration || 50;
     slots = slots.filter(slot => {
       const slotDuration = calculateDuration(slot.startTime, slot.endTime);
       return slotDuration === duration;
     });

     return slots;
   }
   ```

3. **Add Cohort Conflict Avoidance**:
   - When scheduling discussions, check for overlaps with lectures targeting same cohort
   - Deprioritize (not block) slots that conflict with cohort lectures

4. **Update Conflict Detection**:
   - Change LPPA/LPPL overlap from generic warning to prioritized warning
   - Emphasize lecture overlaps more than discussion overlaps

---

## Priority 3: Version Comparison (Side-by-Side Diff)

### Requirements from Heather
- **Priority**: Nice to have, but not urgent
- **Most Important Difference**: **Time slot changes with course mnemonic** (course code)

### Implementation Tasks (Lower Priority)

1. Create `components/scheduling/VersionComparison.tsx`
2. Add diff algorithm to compare two schedules
3. Highlight:
   - **Primary**: Time slot changes (show course code)
   - Secondary: Faculty reassignments, room changes, conflict count changes
4. Color coding for changes:
   - Yellow: Time slot moved
   - Blue: Faculty changed
   - Green: New section
   - Red: Removed section

---

## Priority 4: Color Coding Parser Fix

### Requirements from Heather

**Preferred CSV Format** (simpler codes):
- `MPP1` - MPP Year 1
- `MPP2` - MPP Year 2
- `BA3` - BA Year 3
- `BA4` - BA Year 4
- `Accel1` - Accelerated MPP Year 1
- `Accel2` - Accelerated MPP Year 2
- `G/U Electives` - Graduate/Undergraduate Electives (multi-cohort)

**Color Scheme Updates**:
- **Keep**: MPP1 (Blue), MPP2 (Indigo), BA3 (Rose), BA4 (Red), Accel1, Accel2
- **Remove**: BA1 (Purple), BA2 (Pink), Minor (Green), Certificate (Amber) - not necessary

**Multiple Cohorts**:
- Won't happen with real data
- Use "G/U Elective" designation for 5000-level electives

### Implementation Tasks

1. **Update `parseTargetPrograms()` function** in `lib/utils/fileParser.ts`:
   ```typescript
   function parseTargetPrograms(programsStr?: string): any[] {
     if (!programsStr) return [{ year: 1, program: 'BA', count: 0 }];

     const programs = programsStr.split(',').map(p => p.trim());

     const parsed = programs.map(program => {
       // Match: MPP1, MPP2, BA3, BA4, Accel1, Accel2
       const match = program.match(/^(MPP|BA|Accel|G\/U\s*Elective)(\d)?$/i);

       if (match) {
         const programType = match[1].toUpperCase();
         const year = match[2] ? parseInt(match[2]) : 1;

         // Normalize program names
         let normalizedProgram = programType;
         if (programType === 'MPP') {
           normalizedProgram = 'MPP_Postgrad';
         } else if (programType === 'ACCEL') {
           normalizedProgram = 'MPP_Accel';
         } else if (programType.includes('ELECTIVE')) {
           normalizedProgram = 'G_U_Elective';
         }

         return {
           year: year as 1 | 2 | 3 | 4,
           program: normalizedProgram,
           count: 0,
         };
       }

       return null;
     }).filter(Boolean);

     return parsed.length > 0 ? parsed : [{ year: 1, program: 'BA', count: 0 }];
   }
   ```

2. **Update Color Mapping** in `components/scheduling/ScheduleViewer.tsx`:
   ```typescript
   const colorMap: Record<string, { bg: string; border: string; text: string }> = {
     // MPP Programs
     'MPP_Postgrad-1': { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-900' },
     'MPP_Postgrad-2': { bg: 'bg-indigo-100', border: 'border-indigo-400', text: 'text-indigo-900' },
     'MPP_Accel-1': { bg: 'bg-sky-100', border: 'border-sky-400', text: 'text-sky-900' },
     'MPP_Accel-2': { bg: 'bg-cyan-100', border: 'border-cyan-400', text: 'text-cyan-900' },

     // BA Programs (only 3 and 4 needed)
     'BA-3': { bg: 'bg-rose-100', border: 'border-rose-400', text: 'text-rose-900' },
     'BA-4': { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-900' },

     // G/U Electives (neutral gray)
     'G_U_Elective-1': { bg: 'bg-slate-100', border: 'border-slate-400', text: 'text-slate-900' },
     'G_U_Elective-2': { bg: 'bg-slate-100', border: 'border-slate-400', text: 'text-slate-900' },
   };
   ```

3. **Update Color Legend**:
   - Remove: BA1, BA2, Minor, Certificate
   - Add: Accel1, Accel2, G/U Electives
   - Update labels to match new format

---

## Additional Implementation Notes

### LPPP 7750 Distribution Refinement
**Heather's Requirement**: "At least one on every day, no more than 2 on Friday (morning only) and avoid exact same times on any day."

**Update Anti-Clustering Logic**:
```typescript
private rankSlotsByDistribution(slots: TimeSlot[], course: Course): TimeSlot[] {
  if (course.code === 'LPPP 7750') {
    const existingSections = this.sections.filter(s => s.courseId === course.id);

    // Count sections per day
    const sectionsPerDay = new Map<DayOfWeek, number>();
    existingSections.forEach(section => {
      section.timeSlot.days.forEach(day => {
        sectionsPerDay.set(day, (sectionsPerDay.get(day) || 0) + 1);
      });
    });

    return slots.map(slot => {
      let score = 100;

      // Penalize Friday if already have 2+ sections
      if (slot.days.includes(DayOfWeek.FRIDAY)) {
        const fridayCount = sectionsPerDay.get(DayOfWeek.FRIDAY) || 0;
        if (fridayCount >= 2) {
          score -= 100; // Block
        }
        // Only allow morning slots on Friday
        const hour = parseInt(slot.startTime.split(':')[0]);
        if (hour >= 12) {
          score -= 100; // Block afternoon Friday
        }
      }

      // Bonus for days with fewer sections
      slot.days.forEach(day => {
        const count = sectionsPerDay.get(day) || 0;
        score -= count * 10;
      });

      // Exact time penalty
      const hasExactMatch = existingSections.some(existing =>
        existing.timeSlot.startTime === slot.startTime &&
        existing.timeSlot.days.some(d => slot.days.includes(d))
      );
      if (hasExactMatch) score -= 50;

      return { slot, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(s => s.slot);
  }

  // ... existing anti-clustering logic for other courses
}
```

### Block-Busting Clarification
**Heather's Note**: "This is more specific to the combination of section length, room availability, faculty preference, etc. Not course specific necessarily. Will provide a sample schedule."

**Action**: Wait for Heather's sample schedule before implementing further block-busting logic.

---

## Implementation Timeline

### Week 1: Schedule Versioning (Priority 1)
**Estimated Time**: 4-6 hours
- [ ] Day 1-2: Storage service and CRUD operations
- [ ] Day 2-3: UI components (Save dialog, Versions list)
- [ ] Day 3-4: Delete functionality with confirmations
- [ ] Day 4-5: Testing and refinement

### Week 2: Discussion Constraints (Priority 2)
**Estimated Time**: 3-4 hours
- [ ] Day 1: Update scheduler logic for day constraints
- [ ] Day 2: Add cohort conflict avoidance
- [ ] Day 2-3: Update conflict detection priorities
- [ ] Day 3: Testing with sample data

### Week 3: Color Coding Parser (Priority 4)
**Estimated Time**: 2-3 hours
- [ ] Day 1: Update parseTargetPrograms() function
- [ ] Day 1-2: Update color mappings and remove unused cohorts
- [ ] Day 2: Update color legend
- [ ] Day 2-3: Testing with real CSV format

### Week 4+: Version Comparison (Priority 3)
**Estimated Time**: 6-8 hours (Lower priority - "nice to have")
- [ ] Implement when Priorities 1, 2, and 4 are complete
- [ ] Can be deferred if other priorities arise

---

## Testing Requirements

### Test Data Needed from Heather
1. ✅ Sample CSV with actual cohort codes (MPP1, MPP2, BA3, BA4, Accel1, Accel2, G/U Electives)
2. ⏳ Current Fall schedule for block-busting reference
3. ⏳ Full list of courses for testing

### Test Cases to Create
1. **Color Coding**: Upload CSV with new format, verify colors display correctly
2. **Discussion Constraints**: Schedule LPPL 6050 and 2100, verify day constraints
3. **LPPP 7750 Distribution**: Generate schedule, verify no more than 2 Friday and morning only
4. **Schedule Versioning**: Create, save, load, delete, rename versions
5. **LPPA Overlap Warning**: Schedule LPPA 7110/7160, verify warnings for LPPL 6050 lecture overlap

---

## Questions for Clarification

### Accel1/Accel2 Colors
Heather mentioned Accel1 and Accel2, but we need to assign colors:
- **Suggestion**:
  - Accel1: Sky blue (lighter than MPP1)
  - Accel2: Cyan (lighter than MPP2)
- **Question for Heather**: Do these color choices work, or would you prefer different colors?

### G/U Electives Color
- **Suggestion**: Neutral gray/slate color since it's multi-cohort
- **Question for Heather**: Confirm this is acceptable

---

## Next Steps

1. **Immediate**: Update color coding parser to handle simplified format (MPP1, BA3, etc.)
2. **This Week**: Implement Schedule Versioning (Priority 1)
3. **Next Week**: Implement Discussion Section Day Constraints (Priority 2)
4. **Ongoing**: Wait for Heather's sample schedule data for further refinement

---

## Notes

- Heather will provide a document with current Fall courses
- Additional constraints will be discovered as we "play with the model"
- Room requirements will be main source of additional constraints
- Faculty workload balancing not needed (faculty pre-assigned to courses)
- No formal approval workflow needed
- Delete functionality is critical for version management

---

**End of Action Plan**
