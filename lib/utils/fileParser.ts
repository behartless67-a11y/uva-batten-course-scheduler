import * as XLSX from 'xlsx';
import {
  Course,
  Faculty,
  FacultyPreferenceUpload,
  CourseDataUpload,
  DayOfWeek,
  CourseType,
  CourseLevel,
  RoomType,
} from '@/types/scheduling';

/**
 * Smart column value getter - handles column name variations
 * Tries multiple possible column names (case-insensitive, ignores spaces/underscores)
 */
function getColumnValue(row: any, possibleNames: string[]): any {
  // Direct match first
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
      return row[name];
    }
  }

  // Case-insensitive and normalized match
  const keys = Object.keys(row);
  const normalize = (str: string) => str.toLowerCase().replace(/[_\s-]/g, '');

  for (const possibleName of possibleNames) {
    const normalizedPossible = normalize(possibleName);
    const match = keys.find(k => {
      const normalizedKey = normalize(k);
      return normalizedKey === normalizedPossible ||
        normalizedKey.includes(normalizedPossible) ||
        normalizedPossible.includes(normalizedKey);
    });
    if (match && row[match] !== undefined && row[match] !== null && row[match] !== '') {
      return row[match];
    }
  }

  return undefined;
}

/**
 * Parse faculty preferences from Excel/CSV file
 * Now with smart column matching!
 */
