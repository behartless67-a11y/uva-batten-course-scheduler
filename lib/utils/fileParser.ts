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
 * Parse faculty preferences from Excel/CSV file
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

        const faculty: Faculty[] = jsonData.map((row, index) => ({
          id: `faculty-${index + 1}`,
          name: row.facultyName,
          email: row.email,
          preferences: [
            {
              id: `pref-${index + 1}`,
              preferredDays: row.preferredDays
                ? parseDays(row.preferredDays)
                : undefined,
              avoidDays: row.cannotTeachDays
                ? parseDays(row.cannotTeachDays)
                : undefined,
              priority: 'medium',
            },
          ],
          hardConstraints: row.cannotTeachDays
            ? [
                {
                  id: `constraint-${index + 1}`,
                  type: 'cannot_teach_day',
                  days: parseDays(row.cannotTeachDays),
                  description: `Cannot teach on ${row.cannotTeachDays}`,
                },
              ]
            : [],
          shareParentingWith: row.shareParentingWith,
        }));

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
          if (row.notes?.toLowerCase().includes('dell')) {
            preferredRoom = RoomType.DELL;
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
 */
export function exportScheduleToExcel(schedule: any, filename: string = 'schedule.xlsx') {
  // Prepare data for export
  const data = schedule.sections.map((section: any) => ({
    'Course Code': section.course?.code || '',
    'Course Name': section.course?.name || '',
    'Section': section.sectionNumber,
    'Faculty': section.faculty?.name || '',
    'Days': section.timeSlot.days.join(', '),
    'Start Time': section.timeSlot.startTime,
    'End Time': section.timeSlot.endTime,
    'Room': section.room.name,
    'Capacity': section.room.capacity,
    'Enrollment': section.enrollmentCap,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Schedule');

  // Generate file
  XLSX.writeFile(workbook, filename);
}

/**
 * Export conflicts to Excel
 */
export function exportConflictsToExcel(conflicts: any[], filename: string = 'conflicts.xlsx') {
  const data = conflicts.map(conflict => ({
    'Type': conflict.type,
    'Severity': conflict.severity,
    'Description': conflict.description,
    'Affected Sections': conflict.affectedSections.join(', '),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Conflicts');

  XLSX.writeFile(workbook, filename);
}
