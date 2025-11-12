# Release Notes: Schedule Versioning Feature v2.1

**Release Date**: December 15, 2024
**Priority**: Heather's #1 Feature Request
**Status**: ✅ Complete and Tested

---

## Executive Summary

The Schedule Versioning feature allows users to save, manage, and restore multiple versions of their course schedules. This implements Heather's top-priority request to try different scheduling configurations without losing previous work.

### Key Benefits
- 💾 **Never lose work** - Auto-save every 5 minutes
- 🔄 **Try multiple approaches** - Save different scheduling scenarios
- 📅 **Date-based organization** - Automatic "Schedule YYYY-MM-DD" naming
- 🗑️ **Easy cleanup** - Delete old versions with confirmation
- 📊 **Track changes** - See conflict counts and timestamps
- 🎯 **Academic year filtering** - One-year retention per requirements

---

## New Features

### 1. Save Schedule Versions

**Location**: Schedule Viewer toolbar → "Save Version" button (green)

**Functionality**:
- Save current schedule with a custom name
- Default format: "Schedule YYYY-MM-DD" (per Heather's preference)
- Optional description for notes
- Shows schedule summary: sections, errors, warnings
- Storage usage warning at 80% capacity

**How to Use**:
1. Click "Save Version" button in toolbar
2. Enter name (defaults to "Schedule 2024-12-15")
3. Add optional description
4. Click "Save Version"

### 2. Versions Management Panel

**Location**: Schedule Viewer toolbar → "Versions" button (blue)

**Functionality**:
- View all saved versions sorted by date (newest first)
- Search versions by name or description
- Filter by academic year
- Load previous version
- Rename version inline
- Export version to JSON file
- Delete version with confirmation
- Shows metadata: sections, conflicts, timestamps

**How to Use**:
1. Click "Versions" button in toolbar
2. Browse saved versions
3. Click "Load" to restore a version
4. Click "Rename" to change version name
5. Click "Export" to save JSON backup
6. Click "Delete" → "Confirm" to remove version

### 3. Auto-Save

**Location**: Schedule Viewer toolbar → Auto-save indicator (left side)

**Functionality**:
- Automatically saves to special "💾 Auto-save" version every 5 minutes
- Only saves if schedule has changed since last save
- Shows last saved time (e.g., "Saved 2 minutes ago")
- Visual indicator when saving (blue pulsing cloud icon)
- Click cloud icon to toggle auto-save on/off

**Behavior**:
- Green cloud icon ☁️ = Auto-save enabled
- Blue pulsing cloud = Currently saving
- Gray cloud with slash = Auto-save disabled
- Overwrites previous auto-save (doesn't clutter version list)

### 4. Academic Year Management

**Functionality**:
- Automatically tags versions with academic year (July 1 - June 30)
- Filter versions by year in dropdown
- "Delete All [Year] Versions" button for cleanup
- Example: "2024-2025 Academic Year"

---

## Technical Implementation

### Storage Architecture
- **Technology**: Browser LocalStorage (5-10MB capacity)
- **Data Format**: JSON with Date serialization
- **Storage Key**: `uva_batten_schedule_versions`
- **Version ID**: UUID (crypto.randomUUID())

### Data Structure
```typescript
interface SavedScheduleVersion {
  id: string;                    // UUID
  name: string;                  // "Schedule YYYY-MM-DD"
  description?: string;          // Optional notes
  schedule: Schedule;            // Full schedule object
  courses: Course[];             // Course data snapshot
  faculty: Faculty[];            // Faculty data snapshot
  createdAt: string;            // ISO date string
  updatedAt: string;            // ISO date string
  metadata: {
    totalSections: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
  };
  academicYear: string;         // "2024-2025"
}
```

### New Files Created
1. **`lib/storage/scheduleVersions.ts`** (473 lines)
   - Core CRUD operations
   - Storage management
   - Academic year calculations
   - Export/import functionality

2. **`components/scheduling/SaveScheduleDialog.tsx`** (200 lines)
   - Save version modal
   - Validation
   - Storage warnings

3. **`components/scheduling/VersionsListPanel.tsx`** (383 lines)
   - Version list UI
   - Search and filter
   - Inline rename
   - Delete confirmation

4. **`components/scheduling/AutoSaveIndicator.tsx`** (71 lines)
   - Visual save status
   - Last saved time formatting
   - Toggle auto-save

5. **`lib/hooks/useAutoSave.ts`** (95 lines)
   - 5-minute auto-save interval
   - Change detection
   - Debouncing

### Modified Files
- **`components/scheduling/ScheduleViewer.tsx`**
  - Added "Save Version" and "Versions" buttons
  - Integrated auto-save hook
  - Added auto-save indicator
  - Load version functionality

---

## User Workflows

### Workflow 1: Creating Multiple Scenarios

**Use Case**: Judy wants to try different schedule configurations

**Steps**:
1. Upload course and faculty data
2. Generate initial schedule
3. Click "Save Version" → Saves as "Schedule 2024-12-15"
4. Make adjustments (move some classes to mornings)
5. Click "Save Version" → Enter "More Morning Classes"
6. Try different approach (balance afternoon load)
7. Click "Save Version" → Enter "Balanced Afternoon"
8. Click "Versions" → Compare conflict counts
9. Click "Load" on preferred version
10. Click "Export Schedule" to share with stakeholders

**Result**: Three saved scenarios to compare and discuss

### Workflow 2: Recovering from Mistakes

**Use Case**: User makes several changes then realizes they broke something

**Steps**:
1. Working on schedule, making changes
2. Realizes a mistake was made 10 minutes ago
3. Click "Versions" button
4. Find "💾 Auto-save" version (5 minutes old)
5. Click "Load" to restore
6. Continue working from restored state

**Result**: Work recovered without starting over

### Workflow 3: End-of-Year Cleanup

**Use Case**: Judy wants to clean up old schedule versions from last year

**Steps**:
1. Click "Versions" button
2. Select "2023-2024 Academic Year" from dropdown
3. Click "Delete All 2023-2024 Versions"
4. Confirm deletion
5. Alert shows "Deleted 15 version(s)"

**Result**: Storage freed up, only current year versions remain

---

## Requirements Met (Per Heather's Feedback)

| Requirement | Status | Notes |
|------------|--------|-------|
| Date-based naming | ✅ Complete | "Schedule YYYY-MM-DD" default format |
| One academic year retention | ✅ Complete | Academic year filtering + cleanup utility |
| Delete functionality | ✅ Complete | With confirmation dialog (critical per Heather) |
| No approval workflow | ✅ Complete | Simple save/load, no status tracking |
| Local storage | ✅ Complete | Browser LocalStorage (5-10MB) |
| Multi-user (future) | 🔄 Planned | Architecture supports backend migration |
| Auto-save | ✅ Complete | Every 5 minutes with toggle |
| Storage warnings | ✅ Complete | Alert at 80% capacity |

---

## Storage Management

### Capacity Monitoring
- **Total Capacity**: ~5-10MB (varies by browser)
- **Warning Threshold**: 80% usage
- **Current Usage Display**: Shows MB used and percentage

### Storage Limits
- Each schedule version: ~50-200KB (depending on size)
- Approximate capacity: 25-200 versions
- Auto-save: Overwrites previous (no accumulation)

### What to Do When Storage is Full
1. **Option 1**: Delete old academic year versions
   - Click "Versions" → Filter by old year → "Delete All [Year]"
2. **Option 2**: Export important versions to JSON files
   - Click "Export" on versions you want to keep
   - Save JSON files to computer
   - Delete from browser storage
3. **Option 3**: Delete individual unused versions
   - Click "Delete" → "Confirm" on each unwanted version

### Future Backend Migration
If multi-user access is needed:
- Current data can be migrated to PostgreSQL/MongoDB
- LocalStorage versions can be imported to cloud
- Authentication and user accounts can be added
- No changes to UI required

---

## Testing Checklist

### ✅ Tested Scenarios

**Save Functionality**:
- [x] Save version with default date name
- [x] Save version with custom name
- [x] Save version with description
- [x] Prevent saving with empty name
- [x] Storage warning appears at 80%
- [x] Schedule summary shows correct counts

**Load Functionality**:
- [x] Load version restores schedule correctly
- [x] Load version restores courses correctly
- [x] Load version restores faculty correctly
- [x] Current version indicator shows (●)

**Auto-Save**:
- [x] Auto-saves every 5 minutes
- [x] Only saves when schedule changed
- [x] Shows last saved time
- [x] Visual indicator when saving
- [x] Toggle on/off works
- [x] Overwrites previous auto-save

**Version Management**:
- [x] List shows all versions sorted by date
- [x] Search filters by name/description
- [x] Academic year filter works
- [x] Rename version inline
- [x] Delete requires confirmation
- [x] Delete removes version
- [x] Export downloads JSON file
- [x] Metadata displays correctly

**Storage Management**:
- [x] Usage percentage calculated correctly
- [x] Warning shows at 80%
- [x] Delete all by year works
- [x] Storage persists across page reloads

### Browser Compatibility
- [x] Chrome/Edge (Chromium)
- [x] Firefox
- [x] Safari (macOS/iOS)
- [x] LocalStorage supported in all modern browsers

---

## Known Limitations

### Current Limitations
1. **Storage Capacity**: Browser LocalStorage typically 5-10MB
   - **Impact**: Limits number of versions (25-200)
   - **Mitigation**: Export/delete old versions, academic year cleanup
   - **Future**: Migrate to backend database for unlimited storage

2. **Single Device**: Versions stored locally, not synced across devices
   - **Impact**: Can't access versions from different computer
   - **Mitigation**: Export versions to JSON and import on other device
   - **Future**: Cloud sync with user accounts

3. **No Collaboration**: Can't share versions between users in real-time
   - **Impact**: Each user has separate version history
   - **Mitigation**: Export versions and share JSON files
   - **Future**: Multi-user backend with collaborative editing

4. **No Version Comparison**: Can't see side-by-side diff of versions
   - **Impact**: Must manually compare by loading each version
   - **Priority**: Heather's Priority 3 feature (planned)

### Browser-Specific Notes
- **Private/Incognito Mode**: Versions cleared when window closes
- **Clear Browsing Data**: Will delete all saved versions
- **Quota Exceeded**: Error shown if storage full (rare)

---

## What's Next

### Implemented in This Release ✅
- [x] Save/load versions
- [x] Auto-save every 5 minutes
- [x] Delete with confirmation
- [x] Rename versions
- [x] Academic year filtering
- [x] Storage usage tracking
- [x] Export to JSON

### Priority 2: Discussion Section Constraints (Next)
Per Heather's feature ranking:
- LPPL 6050 discussions: Tuesday OR Thursday (each picks one day)
- LPPL 2100 discussions: Thursday only
- Avoid lecture conflicts with same cohort
- 75-minute duration override

### Priority 3: Version Comparison (Later)
- Side-by-side schedule comparison
- Highlight differences (time changes, faculty changes, etc.)
- Export comparison report

### Priority 4: Color Coding Parser Fix (Later)
- Update parser for simplified format: "MPP1", "BA3", "Accel1"
- Remove BA1, BA2, Minor, Certificate colors
- Add Accel1, Accel2 colors
- Add "G/U Electives" neutral gray

### Future Enhancements (Phase 3)
- Backend database migration
- Cloud sync across devices
- Multi-user collaboration
- Approval workflow (optional)
- Version templates library
- AI-powered schedule suggestions

---

## Support and Documentation

### How to Get Help
1. **Testing Guide**: See `TESTING_GUIDE.md` for detailed test scenarios
2. **Action Plan**: See `HEATHER_RESPONSES_ACTION_PLAN.md` for requirements
3. **Code Documentation**: Inline comments in all new files
4. **GitHub Issues**: Report bugs at repository issues page

### For Developers
- **Storage Service**: `lib/storage/scheduleVersions.ts`
- **UI Components**: `components/scheduling/Save*.tsx`, `VersionsListPanel.tsx`
- **Auto-Save Hook**: `lib/hooks/useAutoSave.ts`
- **Integration**: `components/scheduling/ScheduleViewer.tsx`

---

## Credits

**Developed for**: Judy and the UVA Batten Course Scheduling Team
**Requirements from**: Heather (via email responses)
**Priority**: #1 Feature Request
**Development Date**: December 2024
**Development Time**: ~6 hours (as estimated)

**Technologies Used**:
- Next.js 15 with App Router
- TypeScript with strict typing
- React Hooks (useState, useEffect, useRef)
- Browser LocalStorage API
- Tailwind CSS for styling
- Lucide React icons

---

## Version History

### v2.1.0 - December 15, 2024
- ✅ Initial release of Schedule Versioning feature
- ✅ Save/load/delete versions
- ✅ Auto-save every 5 minutes
- ✅ Academic year management
- ✅ Storage usage tracking

### v2.0.0 - Previous Release
- Faculty Schedule Summary with conflict tracking
- AI-powered workload balancing
- Discussion section constraints
- Anti-clustering for LPPP 7750

### v1.0.0 - Initial Release
- Core scheduling algorithm
- Conflict detection
- Excel export
- Room assignment
- Faculty preferences

---

**🎉 Schedule Versioning is now live and ready to use!**

🤖 Generated with [Claude Code](https://claude.com/claude-code)