export function parseFacultyPreferences(file: File): Promise<Faculty[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: FacultyPreferenceUpload[] = XLSX.utils.sheet_to_json(worksheet);

        const faculty: Faculty[] = jsonData.map((row, index) => {
          // Smart column matching
          const name = getColumnValue(row, ['facultyName', 'name', 'faculty', 'instructor', 'professor']);
          const email = getColumnValue(row, ['email', 'emailAddress', 'mail']);
          const preferredDays = getColumnValue(row, ['preferredDays', 'preferred_days', 'prefers', 'prefersDays']);
          const cannotTeachDays = getColumnValue(row, ['cannotTeachDays', 'cannot_teach_days', 'avoidDays', 'avoid_days', 'unavailable']);
          const shareParenting = getColumnValue(row, ['shareParentingWith', 'share_parenting_with', 'partner', 'partnerFaculty']);

          return {
            id: `faculty-${index + 1}`,
            name: name || `Faculty ${index + 1}`,
            email: email,
            preferences: [
              {
                id: `pref-${index + 1}`,
                preferredDays: preferredDays ? parseDays(preferredDays) : undefined,
                avoidDays: cannotTeachDays ? parseDays(cannotTeachDays) : undefined,
                priority: 'medium',
              },
            ],
            hardConstraints: cannotTeachDays
              ? [
                  {
                    id: `constraint-${index + 1}`,
                    type: 'cannot_teach_day',
                    days: parseDays(cannotTeachDays),
                    description: `Cannot teach on ${cannotTeachDays}`,
                  },
                ]
              : [],
            shareParentingWith: shareParenting,
          };
        });

        resolve(faculty);
      } catch (error) {
        reject(new Error('Failed to parse faculty preferences file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Parse combined course and faculty data from a single Excel/CSV file
 * This is the new unified upload format
 */
export function parseCombinedData(file: File): Promise<{ faculty: Faculty[], courses: Course[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Build unique faculty list from rows
        const facultyMap = new Map<string, Faculty>();
        const courses: Course[] = [];

        jsonData.forEach((row: any, index) => {
          // Extract faculty info using smart column matching
          const facultyName = getColumnValue(row, ['faculty', 'facultyName', 'instructor', 'professor']);
          const email = getColumnValue(row, ['facultyEmail', 'email', 'emailAddress']);
          const preferredDays = getColumnValue(row, ['facultyPreferredDays', 'preferredDays', 'preferred_days']);
          const cannotTeachDays = getColumnValue(row, ['facultyCannotTeachDays', 'cannotTeachDays', 'cannot_teach_days']);
          const shareParenting = getColumnValue(row, ['shareParentingWith', 'share_parenting_with', 'partner']);

          // Add or update faculty in map
          if (facultyName && !facultyMap.has(facultyName)) {
            const facultyId = `faculty-${facultyMap.size + 1}`;
            facultyMap.set(facultyName, {
              id: facultyId,
              name: facultyName,
              email: email,
              preferences: [
                {
                  id: `pref-${facultyId}`,
                  preferredDays: preferredDays ? parseDays(preferredDays) : undefined,
                  avoidDays: cannotTeachDays ? parseDays(cannotTeachDays) : undefined,
                  priority: 'medium',
                },
              ],
              hardConstraints: cannotTeachDays
                ? [
                    {
                      id: `constraint-${facultyId}`,
                      type: 'cannot_teach_day',
                      days: parseDays(cannotTeachDays),
                      description: `Cannot teach on ${cannotTeachDays}`,
                    },
                  ]
                : [],
              shareParentingWith: shareParenting,
            });
          }

          // Parse course data
          const code = getColumnValue(row, ['code', 'courseCode', 'course_code']);
          const name = getColumnValue(row, ['name', 'courseName', 'course_name', 'title']);
          const type = getColumnValue(row, ['type', 'courseType', 'course_type']);
          const enrollmentCap = getColumnValue(row, ['enrollmentCap', 'enrollment_cap', 'capacity', 'enrollment']);
          const numberOfSections = getColumnValue(row, ['numberOfSections', 'number_of_sections', 'sections']);
          const numberOfDiscussions = getColumnValue(row, ['numberOfDiscussions', 'number_of_discussions', 'discussions']);
          const duration = getColumnValue(row, ['duration', 'length', 'minutes']);
          const sessionsPerWeek = getColumnValue(row, ['sessionsPerWeek', 'sessions_per_week', 'sessions']);
          const targetPrograms = getColumnValue(row, ['targetPrograms', 'target_programs', 'cohort', 'cohorts', 'programs']);
          const notes = getColumnValue(row, ['notes', 'comments', 'description']);

          // Parse course type
          let courseType = CourseType.ELECTIVE;
          const typeStr = (type || '').toLowerCase();
          if (typeStr.includes('core')) courseType = CourseType.CORE;
          else if (typeStr.includes('capstone')) courseType = CourseType.CAPSTONE;
          else if (typeStr.includes('advanced')) courseType = CourseType.ADVANCED_PROJECT;

          // Parse course level based on course code
          const courseNumber = parseInt(code?.match(/\d+/)?.[0] || '0');
          const level =
            courseNumber >= 5000 ? CourseLevel.GRADUATE : CourseLevel.UNDERGRADUATE;

          // Parse preferred room if specified
          let preferredRoom: RoomType | undefined;
          if (notes?.toLowerCase().includes('monroe')) {
            preferredRoom = RoomType.MONROE_120;
          } else if (notes?.toLowerCase().includes('rouss')) {
            preferredRoom = RoomType.ROUSS;
          } else if (notes?.toLowerCase().includes('pavilion')) {
            preferredRoom = RoomType.PAVILION_VIII;
          }

          const facultyMember = facultyMap.get(facultyName);

          courses.push({
            id: `course-${index + 1}`,
            code: code,
            name: name,
            type: courseType,
            level,
            facultyId: facultyMember?.id || `faculty-unknown-${index}`,
            enrollmentCap: parseInt(enrollmentCap) || 0,
            numberOfSections: parseInt(numberOfSections) || 1,
            numberOfDiscussions: numberOfDiscussions ? parseInt(numberOfDiscussions) : undefined,
            duration: parseInt(duration) || 50,
            sessionsPerWeek: parseInt(sessionsPerWeek) || 2,
            targetStudents: parseTargetPrograms(targetPrograms),
            preferredRoom,
            notes: notes,
            requiresLargeLectureHall: (parseInt(numberOfSections) || 1) === 1 && courseType === CourseType.CORE,
            requiresSmallRoom: courseType === CourseType.CAPSTONE,
          });
        });

        resolve({
          faculty: Array.from(facultyMap.values()),
          courses: courses,
        });
      } catch (error) {
        console.error('Parse error:', error);
        reject(new Error('Failed to parse combined course/faculty file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Parse course data from Excel/CSV file
 */
export function parseCourseData(file: File, faculty: Faculty[]): Promise<Course[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: CourseDataUpload[] = XLSX.utils.sheet_to_json(worksheet);

        const courses: Course[] = jsonData.map((row, index) => {
          // Find faculty by name
          const facultyMember = faculty.find(f =>
            f.name.toLowerCase().includes(row.faculty.toLowerCase())
          );

          // Parse course type
          let courseType = CourseType.ELECTIVE;
          const typeStr = row.type.toLowerCase();
          if (typeStr.includes('core')) courseType = CourseType.CORE;
          else if (typeStr.includes('capstone')) courseType = CourseType.CAPSTONE;
          else if (typeStr.includes('advanced')) courseType = CourseType.ADVANCED_PROJECT;

          // Parse course level based on course code
          const courseNumber = parseInt(row.code.match(/\d+/)?.[0] || '0');
          const level =
            courseNumber >= 5000 ? CourseLevel.GRADUATE : CourseLevel.UNDERGRADUATE;

          // Parse preferred room if specified
          let preferredRoom: RoomType | undefined;
          if (row.notes?.toLowerCase().includes('monroe')) {
            preferredRoom = RoomType.MONROE_120;
          } else if (row.notes?.toLowerCase().includes('rouss')) {
            preferredRoom = RoomType.ROUSS;
          } else if (row.notes?.toLowerCase().includes('pavilion')) {
            preferredRoom = RoomType.PAVILION_VIII;
          }

          return {
            id: `course-${index + 1}`,
            code: row.code,
            name: row.name,
            type: courseType,
            level,
            facultyId: facultyMember?.id || `faculty-unknown-${index}`,
            enrollmentCap: row.enrollmentCap,
            numberOfSections: row.numberOfSections || 1,
            numberOfDiscussions: row.numberOfDiscussions,
            duration: row.duration,
            sessionsPerWeek: row.sessionsPerWeek,
            targetStudents: parseTargetPrograms(row.targetPrograms),
            preferredRoom,
            notes: row.notes,
            requiresLargeLectureHall: row.numberOfSections === 1 && courseType === CourseType.CORE,
            requiresSmallRoom: courseType === CourseType.CAPSTONE,
          };
        });

        resolve(courses);
      } catch (error) {
        reject(new Error('Failed to parse course data file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Parse comma-separated days into DayOfWeek array
 */
function parseDays(daysStr: string): DayOfWeek[] {
  const dayMap: Record<string, DayOfWeek> = {
    mon: DayOfWeek.MONDAY,
    monday: DayOfWeek.MONDAY,
    tue: DayOfWeek.TUESDAY,
    tuesday: DayOfWeek.TUESDAY,
    wed: DayOfWeek.WEDNESDAY,
    wednesday: DayOfWeek.WEDNESDAY,
    thu: DayOfWeek.THURSDAY,
    thursday: DayOfWeek.THURSDAY,
    fri: DayOfWeek.FRIDAY,
    friday: DayOfWeek.FRIDAY,
  };

  return daysStr
    .split(',')
    .map(day => dayMap[day.trim().toLowerCase()])
    .filter(Boolean);
}

/**
 * Parse target programs from comma-separated string
 */
function parseTargetPrograms(programsStr?: string): any[] {
  if (!programsStr) return [
    {
      year: 1,
      program: 'BA',
      count: 0,
    }
  ];

  // Simple parsing - you can enhance this based on your data format
  const programs = programsStr.split(',').map(p => p.trim());

  const parsed = programs.map(program => {
    // Example: "MPP Year 1" or "BA Year 3"
    const match = program.match(/(MPP|BA|Minor|Cert)\s*Year\s*(\d)/i);

    if (match) {
      return {
        year: parseInt(match[2]) as 1 | 2 | 3 | 4,
        program: match[1].toUpperCase() as any,
        count: 0, // Will be calculated elsewhere
      };
    }

    // Try to parse just the program name
    const programOnly = program.match(/(MPP|BA|Minor|Cert)/i);
    if (programOnly) {
      return {
        year: 1 as 1 | 2 | 3 | 4,
        program: programOnly[1].toUpperCase() as any,
        count: 0,
      };
    }

    return null;
  }).filter(Boolean);

  return parsed.length > 0 ? parsed : [{
    year: 1 as 1 | 2 | 3 | 4,
    program: 'BA' as any,
    count: 0,
  }];
}

/**
 * Export schedule to Excel
 * Column names match template format for consistency
 */
export function exportScheduleToExcel(schedule: any, filename: string = 'schedule.xlsx') {
  // Prepare data for export - using template-compatible column names
  const data = schedule.sections.map((section: any) => ({
    'code': section.course?.code || '',
    'name': section.course?.name || '',
    'type': section.course?.type || '',
    'faculty': section.faculty?.name || '',
    'sectionNumber': section.sectionNumber,
    'days': section.timeSlot.days.join(','),
    'startTime': section.timeSlot.startTime,
    'endTime': section.timeSlot.endTime,
    'room': section.room.name,
    'building': section.room.building || '',
    'roomCapacity': section.room.capacity,
    'enrollmentCap': section.enrollmentCap,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Schedule');

  // Generate file
  XLSX.writeFile(workbook, filename);
}

/**
 * Export conflicts to Excel
 * Uses lowercase column names for consistency
 */
export function exportConflictsToExcel(conflicts: any[], filename: string = 'conflicts.xlsx') {
  const data = conflicts.map(conflict => ({
    'type': conflict.type,
    'severity': conflict.severity,
    'description': conflict.description,
    'affectedSections': conflict.affectedSections.join(','),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Conflicts');

  XLSX.writeFile(workbook, filename);
}
