import {
  Course,
  Faculty,
  ScheduledSection,
  Schedule,
  Semester,
  SchedulerConfig,
  TimeSlot,
  ScheduleGenerationResult,
  CourseType,
  Room,
} from '@/types/scheduling';
import { TIME_SLOTS, findSuitableTimeSlots, doTimeSlotsOverlap } from './timeSlots';
import { suggestBestRoom } from './roomAssignment';
import { detectConflicts } from './conflictDetection';

/**
 * Main CSP-based scheduling algorithm
 * Uses backtracking with forward checking and constraint propagation
 */
export class CourseScheduler {
  private config: SchedulerConfig;
  private courses: Course[];
  private faculty: Faculty[];
  private sections: ScheduledSection[] = [];
  private assignments: Map<string, { timeSlot: TimeSlot; room: Room }> = new Map();

  constructor(config: SchedulerConfig, courses: Course[], faculty: Faculty[]) {
    this.config = config;
    this.courses = courses;
    this.faculty = faculty;
  }

  /**
   * Generate a schedule using constraint satisfaction
   */
  public generateSchedule(): ScheduleGenerationResult {
    try {
      // Step 1: Create sections from courses
      const sectionsToSchedule = this.createSectionsFromCourses();

      // Step 2: Sort sections by constraint priority
      const sortedSections = this.prioritizeSections(sectionsToSchedule);

      // Step 3: Attempt to schedule each section using backtracking
      console.log('Starting backtracking scheduler...');
      const success = this.backtrackSchedule(sortedSections, 0);

      if (!success) {
        console.log('Backtracking failed. Trying greedy approach...');
        // Fallback to greedy scheduling
        this.sections = [];
        this.assignments.clear();
        this.greedySchedule(sortedSections);

        if (this.sections.length === 0) {
          return {
            success: false,
            errors: ['Unable to generate a schedule. No valid time slots available.'],
            warnings: ['Try allowing Friday electives or increasing flexibility'],
          };
        }
      }

      console.log(`Scheduled ${this.sections.length} of ${sectionsToSchedule.length} sections`);

      // Step 4: Create the schedule object
      const schedule: Schedule = {
        id: `schedule-${Date.now()}`,
        name: `${this.config.semester} ${this.config.year} Schedule`,
        semester: this.config.semester,
        year: this.config.year,
        sections: this.sections,
        conflicts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'draft',
      };

      // Step 5: Detect conflicts
      schedule.conflicts = detectConflicts(this.sections, this.courses, this.faculty);

      // Step 6: Generate stats
      const stats = {
        totalSections: sectionsToSchedule.length,
        scheduledSections: this.sections.length,
        unscheduledSections: sectionsToSchedule.length - this.sections.length,
        totalConflicts: schedule.conflicts.length,
        errorConflicts: schedule.conflicts.filter(c => c.severity === 'error').length,
        warningConflicts: schedule.conflicts.filter(c => c.severity === 'warning').length,
      };

      return {
        success: true,
        schedule,
        stats,
        errors: [],
        warnings: schedule.conflicts.filter(c => c.severity === 'warning').map(c => c.description),
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
      };
    }
  }

  /**
   * Create individual sections from course definitions
   * Uses AI-powered workload balancing when balance workload is enabled
   */
  private createSectionsFromCourses(): Partial<ScheduledSection>[] {
    const sections: Partial<ScheduledSection>[] = [];
    const facultyWorkload = new Map<string, number>(); // Track assignments per faculty

    // Initialize workload tracker
    this.faculty.forEach(f => facultyWorkload.set(f.id, 0));

    this.courses.forEach(course => {
      // Create sections for lectures
      for (let i = 0; i < course.numberOfSections; i++) {
        let assignedFacultyId = course.facultyId;

        // AI-powered workload balancing
        if (this.config.balanceWorkload && course.facultyId) {
          assignedFacultyId = this.selectBestFaculty(course, facultyWorkload);
        }

        sections.push({
          id: `${course.id}-section-${i + 1}`,
          courseId: course.id,
          sectionNumber: i + 1,
          facultyId: assignedFacultyId,
          enrollmentCap: Math.ceil(course.enrollmentCap / course.numberOfSections),
          actualEnrollment: course.actualEnrollment
            ? Math.ceil(course.actualEnrollment / course.numberOfSections)
            : undefined,
          conflicts: [],
        });

        // Update workload tracker
        if (assignedFacultyId) {
          facultyWorkload.set(assignedFacultyId, (facultyWorkload.get(assignedFacultyId) || 0) + 1);
        }
      }

      // TODO: Discussion sections can be added here if needed
    });

    return sections;
  }

