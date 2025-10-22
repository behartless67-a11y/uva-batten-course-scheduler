# Future Enhancement Ideas

## AI-Powered Conflict Resolution

**Status:** Suggested, Not Yet Implemented
**Priority:** Medium-High
**Estimated Effort:** 2-3 days

### Overview

Add AI assistance to the conflict resolution wizard to help solve complex scheduling conflicts that the rule-based system struggles with.

### Use Cases

1. **Complex Multi-Conflict Scenarios**
   - When conflicts cascade across multiple sections
   - When no obvious solution exists from rule-based suggestions
   - When user has skipped several conflicts without resolution

2. **Natural Language Explanations**
   - Convert constraint violations into plain English
   - Explain trade-offs between different solutions
   - Provide context-aware reasoning for suggestions

3. **Creative Problem Solving**
   - Propose multi-step solutions (e.g., "swap sections between Faculty A and B")
   - Consider non-obvious alternatives
   - Find compromises when perfect solutions don't exist

### Recommended Implementation: Hybrid Approach

#### UI Changes

**1. "Ask AI for Help" Button**
- Appears when:
  - All rule-based suggestions score < 50
  - Conflict affects 3+ sections
  - User has skipped 2+ conflicts in a row
  - User manually requests AI assistance
- Button shows: "✨ Get AI Suggestions" with loading spinner during analysis

**2. AI Analysis Panel**
```
┌─────────────────────────────────────────────────────┐
│ ✨ AI Analysis                                      │
├─────────────────────────────────────────────────────┤
│ Understanding the Conflict:                         │
│ Dr. Smith is scheduled to teach PLCY-101 and       │
│ PLCY-202 simultaneously on Mon/Wed 2-3:15 PM.      │
│ Both are core courses required by MPP Year 1       │
│ students, creating a student cohort conflict.      │
│                                                     │
│ Recommended Multi-Step Solution (Confidence: 85%)  │
│ 1. Swap PLCY-202 with Dr. Johnson's PLCY-305      │
│ 2. Move Dr. Johnson's section to Tue/Thu          │
│ 3. This resolves the conflict while respecting    │
│    both faculty's preferences for morning slots   │
│                                                     │
│ Trade-offs:                                        │
│ • Dr. Johnson prefers Mon/Wed but accepts Tue/Thu │
│ • Minimal impact on other sections                │
│ • No student cohort conflicts created             │
│                                                     │
│ [Apply This Solution]  [Try Another Approach]     │
└─────────────────────────────────────────────────────┘
```

**3. AI Suggestions List**
- Shown alongside rule-based suggestions
- Clearly labeled with "✨ AI Suggested"
- Include confidence scores
- Show multi-step solutions as expandable cards

#### Technical Architecture

**API Integration Options:**

1. **Anthropic Claude (Recommended)**
   - Model: Claude 3.5 Sonnet
   - Best reasoning and constraint understanding
   - Cost: ~$0.015 per request (estimate)
   - Response time: 2-4 seconds

2. **OpenAI GPT-4**
   - Model: GPT-4 Turbo
   - Good general intelligence
   - Cost: ~$0.03 per request (estimate)
   - Response time: 3-5 seconds

**Configuration:**
- User-provided API key (stored in browser localStorage)
- Optional: Admin-level API key for all users
- Fallback to rule-based system if API unavailable

#### Context Sent to AI

```typescript
{
  conflict: {
    type: "Faculty Double Booked",
    description: "Dr. Smith teaching two courses simultaneously",
    severity: "error",
    affectedSections: [/* full section details */]
  },
  schedule: {
    allSections: [/* all scheduled sections */],
    availableTimeSlots: [/* remaining slots */],
    constraints: {
      battenHour: true,
      maxElectivesPerSlot: 2,
      // ... other constraints
    }
  },
  faculty: [/* all faculty with preferences */],
  courses: [/* all course details */],
  previousAttempts: [/* what user already tried */],
  resolutionHistory: [/* what worked before */]
}
```

#### AI Response Format

