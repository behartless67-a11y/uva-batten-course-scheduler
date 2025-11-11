# Schedule Versioning Feature Plan

## Overview
Allow users to save multiple versions of schedules with names, timestamps, and the ability to load, compare, and restore previous versions.

## User Stories
1. As a scheduler, I want to save my current schedule with a custom name so I can try different configurations
2. As a scheduler, I want to view a list of all saved schedule versions
3. As a scheduler, I want to load a previously saved version to continue editing it
4. As a scheduler, I want to compare two schedule versions side-by-side
5. As a scheduler, I want to delete old versions I no longer need
6. As a scheduler, I want to export a specific version to Excel

## Technical Design

### 1. Data Structure

```typescript
interface SavedScheduleVersion {
  id: string;                    // Unique identifier (UUID)
  name: string;                  // User-provided name (e.g., "Option A - Morning Focus")
  description?: string;          // Optional notes about this version
  schedule: Schedule;            // The full schedule object
  courses: Course[];             // Course data at time of save
  faculty: Faculty[];            // Faculty data at time of save
  createdAt: Date;              // When this version was created
  updatedAt: Date;              // Last modification time
  metadata: {
    totalSections: number;
    errorCount: number;
    warningCount: number;
    scheduledBy?: string;        // User who created it (future)
  };
}

interface ScheduleVersionStore {
  versions: SavedScheduleVersion[];
  currentVersionId?: string;     // Which version is currently loaded
  lastAutoSaveId?: string;       // Auto-save version (every N minutes)
}
```

### 2. Storage Strategy

**Option A: Browser LocalStorage** (Recommended for v1)
- Pros: Simple, no backend needed, works offline
- Cons: ~5-10MB limit per domain, not synced across devices
- Implementation: Use `localStorage` API with JSON serialization

**Option B: Backend Database** (Future enhancement)
- Pros: Unlimited storage, sync across devices, user accounts
- Cons: Requires backend API, database setup, authentication
- Implementation: REST API + PostgreSQL/MongoDB

**Recommended: Start with LocalStorage, plan for backend migration**

### 3. User Interface Components

#### 3.1 Save Schedule Dialog
Location: Main schedule page, toolbar
- Text input for schedule name
- Optional textarea for description
- "Save as New Version" button
- "Update Current Version" button (if editing existing)
- Shows estimated storage usage

#### 3.2 Versions List Panel
Location: Side panel or modal dialog
- Filterable/searchable list of saved versions
- Each item shows:
  - Name and description
  - Created date (formatted: "Dec 15, 2024 3:45 PM")
  - Conflict summary (X errors, Y warnings)
  - Actions: Load, Rename, Delete, Export, Duplicate
- Sort options: Date (newest/oldest), Name (A-Z), Conflicts (least/most)

#### 3.3 Version Comparison View (Phase 2)
- Side-by-side grid view of two schedule versions
- Highlight differences:
  - Courses that moved time slots (yellow)
  - Faculty reassignments (blue)
  - New/removed sections (green/red)
- Export comparison report

#### 3.4 Auto-Save Indicator
Location: Top-right corner of schedule viewer
- Shows last auto-save time
- Visual indicator when saving
- Option to disable auto-save

### 4. Key Features

#### 4.1 Core Features (Phase 1)
- ✅ Save current schedule with custom name
- ✅ Load previously saved version
- ✅ List all saved versions with metadata
- ✅ Delete unwanted versions
- ✅ Rename existing version
- ✅ Export specific version to Excel
- ✅ Auto-save every 5 minutes (to special "auto-save" slot)
- ✅ Storage usage indicator with warning at 80% capacity

#### 4.2 Enhanced Features (Phase 2)
- 🔄 Duplicate version (save as copy)
- 🔄 Compare two versions side-by-side
- 🔄 Restore from auto-save
- 🔄 Version history timeline view
- 🔄 Add tags/labels to versions (e.g., "Fall 2025", "Draft", "Approved")
- 🔄 Search/filter versions by name, date, tags

#### 4.3 Advanced Features (Phase 3)
- 🔄 Export/import version bundles (share with colleagues)
- 🔄 Cloud sync (requires backend)
- 🔄 Collaborative editing with version control
- 🔄 Approval workflow (draft → review → approved → published)

### 5. Implementation Plan

#### Phase 1: Core Versioning (Estimated: 4-6 hours)

**Step 1: Create Storage Service** (`lib/storage/scheduleVersions.ts`)
```typescript
// CRUD operations for schedule versions
- saveVersion(name, schedule, courses, faculty)
- loadVersion(versionId)
- listVersions()
- deleteVersion(versionId)
- updateVersion(versionId, updates)
```

**Step 2: Add UI Components**
- `components/scheduling/SaveScheduleDialog.tsx`
- `components/scheduling/VersionsListPanel.tsx`
- Update `ScheduleViewer.tsx` to integrate save/load buttons

**Step 3: Add Auto-Save**
- Create `useAutoSave` hook
- Save to special "auto-save" version every 5 minutes
- Show last saved indicator

**Step 4: Storage Management**
- Add storage usage tracker
- Warn user when approaching localStorage limit
- Provide "Clear Old Versions" utility