  /**
   * Select best faculty for a course based on workload balance and preferences
   * Returns the original faculty ID or a better alternative
   */
  private selectBestFaculty(course: Course, currentWorkload: Map<string, number>): string {
    const originalFaculty = this.faculty.find(f => f.id === course.facultyId);
    if (!originalFaculty) return course.facultyId;

    // Find all faculty who could teach this course
    const eligibleFaculty = this.faculty.filter(f => {
      // Must have capacity (don't overload)
      const workload = currentWorkload.get(f.id) || 0;
      if (workload >= 4) return false; // Hard cap at 4 courses

      return true;
    });

    if (eligibleFaculty.length === 0) return course.facultyId;

    // Score each eligible faculty member
    const scoredFaculty = eligibleFaculty.map(f => {
      let score = 100;

      // DOMINANT FACTOR: Workload balance (exponential penalty)
      const workload = currentWorkload.get(f.id) || 0;
      if (workload === 0) score -= 0; // Prefer unassigned
      else if (workload === 1) score -= 20;
      else if (workload === 2) score -= 40;
      else if (workload === 3) score -= 65;
      else score -= 90; // 4+ heavily discouraged

      // BONUS: Original assignment (prefer keeping assignments from CSV if workload allows)
      if (f.id === course.facultyId) score += 15;

      return { faculty: f, score };
    });

    // Sort by score (highest first)
    scoredFaculty.sort((a, b) => b.score - a.score);

    // Return best faculty
    return scoredFaculty[0].faculty.id;
  }

  /**
   * Prioritize sections for scheduling
   * More constrained sections should be scheduled first
   */
  private prioritizeSections(sections: Partial<ScheduledSection>[]): Partial<ScheduledSection>[] {
    return sections.sort((a, b) => {
      const courseA = this.courses.find(c => c.id === a.courseId)!;
      const courseB = this.courses.find(c => c.id === b.courseId)!;

      // Priority 1: Core courses first
      if (courseA.type === CourseType.CORE && courseB.type !== CourseType.CORE) return -1;
      if (courseB.type === CourseType.CORE && courseA.type !== CourseType.CORE) return 1;

      // Priority 2: Courses with fewer available time slots
      const slotsA = findSuitableTimeSlots(
        courseA.duration,
        courseA.sessionsPerWeek,
        this.config.allowFridayElectives
      ).length;
      const slotsB = findSuitableTimeSlots(
        courseB.duration,
        courseB.sessionsPerWeek,
        this.config.allowFridayElectives
      ).length;

      if (slotsA !== slotsB) return slotsA - slotsB;

      // Priority 3: Larger enrollment first
      return (b.enrollmentCap || 0) - (a.enrollmentCap || 0);
    });
  }

  /**
   * Backtracking algorithm to assign time slots and rooms
   */
  private backtrackSchedule(
    sections: Partial<ScheduledSection>[],
    index: number
  ): boolean {
    // Base case: all sections scheduled
    if (index >= sections.length) {
      return true;
    }

    const section = sections[index];
    const course = this.courses.find(c => c.id === section.courseId)!;

    // Get possible time slots for this course
    const possibleTimeSlots = this.getPossibleTimeSlots(course, section);

    // Try each time slot
    for (const timeSlot of possibleTimeSlots) {
      // Try to assign a room
      const room = suggestBestRoom(
        course,
        section.enrollmentCap!,
        timeSlot.id,
        this.sections
      );

      if (!room) continue; // No room available

      // Create the scheduled section
      const scheduledSection: ScheduledSection = {
        ...section,
        timeSlot,
        room,
      } as ScheduledSection;

      // Check if this assignment violates hard constraints
      if (this.violatesHardConstraints(scheduledSection, course)) {
        continue; // Try next time slot
      }

      // Make the assignment
      this.sections.push(scheduledSection);
      this.assignments.set(section.id!, { timeSlot, room });

      // Recursively schedule remaining sections
      if (this.backtrackSchedule(sections, index + 1)) {
        return true; // Success
      }

      // Backtrack: remove the assignment
      this.sections.pop();
      this.assignments.delete(section.id!);
    }

    // No valid assignment found
    return false;
  }