```typescript
{
  understanding: "Natural language explanation of the conflict",
  suggestions: [
    {
      type: "multi-step" | "single-action",
      steps: [
        {
          action: "reschedule_section" | "reassign_faculty" | "swap_sections",
          sectionId: "...",
          details: {...},
          reasoning: "Why this step helps"
        }
      ],
      confidence: 85,
      pros: ["Minimal disruption", "Respects preferences"],
      cons: ["Dr. Johnson prefers different day"],
      cascadingEffects: [/* predicted impacts */]
    }
  ],
  alternativeApproaches: [/* other strategies to consider */]
}
```

#### Implementation Steps

**Phase 1: Foundation (Day 1)**
1. Add API configuration UI in settings
2. Create AI service module (`lib/ai/conflictResolver.ts`)
3. Implement prompt generation from conflict context
4. Add "Ask AI for Help" button to wizard

**Phase 2: Integration (Day 2)**
1. Parse AI responses into suggestion format
2. Display AI suggestions in existing UI
3. Handle multi-step solutions
4. Add loading states and error handling

**Phase 3: Polish (Day 3)**
1. Add natural language explanations panel
2. Implement confidence scoring
3. Add usage tracking/cost estimation
4. User preference learning (optional)

#### Cost Considerations

**Estimated Usage:**
- Average schedule: 20-30 conflicts
- AI used for: 30% of conflicts (6-9 requests)
- Cost per schedule: $0.09 - $0.45
- Annual cost (4 schedules): $0.36 - $1.80

**Cost Optimization:**
- Only trigger for complex conflicts
- Cache similar conflict solutions
- Batch multiple conflicts in one request
- Use cheaper models for ranking/explanation

#### Alternative: Local AI (Future)

For users concerned about cost/privacy:
- Run smaller models locally (e.g., Llama 3.1 8B)
- One-time setup, no ongoing costs
- Slower but private
- Requires ~8GB GPU or M1/M2 Mac

### Benefits

✅ **Better Resolution Rate** - Solve conflicts the rule system can't handle
✅ **Time Savings** - Reduce manual scheduling time by 20-40%
✅ **Learning System** - Gets better with usage
✅ **Natural Explanations** - Non-technical users understand suggestions
✅ **Creative Solutions** - Finds non-obvious approaches

### Risks & Mitigation

⚠️ **AI Hallucinations** - AI might suggest invalid solutions
- Mitigation: Validate all AI suggestions through existing constraint checker
- Show validation results before applying

⚠️ **API Costs** - Could add up over time
- Mitigation: Set usage limits, cache results, user-provided keys

⚠️ **Latency** - 2-5 second wait for suggestions
- Mitigation: Show loading state, allow user to continue with rule-based while AI loads

⚠️ **API Availability** - External dependency
- Mitigation: Graceful fallback to rule-based system

### Success Metrics

- **Conflict Resolution Rate:** Target 95%+ conflicts resolved (vs ~85% now)
- **Time to Resolve:** Target 30% reduction in average resolution time
- **User Satisfaction:** Survey after using AI suggestions
- **Cost Per Schedule:** Track actual API costs

### Future Enhancements

1. **Learning from History**
   - Store successful resolutions
   - Train on user's preference patterns
   - Suggest based on previous semesters

2. **Proactive Suggestions**
   - AI reviews entire schedule before conflicts arise
   - Suggests optimizations
   - Identifies potential future conflicts

3. **Natural Language Interface**
   - "Move all Friday electives to Thursday"
   - "Balance Dr. Smith's teaching load"
   - "Minimize Monday afternoon classes"

---

## Other Future Enhancements

### 1. Batch Conflict Resolution
- Select multiple similar conflicts
- Apply same resolution strategy to all
- Track success rate

### 2. What-If Analysis
- Preview schedule changes before applying
- Compare multiple resolution strategies
- Simulate impact of constraint changes

### 3. Preference Learning
- Track which suggestions users choose
- Adjust scoring algorithm over time
- Personalize recommendations

### 4. Mobile-Responsive Wizard
- Optimize conflict wizard for tablets
- Touch-friendly interface
- Review schedule on mobile

### 5. Schedule Version Control
- Save multiple schedule versions
- Compare versions side-by-side
- Rollback to previous versions

### 6. Collaborative Scheduling
- Multiple admins work simultaneously
- Real-time conflict updates
- Comment/discussion on conflicts

### 7. Student Schedule Viewer
- Students preview their potential schedules
- Identify enrollment conflicts early
- Provide feedback on timing

---

**Last Updated:** October 21, 2025
**Maintainer:** Development Team
