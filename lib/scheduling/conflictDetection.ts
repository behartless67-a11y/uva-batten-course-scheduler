import {
  Conflict,
  ConflictType,
  ScheduledSection,
  Course,
  Faculty,
  StudentCohort,
  CourseType,
  CourseLevel,
} from '@/types/scheduling';
import { doTimeSlotsOverlap, isTimeDuringBattenHour } from './timeSlots';

export function detectConflicts(
  sections: ScheduledSection[],
  courses: Course[],
  faculty: Faculty[]
): Conflict[] {
  const conflicts: Conflict[] = [];

  // 1. Room double booking
  conflicts.push(...detectRoomConflicts(sections));

  // 2. Faculty double booking
  conflicts.push(...detectFacultyConflicts(sections));

  // 3. Hard constraints violated
  conflicts.push(...detectHardConstraintViolations(sections, faculty));

  // 4. Student cohort overlaps
  conflicts.push(...detectStudentCohortOverlaps(sections, courses));

  // 5. Batten Hour conflicts (Monday 12:30-1:30 for core courses)
  conflicts.push(...detectBattenHourConflicts(sections, courses));

  // 6. Core course overlaps
  conflicts.push(...detectCoreOverlaps(sections, courses));

  // 7. Soft preferences
  conflicts.push(...detectPreferenceViolations(sections, faculty));

  // 8. Too many electives in same slot
  conflicts.push(...detectElectiveOverload(sections, courses));

  // 9. Core course morning/afternoon offerings
  conflicts.push(...detectCoreOfferingRequirements(sections, courses));

  // 10. Parenting partner conflicts
  conflicts.push(...detectParentingPartnerConflicts(sections, faculty));

  // 11. Room capacity issues
  conflicts.push(...detectRoomCapacityIssues(sections));

  return conflicts;
}

