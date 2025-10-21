# UVA Batten Course Scheduling Tool

[![Next.js](https://img.shields.io/badge/Next.js-15.1.6-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-UVA-orange)](https://www.virginia.edu/)

An automated course scheduling application for the UVA Frank Batten School of Leadership and Public Policy. This tool uses constraint satisfaction problem (CSP) algorithms with greedy fallback to generate optimal course schedules while respecting faculty preferences, room constraints, and student cohort requirements.

**Built for:** Heather and the UVA Batten Course Scheduling Team
**Developed:** October 2025
**Status:** Production Ready

## Features

### Core Scheduling Engine

- **Automated Schedule Generation**: CSP-based algorithm that automatically assigns time slots and rooms
- **Constraint Satisfaction**: Enforces hard and soft constraints including:
  - Faculty availability and preferences
  - Room capacity and priority assignment (Dell → Rouss → Pavilion VIII)
  - Student cohort conflicts
  - Batten Hour protection (Monday 12:30-1:30)
  - Core course distribution (morning/afternoon offerings)
  - Parenting partner considerations
  - Elective distribution limits

- **Smart File Upload**: Import faculty preferences and course data from Excel/CSV files
  - Intelligent column matching (handles variations in column names)
  - Support for both .xlsx and .csv formats
  - Validation and error reporting

- **Conflict Detection**: Automatic detection and visualization of scheduling conflicts
- **Multiple Views**: Grid (calendar) and list views for schedule visualization
- **Search & Filter**: Filter by course level, search by course code or faculty name
- **Export Functionality**: Export schedules and conflicts to Excel

### Faculty Preference Collection System 🆕

- **Online Submission Form** (`/faculty-submit`): Faculty can submit teaching preferences remotely
  - Preferred teaching days
  - Days they cannot teach
  - Time slot preferences
  - Parenting partner information
  - Additional notes and constraints

- **Admin Dashboard** (`/admin`): Manage all faculty submissions
  - View all submissions in sortable table
  - Search and filter by faculty name or email
  - Export to Excel with one click
  - Delete outdated submissions
  - Real-time data refresh

- **Flexible Storage**:
  - Mock storage for local development (no setup required)
  - Azure Table Storage integration for production (optional)

📖 **See [FACULTY_SUBMISSION_SETUP.md](FACULTY_SUBMISSION_SETUP.md) for detailed setup guide**

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone or navigate to the project directory:
```bash
cd CourseSchedulingTool
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Usage

### Step 1: Upload Data

Upload two files:

1. **Faculty Preferences** (Excel/CSV) with columns:
   - `facultyName`: Name of the faculty member
   - `email`: Email address (optional)
   - `preferredDays`: Comma-separated preferred days (e.g., "Monday, Wednesday")
   - `cannotTeachDays`: Comma-separated days they cannot teach
   - `shareParentingWith`: Name of partner faculty (optional)

2. **Course Data** (Excel/CSV) with columns:
   - `code`: Course code (e.g., "LPPA 7110")
   - `name`: Course name
   - `type`: Core, Elective, Capstone, or Advanced Project
   - `faculty`: Faculty member name
   - `enrollmentCap`: Maximum enrollment
   - `numberOfSections`: Number of sections to create
   - `numberOfDiscussions`: Number of discussion sections (optional)
   - `duration`: Duration in minutes (e.g., 80, 150)
   - `sessionsPerWeek`: 1, 2, or 3
   - `targetPrograms`: Target student programs (optional)
   - `notes`: Additional notes (optional)

### Step 2: Configure Settings

- Select semester (Fall/Spring) and year
- Set maximum electives per time slot
- Enable/disable Friday electives
- Configure Batten Hour enforcement
- Set preference for mixed electives (undergrad + grad)

### Step 3: Generate & View Schedule

- Click "Generate Schedule" to run the CSP algorithm
- View conflicts in the Conflict Panel
- Switch between Grid and List views
- Search and filter courses
- Export schedule and conflicts to Excel

## Scheduling Constraints

### Hard Constraints (Must be satisfied)

1. **No Room Double Booking**: Rooms cannot be assigned to multiple sections at the same time
2. **No Faculty Double Booking**: Faculty cannot teach multiple sections at the same time
3. **Faculty Hard Constraints**: Faculty "cannot teach" days must be respected
4. **Student Cohort Conflicts**: Core courses for the same cohort cannot overlap
5. **Batten Hour**: No core courses during Monday 12:30-1:30
6. **Core Course Overlaps**: Undergraduate and graduate core courses cannot overlap within their levels
7. **Parenting Partner Conflicts**: Faculty who share parenting cannot be scheduled simultaneously

### Soft Constraints (Preferences)

1. **Faculty Preferences**: Preferred days and times (when possible)
2. **Elective Distribution**: Maximum 2 electives per time slot
3. **Mixed Electives**: Prefer 1 undergraduate + 1 graduate elective per slot
4. **Core Offerings**: Each core should have morning and afternoon sections
5. **Thursday Evenings**: Minimize discussion sections after 5pm on Thursday
6. **Friday Restrictions**: Avoid Friday electives unless explicitly allowed

### Room Assignment Priority

1. **Dell** (60 capacity): Large lectures, single-section core courses
2. **Rouss Hall** (48 capacity): Medium-sized courses, multi-section cores
3. **Pavilion VIII** (18 capacity): Small electives, capstones
4. **UREG Assigned**: Everything else (registrar assigns)

## Project Structure

```
CourseSchedulingTool/
├── app/
│   ├── api/
│   │   └── schedules/          # REST API endpoints
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Main application page
├── components/
│   └── scheduling/
│       ├── FileUploadSection.tsx    # File upload UI
│       ├── ConflictPanel.tsx        # Conflict visualization
│       └── ScheduleViewer.tsx       # Schedule grid/list views
├── lib/
│   ├── scheduling/
│   │   ├── scheduler.ts             # CSP algorithm
│   │   ├── conflictDetection.ts     # Conflict checking
│   │   ├── roomAssignment.ts        # Room assignment logic
│   │   └── timeSlots.ts             # Time slot utilities
│   └── utils/
│       └── fileParser.ts            # Excel/CSV parsing
├── types/
│   └── scheduling/
│       └── index.ts                 # TypeScript definitions
└── package.json
```

## Technologies Used

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS (UVA Batten styling)
- **xlsx**: Excel file parsing and export
- **Lucide React**: Icon library

## Algorithm Details

The scheduler uses a **Constraint Satisfaction Problem (CSP)** approach with:

- **Backtracking**: Systematically tries different time slot and room assignments
- **Forward Checking**: Prunes invalid assignments early
- **Constraint Propagation**: Detects conflicts before completion
- **Variable Ordering**: Schedules most constrained courses first (core courses, limited time slots)
- **Value Ordering**: Ranks time slots by faculty preference

## Future Enhancements

- Drag-and-drop schedule editing
- Manual override capabilities
- Database persistence (currently in-memory)
- Multi-user authentication
- Schedule version history
- Advanced optimization (minimize gaps, cluster courses by program)
- Integration with UVA SIS

## License

Copyright © 2025 UVA Frank Batten School of Leadership and Public Policy

## Important Documents

- **[REQUIREMENTS.md](REQUIREMENTS.md)** - Comprehensive scheduling requirements and constraints (UPDATE THIS FREQUENTLY!)
- **[CourseSchedulingCriteria.docx](CourseSchedulingCriteria.docx)** - Original requirements document from Judy

## Architecture Overview

```
CourseSchedulingTool/
├── app/                          # Next.js App Router
│   ├── api/schedules/           # REST API for schedule CRUD
│   ├── page.tsx                 # Main application page
│   ├── layout.tsx               # Root layout with fonts
│   └── globals.css              # Global styles
│
├── components/scheduling/        # React components
│   ├── FileUploadSection.tsx   # Excel/CSV file upload
│   ├── ConflictPanel.tsx       # Conflict visualization
│   └── ScheduleViewer.tsx      # Grid and list views
│
├── lib/scheduling/              # Core scheduling logic
│   ├── scheduler.ts            # CSP algorithm + greedy fallback
│   ├── conflictDetection.ts    # Constraint checking
│   ├── roomAssignment.ts       # Room priority assignment
│   └── timeSlots.ts            # Time slot utilities
│
├── lib/utils/                   # Helper utilities
│   ├── fileParser.ts           # Excel/CSV parsing
│   └── timeFormat.ts           # 12-hour time formatting
│
├── types/scheduling/            # TypeScript definitions
│   └── index.ts                # All type definitions
│
└── public/                      # Static assets
    ├── garrett-hall-sunset.jpg # Background image
    └── templates/              # Sample CSV templates
        ├── faculty-template.csv
        └── course-template.csv
```

## Algorithm Details

### Two-Phase Scheduling Approach

1. **Phase 1: CSP Backtracking (Primary)**
   - Variable ordering: Most constrained courses first (core > electives)
   - Value ordering: Faculty preference-ranked time slots
   - Forward checking: Prunes invalid assignments early
   - Constraint propagation: Detects conflicts before completion

2. **Phase 2: Greedy Fallback (If Phase 1 Fails)**
   - Schedules sections one by one
   - Takes first available slot that doesn't violate hard constraints
   - More lenient than backtracking - ignores some soft constraints
   - Guarantees partial schedule even with tight constraints

### Constraint Hierarchy

1. **Hard Constraints** (Never violated)
   - Room/faculty double booking
   - Faculty hard availability
   - Student cohort conflicts
   - Batten Hour protection

2. **Soft Constraints** (Honored when possible)
   - Faculty preferences
   - Elective distribution limits
   - Core morning/afternoon offerings
   - Parenting partner considerations

## Troubleshooting

### Schedule Generation Fails
- **Problem:** "Unable to generate schedule"
- **Solutions:**
  1. Enable Friday electives in configuration
  2. Increase max electives per slot
  3. Check faculty preferences for conflicts
  4. Reduce number of sections if possible

### Some Sections Not Scheduled
- **Problem:** Partial schedule (e.g., 17 of 26 sections)
- **Cause:** Insufficient time slots or too many conflicts
- **Solutions:**
  1. Review conflict panel for specific issues
  2. Adjust course durations (e.g., 80 min → 75 min)
  3. Allow more flexibility in time preferences
  4. Manually assign problem courses after auto-generation

### File Upload Errors
- **Problem:** "Failed to parse files"
- **Solutions:**
  1. Ensure Excel/CSV files match template format exactly
  2. Check for special characters in faculty names
  3. Verify all required columns are present
  4. Use sample templates as reference

### Room Capacity Issues
- **Problem:** Enrollment exceeds room capacity
- **Solutions:**
  1. Increase room capacity in room definitions
  2. Split course into multiple sections
  3. Manually assign larger room in schedule viewer

## Deployment

### Local Development
```bash
npm run dev
# Open http://localhost:3000
```

### Production Build
```bash
npm run build
npm start
```

### Azure Static Web Apps Deployment
```bash
# Build for static export
npm run build

# Deploy to Azure
az staticwebapp deploy \
  --name batten-course-scheduler \
  --source ./out \
  --app-location ./
```

## Contributing

### Making Changes to Requirements

1. Update [REQUIREMENTS.md](REQUIREMENTS.md) with new constraints
2. Update version number and change log
3. Test scheduling with new requirements
4. Update sample templates if needed
5. Commit changes with descriptive message

### Adding New Features

1. Create feature branch: `git checkout -b feature/your-feature`
2. Implement changes
3. Test thoroughly with sample data
4. Update documentation
5. Create pull request

## Contact

For questions or support:
- **Primary Contact:** Judy (Course Scheduling Coordinator)
- **Developer:** [Your contact info]
- **Department:** UVA Frank Batten School of Leadership and Public Policy
- **Issues:** Use GitHub Issues for bug reports and feature requests

## License

Copyright © 2025 University of Virginia - Frank Batten School of Leadership and Public Policy
All rights reserved.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/) and [TypeScript](https://www.typescriptlang.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/) using UVA Batten branding
- Excel parsing via [xlsx](https://www.npmjs.com/package/xlsx)
- Icons from [Lucide React](https://lucide.dev/)