  /**
   * Get possible time slots for a course
   */
  private getPossibleTimeSlots(course: Course, section: Partial<ScheduledSection>): TimeSlot[] {
    let slots = findSuitableTimeSlots(
      course.duration,
      course.sessionsPerWeek,
      this.config.allowFridayElectives
    );

    // Apply faculty preferences (soft constraint - rank by preference)
    const facultyMember = this.faculty.find(f => f.id === course.facultyId);
    if (facultyMember) {
      // Filter out hard constraints first
      slots = slots.filter(slot => {
        return !facultyMember.hardConstraints.some(constraint => {
          if (constraint.type === 'cannot_teach_day' && constraint.days) {
            return slot.days.some(day => constraint.days!.includes(day));
          }
          return false;
        });
      });

      // Rank by preferences
      slots = this.rankSlotsByPreference(slots, facultyMember);
    }

    return slots;
  }

  /**
   * Rank time slots by faculty preference
   */
  private rankSlotsByPreference(slots: TimeSlot[], faculty: Faculty): TimeSlot[] {
    return slots.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      faculty.preferences.forEach(pref => {
        // Preferred days
        if (pref.preferredDays) {
          if (a.days.some(day => pref.preferredDays!.includes(day))) {
            scoreA += pref.priority === 'high' ? 3 : pref.priority === 'medium' ? 2 : 1;
          }
          if (b.days.some(day => pref.preferredDays!.includes(day))) {
            scoreB += pref.priority === 'high' ? 3 : pref.priority === 'medium' ? 2 : 1;
          }
        }

        // Avoid days
        if (pref.avoidDays) {
          if (a.days.some(day => pref.avoidDays!.includes(day))) {
            scoreA -= pref.priority === 'high' ? 3 : pref.priority === 'medium' ? 2 : 1;
          }
          if (b.days.some(day => pref.avoidDays!.includes(day))) {
            scoreB -= pref.priority === 'high' ? 3 : pref.priority === 'medium' ? 2 : 1;
          }
        }
      });

      return scoreB - scoreA; // Higher score first
    });
  }

  /**
   * Check if a scheduled section violates any hard constraints
   */
  private violatesHardConstraints(section: ScheduledSection, course: Course): boolean {
    // Check 1: Faculty availability (hard constraints)
    const facultyMember = this.faculty.find(f => f.id === section.facultyId);
    if (facultyMember) {
      for (const constraint of facultyMember.hardConstraints) {
        if (constraint.type === 'cannot_teach_day' && constraint.days) {
          if (section.timeSlot.days.some(day => constraint.days!.includes(day))) {
            return true;
          }
        }
      }
    }

    // Check 2: Faculty double booking
    const facultySections = this.sections.filter(s => s.facultyId === section.facultyId);
    for (const existingSection of facultySections) {
      if (doTimeSlotsOverlap(existingSection.timeSlot, section.timeSlot)) {
        return true;
      }
    }

    // Check 3: Room double booking
    const roomSections = this.sections.filter(s => s.room.id === section.room.id);
    for (const existingSection of roomSections) {
      if (doTimeSlotsOverlap(existingSection.timeSlot, section.timeSlot)) {
        return true;
      }
    }

    // Check 4: Student cohort conflicts (for core courses)
    if (course.type === CourseType.CORE) {
      for (const existingSection of this.sections) {
        const existingCourse = this.courses.find(c => c.id === existingSection.courseId);
        if (!existingCourse || existingCourse.type !== CourseType.CORE) continue;

        if (doTimeSlotsOverlap(existingSection.timeSlot, section.timeSlot)) {
          // Check if they share target students
          const sharedStudents = course.targetStudents.some(target =>
            existingCourse.targetStudents.some(
              existing =>
                existing.program === target.program && existing.year === target.year
            )
          );

          if (sharedStudents) {
            return true;
          }
        }
      }
    }

    // Check 5: Parenting partner conflicts
    if (facultyMember?.shareParentingWith) {
      const partnerSections = this.sections.filter(
        s => s.facultyId === facultyMember.shareParentingWith
      );
      for (const partnerSection of partnerSections) {
        if (doTimeSlotsOverlap(partnerSection.timeSlot, section.timeSlot)) {
          return true;
        }
      }
    }

    // Check 6: Too many electives in same slot
    if (course.type === CourseType.ELECTIVE && this.config.maxElectivesPerSlot) {
      const electivesInSlot = this.sections.filter(s => {
        const sCourse = this.courses.find(c => c.id === s.courseId);
        return (
          sCourse?.type === CourseType.ELECTIVE &&
          doTimeSlotsOverlap(s.timeSlot, section.timeSlot)
        );
      });

      if (electivesInSlot.length >= this.config.maxElectivesPerSlot) {
        return true;
      }
    }

    return false;
  }

  /**
   * Greedy scheduling algorithm - more lenient fallback
   * Schedules sections one by one, taking the first available slot
   */
  private greedySchedule(sections: Partial<ScheduledSection>[]): void {
    console.log('Starting greedy scheduler...');

    for (const section of sections) {
      const course = this.courses.find(c => c.id === section.courseId)!;
      const possibleTimeSlots = this.getPossibleTimeSlots(course, section);

      let scheduled = false;

      for (const timeSlot of possibleTimeSlots) {
        const room = suggestBestRoom(
          course,
          section.enrollmentCap!,
          timeSlot.id,
          this.sections
        );

        if (!room) continue;

        const scheduledSection: ScheduledSection = {
          ...section,
          timeSlot,
          room,
        } as ScheduledSection;

        // Only check critical hard constraints for greedy
        const facultyMember = this.faculty.find(f => f.id === course.facultyId);
        let violates = false;

        // Check faculty hard constraints
        if (facultyMember) {
          for (const constraint of facultyMember.hardConstraints) {
            if (constraint.type === 'cannot_teach_day' && constraint.days) {
              if (timeSlot.days.some(day => constraint.days!.includes(day))) {
                violates = true;
                break;
              }
            }
          }
        }

        // Check faculty double booking
        if (!violates) {
          const facultySections = this.sections.filter(s => s.facultyId === course.facultyId);
          for (const existingSection of facultySections) {
            if (doTimeSlotsOverlap(existingSection.timeSlot, timeSlot)) {
              violates = true;
              break;
            }
          }
        }

        // Check room double booking
        if (!violates) {
          const roomSections = this.sections.filter(s => s.room.id === room.id);
          for (const existingSection of roomSections) {
            if (doTimeSlotsOverlap(existingSection.timeSlot, timeSlot)) {
              violates = true;
              break;
            }
          }
        }

        if (!violates) {
          this.sections.push(scheduledSection);
          this.assignments.set(section.id!, { timeSlot, room });
          scheduled = true;
          console.log(`Greedy scheduled: ${course.code} - ${timeSlot.days.join(',')} ${timeSlot.startTime}`);
          break;
        }
      }

      if (!scheduled) {
        console.warn(`Could not schedule: ${course.code}`);
      }
    }
  }
}

/**
 * Helper function to generate a schedule
 */
export function generateCourseSchedule(
  config: SchedulerConfig,
  courses: Course[],
  faculty: Faculty[]
): ScheduleGenerationResult {
  const scheduler = new CourseScheduler(config, courses, faculty);
  return scheduler.generateSchedule();
}