function detectRoomConflicts(sections: ScheduledSection[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const roomSchedule = new Map<string, ScheduledSection[]>();

  sections.forEach(section => {
    const key = section.room.id;
    if (!roomSchedule.has(key)) {
      roomSchedule.set(key, []);
    }
    roomSchedule.get(key)!.push(section);
  });

  roomSchedule.forEach((sectionsInRoom, roomId) => {
    for (let i = 0; i < sectionsInRoom.length; i++) {
      for (let j = i + 1; j < sectionsInRoom.length; j++) {
        if (doTimeSlotsOverlap(sectionsInRoom[i].timeSlot, sectionsInRoom[j].timeSlot)) {
          conflicts.push({
            id: `room-conflict-${i}-${j}`,
            type: ConflictType.ROOM_DOUBLE_BOOKED,
            severity: 'error',
            description: `Room ${sectionsInRoom[i].room.name} is double-booked`,
            affectedSections: [sectionsInRoom[i].id, sectionsInRoom[j].id],
          });
        }
      }
    }
  });

  return conflicts;
}

function detectFacultyConflicts(sections: ScheduledSection[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const facultySchedule = new Map<string, ScheduledSection[]>();

  sections.forEach(section => {
    const key = section.facultyId;
    if (!facultySchedule.has(key)) {
      facultySchedule.set(key, []);
    }
    facultySchedule.get(key)!.push(section);
  });

  facultySchedule.forEach((sectionsForFaculty, facultyId) => {
    for (let i = 0; i < sectionsForFaculty.length; i++) {
      for (let j = i + 1; j < sectionsForFaculty.length; j++) {
        if (doTimeSlotsOverlap(sectionsForFaculty[i].timeSlot, sectionsForFaculty[j].timeSlot)) {
          conflicts.push({
            id: `faculty-conflict-${i}-${j}`,
            type: ConflictType.FACULTY_DOUBLE_BOOKED,
            severity: 'error',
            description: `Faculty member is double-booked`,
            affectedSections: [sectionsForFaculty[i].id, sectionsForFaculty[j].id],
          });
        }
      }
    }
  });

  return conflicts;
}

function detectHardConstraintViolations(
  sections: ScheduledSection[],
  faculty: Faculty[]
): Conflict[] {
  const conflicts: Conflict[] = [];
  const facultyMap = new Map(faculty.map(f => [f.id, f]));

  sections.forEach(section => {
    const facultyMember = facultyMap.get(section.facultyId);
    if (!facultyMember) return;

    facultyMember.hardConstraints.forEach(constraint => {
      const violates = checkHardConstraint(section, constraint);
      if (violates) {
        conflicts.push({
          id: `hard-constraint-${section.id}-${constraint.id}`,
          type: ConflictType.HARD_CONSTRAINT_VIOLATED,
          severity: 'error',
          description: `Hard constraint violated: ${constraint.description}`,
          affectedSections: [section.id],
        });
      }
    });
  });

  return conflicts;
}

function checkHardConstraint(section: ScheduledSection, constraint: any): boolean {
  if (constraint.type === 'cannot_teach_day' && constraint.days) {
    return section.timeSlot.days.some(day => constraint.days.includes(day));
  }
  // Add more constraint type checks as needed
  return false;
}

function detectStudentCohortOverlaps(
  sections: ScheduledSection[],
  courses: Course[]
): Conflict[] {
  const conflicts: Conflict[] = [];
  const courseMap = new Map(courses.map(c => [c.id, c]));

  // Group sections by overlapping time slots
  for (let i = 0; i < sections.length; i++) {
    for (let j = i + 1; j < sections.length; j++) {
      if (doTimeSlotsOverlap(sections[i].timeSlot, sections[j].timeSlot)) {
        const course1 = courseMap.get(sections[i].courseId);
        const course2 = courseMap.get(sections[j].courseId);

        if (course1 && course2) {
          const sharedCohorts = findSharedStudentCohorts(
            course1.targetStudents,
            course2.targetStudents
          );

          if (sharedCohorts.length > 0) {
            conflicts.push({
              id: `cohort-overlap-${i}-${j}`,
              type: ConflictType.STUDENT_COHORT_OVERLAP,
              severity: 'error',
              description: `Student cohort conflict: ${sharedCohorts.map(c => `${c.program} Year ${c.year}`).join(', ')}`,
              affectedSections: [sections[i].id, sections[j].id],
              affectedCourses: [course1.id, course2.id],
            });
          }
        }
      }
    }
  }

  return conflicts;
}

function findSharedStudentCohorts(
  cohorts1: StudentCohort[],
  cohorts2: StudentCohort[]
): StudentCohort[] {
  const shared: StudentCohort[] = [];

  cohorts1.forEach(c1 => {
    cohorts2.forEach(c2 => {
      if (c1.year === c2.year && c1.program === c2.program) {
        shared.push(c1);
      }
    });
  });

  return shared;
}

function detectBattenHourConflicts(
  sections: ScheduledSection[],
  courses: Course[]
): Conflict[] {
  const conflicts: Conflict[] = [];
  const courseMap = new Map(courses.map(c => [c.id, c]));

  sections.forEach(section => {
    const course = courseMap.get(section.courseId);
    if (course?.type === CourseType.CORE && isTimeDuringBattenHour(section.timeSlot)) {
      conflicts.push({
        id: `batten-hour-${section.id}`,
        type: ConflictType.BATTEN_HOUR_CONFLICT,
        severity: 'error',
        description: `Core course scheduled during Batten Hour (Monday 12:30-1:30)`,
        affectedSections: [section.id],
      });
    }
  });

  return conflicts;
}

function detectCoreOverlaps(sections: ScheduledSection[], courses: Course[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const courseMap = new Map(courses.map(c => [c.id, c]));

  const coreSections = sections.filter(s => {
    const course = courseMap.get(s.courseId);
    return course?.type === CourseType.CORE;
  });

  // Separate by level
  const undergradCore = coreSections.filter(s => {
    const course = courseMap.get(s.courseId);
    return course?.level === CourseLevel.UNDERGRADUATE;
  });

  const gradCore = coreSections.filter(s => {
    const course = courseMap.get(s.courseId);
    return course?.level === CourseLevel.GRADUATE;
  });

  // Check undergrad overlaps
  for (let i = 0; i < undergradCore.length; i++) {
    for (let j = i + 1; j < undergradCore.length; j++) {
      if (doTimeSlotsOverlap(undergradCore[i].timeSlot, undergradCore[j].timeSlot)) {
        conflicts.push({
          id: `undergrad-core-overlap-${i}-${j}`,
          type: ConflictType.CORE_OVERLAP_UNDERGRAD,
          severity: 'error',
          description: `Undergraduate core courses overlap`,
          affectedSections: [undergradCore[i].id, undergradCore[j].id],
        });
      }
    }
  }

  // Check grad overlaps
  for (let i = 0; i < gradCore.length; i++) {
    for (let j = i + 1; j < gradCore.length; j++) {
      if (doTimeSlotsOverlap(gradCore[i].timeSlot, gradCore[j].timeSlot)) {
        conflicts.push({
          id: `grad-core-overlap-${i}-${j}`,
          type: ConflictType.CORE_OVERLAP_GRAD,
          severity: 'error',
          description: `Graduate core courses overlap`,
          affectedSections: [gradCore[i].id, gradCore[j].id],
        });
      }
    }
  }

  return conflicts;
}

function detectPreferenceViolations(
  sections: ScheduledSection[],
  faculty: Faculty[]
): Conflict[] {
  const conflicts: Conflict[] = [];
  const facultyMap = new Map(faculty.map(f => [f.id, f]));

  sections.forEach(section => {
    const facultyMember = facultyMap.get(section.facultyId);
    if (!facultyMember) return;

    facultyMember.preferences.forEach(pref => {
      if (pref.avoidDays && section.timeSlot.days.some(day => pref.avoidDays!.includes(day))) {
        conflicts.push({
          id: `pref-${section.id}-${pref.id}`,
          type: ConflictType.SOFT_PREFERENCE_VIOLATED,
          severity: 'warning',
          description: `Faculty prefers to avoid teaching on these days`,
          affectedSections: [section.id],
        });
      }
    });
  });

  return conflicts;
}

function detectElectiveOverload(sections: ScheduledSection[], courses: Course[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const courseMap = new Map(courses.map(c => [c.id, c]));

  const electiveSections = sections.filter(s => {
    const course = courseMap.get(s.courseId);
    return course?.type === CourseType.ELECTIVE;
  });

  // Group by time slot
  const slotGroups = new Map<string, ScheduledSection[]>();
  electiveSections.forEach(section => {
    const key = `${section.timeSlot.days.join(',')}-${section.timeSlot.startTime}`;
    if (!slotGroups.has(key)) {
      slotGroups.set(key, []);
    }
    slotGroups.get(key)!.push(section);
  });

  slotGroups.forEach((sectionsInSlot, slotKey) => {
    if (sectionsInSlot.length > 2) {
      conflicts.push({
        id: `elective-overload-${slotKey}`,
        type: ConflictType.TOO_MANY_ELECTIVES_SAME_SLOT,
        severity: 'warning',
        description: `More than 2 electives scheduled in the same time slot`,
        affectedSections: sectionsInSlot.map(s => s.id),
      });
    }
  });

  return conflicts;
}

function detectCoreOfferingRequirements(
  sections: ScheduledSection[],
  courses: Course[]
): Conflict[] {
  const conflicts: Conflict[] = [];
  const courseMap = new Map(courses.map(c => [c.id, c]));

  // Group core courses by course ID
  const coreCourseSections = new Map<string, ScheduledSection[]>();
  sections.forEach(section => {
    const course = courseMap.get(section.courseId);
    if (course?.type === CourseType.CORE) {
      if (!coreCourseSections.has(section.courseId)) {
        coreCourseSections.set(section.courseId, []);
      }
      coreCourseSections.get(section.courseId)!.push(section);
    }
  });

  // Check each core course has morning and afternoon offerings
  coreCourseSections.forEach((sectionsForCourse, courseId) => {
    const hasMorning = sectionsForCourse.some(s => s.timeSlot.isPreferredMorning);
    const hasAfternoon = sectionsForCourse.some(s => s.timeSlot.isPreferredAfternoon);

    if (!hasMorning) {
      conflicts.push({
        id: `no-morning-${courseId}`,
        type: ConflictType.NO_MORNING_CORE_OFFERING,
        severity: 'warning',
        description: `Core course should have at least one morning offering`,
        affectedSections: sectionsForCourse.map(s => s.id),
        affectedCourses: [courseId],
      });
    }

    if (!hasAfternoon) {
      conflicts.push({
        id: `no-afternoon-${courseId}`,
        type: ConflictType.NO_AFTERNOON_CORE_OFFERING,
        severity: 'warning',
        description: `Core course should have at least one afternoon offering`,
        affectedSections: sectionsForCourse.map(s => s.id),
        affectedCourses: [courseId],
      });
    }
  });

  return conflicts;
}

function detectParentingPartnerConflicts(
  sections: ScheduledSection[],
  faculty: Faculty[]
): Conflict[] {
  const conflicts: Conflict[] = [];
  const facultyMap = new Map(faculty.map(f => [f.id, f]));

  // Find all faculty with parenting partners
  const partners = new Map<string, string[]>();
  faculty.forEach(f => {
    if (f.shareParentingWith) {
      if (!partners.has(f.id)) {
        partners.set(f.id, []);
      }
      partners.get(f.id)!.push(f.shareParentingWith);
    }
  });

  // Check for conflicts
  sections.forEach(section1 => {
    const partnerIds = partners.get(section1.facultyId);
    if (!partnerIds) return;

    partnerIds.forEach(partnerId => {
      sections.forEach(section2 => {
        if (section2.facultyId === partnerId && doTimeSlotsOverlap(section1.timeSlot, section2.timeSlot)) {
          conflicts.push({
            id: `parenting-${section1.id}-${section2.id}`,
            type: ConflictType.PARENTING_PARTNER_CONFLICT,
            severity: 'warning',
            description: `Faculty members who share parenting scheduled at the same time`,
            affectedSections: [section1.id, section2.id],
          });
        }
      });
    });
  });

  return conflicts;
}

function detectRoomCapacityIssues(sections: ScheduledSection[]): Conflict[] {
  const conflicts: Conflict[] = [];

  sections.forEach(section => {
    const capacity = section.room.capacity;
    const enrollment = section.enrollmentCap;

    if (enrollment > capacity) {
      conflicts.push({
        id: `over-capacity-${section.id}`,
        type: ConflictType.ROOM_OVER_CAPACITY,
        severity: 'info',
        description: `Enrollment (${enrollment}) exceeds room capacity (${capacity})`,
        affectedSections: [section.id],
      });
    }

    if (enrollment < capacity * 0.5 && capacity > 20) {
      conflicts.push({
        id: `under-utilized-${section.id}`,
        type: ConflictType.ROOM_UNDER_UTILIZED,
        severity: 'info',
        description: `Room is under-utilized (${enrollment} students in ${capacity}-seat room)`,
        affectedSections: [section.id],
      });
    }
  });

  return conflicts;
}