#### Phase 2: Version Comparison (Estimated: 6-8 hours)
- Create diff algorithm for schedules
- Build comparison view component
- Add "Compare" button to versions list
- Export comparison report

#### Phase 3: Backend Migration (Future)
- Design REST API endpoints
- Set up database schema
- Implement authentication
- Migrate localStorage data to backend

### 6. Technical Considerations

#### 6.1 Data Serialization
- Use `JSON.stringify()` with replacer for Dates
- Compress large schedules using LZ-string library (optional)
- Validate schema on load to handle version changes

#### 6.2 Storage Limits
- LocalStorage typically: 5-10MB per domain
- Monitor usage: `new Blob([JSON.stringify(data)]).size`
- Warn at 80% capacity
- Implement version pruning (keep last N versions)

#### 6.3 Error Handling
- Graceful degradation if localStorage is full
- Handle corrupt data (try to recover or skip)
- Backup before destructive operations

#### 6.4 Performance
- Lazy-load version list (paginate if >50 versions)
- Debounce auto-save to avoid excessive writes
- Use IndexedDB if localStorage becomes limiting

### 7. User Workflow Examples

#### Example 1: Creating Multiple Scenarios
1. User uploads course/faculty data
2. Generates initial schedule → "Version 1 - Initial"
3. Makes manual adjustments, saves as → "Version 2 - More Morning Classes"
4. Tries different approach, saves as → "Version 3 - Balance Afternoon"
5. Compares V2 vs V3, decides V3 is better
6. Exports V3 to Excel for stakeholder review

#### Example 2: Recovering from Mistakes
1. User is editing "Version 2"
2. Makes several changes, realizes they made a mistake
3. Opens Versions panel
4. Loads previous auto-save from 10 minutes ago
5. Continues from that point

#### Example 3: Iterative Refinement
1. User loads "Draft Version" from last week
2. Updates a few faculty assignments
3. Clicks "Update Current Version" (overwrites)
4. Or clicks "Save as New Version" → "Draft v2"

### 8. UI Mockup (Text-Based)

```
┌─────────────────────────────────────────────────────────┐
│  📅 Course Schedule Tool                    [Save ▾] [Versions] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Schedule Grid View]                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘

[Save ▾] dropdown:
  - Save as New Version...
  - Update Current Version
  - Auto-save: ON (last saved 2 min ago)

[Versions] panel (slides in from right):
┌────────────────────────────────────┐
│ Saved Versions          [× Close]  │
├────────────────────────────────────┤
│ 🔍 Search versions...              │
│ Sort: Date (newest first) ▾        │
├────────────────────────────────────┤
│ ○ Fall 2025 - Final Draft          │
│   Dec 15, 2024 3:42 PM             │
│   5 errors, 12 warnings            │
│   [Load] [Export] [Delete] [...]   │
├────────────────────────────────────┤
│ ● Fall 2025 - Option B  (current)  │
│   Dec 15, 2024 2:18 PM             │
│   3 errors, 8 warnings             │
│   [Export] [Rename] [...]          │
├────────────────────────────────────┤
│ ○ Fall 2025 - Initial              │
│   Dec 14, 2024 4:55 PM             │
│   15 errors, 20 warnings           │
│   [Load] [Export] [Delete]         │
├────────────────────────────────────┤
│ 💾 Auto-save                       │
│   Dec 15, 2024 3:38 PM             │
│   [Restore]                        │
└────────────────────────────────────┘
```

### 9. File Structure

```
components/
  scheduling/
    SaveScheduleDialog.tsx       # Save/update version dialog
    VersionsListPanel.tsx         # List of saved versions
    VersionComparison.tsx         # Side-by-side comparison (Phase 2)
    AutoSaveIndicator.tsx         # Shows last saved time

lib/
  storage/
    scheduleVersions.ts           # Core CRUD operations
    localStorage.ts               # LocalStorage wrapper utilities
    compressionUtils.ts           # Optional: compress large schedules

  hooks/
    useAutoSave.ts                # Auto-save logic
    useScheduleVersions.ts        # Hook for version management

types/
  scheduling/
    index.ts                      # Add SavedScheduleVersion interface
```

### 10. Success Metrics
- Users can save and load versions without data loss
- Auto-save prevents accidental work loss
- Storage usage stays under LocalStorage limits
- Loading a version takes < 500ms
- Users report improved workflow efficiency

### 11. Future Enhancements
- Cloud backup (Google Drive / Dropbox integration)
- Multi-user collaboration with conflict resolution
- Schedule templates library
- AI-powered "Suggest Improvements" based on past versions
- Integration with university course management systems

---

## Implementation Priority

**Priority 1 (Must Have for v1):**
- Save schedule with name
- Load saved version
- List versions with metadata
- Delete versions
- Export specific version

**Priority 2 (Should Have):**
- Auto-save functionality
- Rename versions
- Storage usage indicator
- Duplicate version

**Priority 3 (Nice to Have):**
- Version comparison
- Tags/labels
- Advanced search/filter

**Priority 4 (Future):**
- Backend sync
- Collaborative editing
- Approval workflow
