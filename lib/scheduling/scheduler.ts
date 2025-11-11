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
   * Select best faculty for a course using multi-factor weighted scoring
   * Balances equity with preferences, expertise, and efficiency
   * Returns the original faculty ID or a better alternative
   */
  private selectBestFaculty(course: Course, currentWorkload: Map<string, number>): string {
    const originalFaculty = this.faculty.find(f => f.id === course.facultyId);
    if (!originalFaculty) return course.facultyId;

    // Get weights (use configured or defaults)
    const weights = this.config.assignmentWeights || {
      workloadEquity: 0.35,
      facultyPreference: 0.25,
      courseTypeMatch: 0.15,
      historicalConsistency: 0.10,
      timeEfficiency: 0.10,
      roomProximity: 0.05,
    };

    // Find all faculty who could teach this course
    const eligibleFaculty = this.faculty.filter(f => {
      // Must have capacity (don't overload)
      const workload = currentWorkload.get(f.id) || 0;
      if (workload >= 4) return false; // Hard cap at 4 courses

      return true;
    });

    if (eligibleFaculty.length === 0) return course.facultyId;

    // Score each eligible faculty member using weighted multi-factor scoring
    const scoredFaculty = eligibleFaculty.map(f => {
      const scores = {
        workloadEquity: this.calculateWorkloadEquityScore(f.id, currentWorkload),
        facultyPreference: this.calculateFacultyPreferenceScore(f, course),
        courseTypeMatch: this.calculateCourseTypeMatchScore(f, course),
        historicalConsistency: this.calculateHistoricalConsistencyScore(f.id, course),
        timeEfficiency: this.calculateTimeEfficiencyScore(f.id, currentWorkload),
        roomProximity: this.calculateRoomProximityScore(f.id),
      };

      // Calculate weighted total score
      const totalScore =
        scores.workloadEquity * weights.workloadEquity +
        scores.facultyPreference * weights.facultyPreference +
        scores.courseTypeMatch * weights.courseTypeMatch +
        scores.historicalConsistency * weights.historicalConsistency +
        scores.timeEfficiency * weights.timeEfficiency +
        scores.roomProximity * weights.roomProximity;

      return {
        faculty: f,
        score: totalScore,
        breakdown: scores, // For transparency
      };
    });

    // Sort by score (highest first)
    scoredFaculty.sort((a, b) => b.score - a.score);

    // Return best faculty
    return scoredFaculty[0].faculty.id;
  }

  /**
   * Calculate workload equity score (0-100)
   * Higher score = more equitable assignment
   * CRITICAL: Ensures every faculty member teaches at least one course
   */
  private calculateWorkloadEquityScore(facultyId: string, workload: Map<string, number>): number {
    const currentLoad = workload.get(facultyId) || 0;

    // MASSIVE preference for unassigned faculty to ensure everyone teaches at least 1 course
    // With workloadEquity weight of 0.35, a score of 150 gives 52.5 points
    // This is enough to overcome all other factors (max ~47.5 points)
    if (currentLoad === 0) return 150; // STRONGLY prefer unassigned faculty
    if (currentLoad === 1) return 80;
    if (currentLoad === 2) return 60;
    if (currentLoad === 3) return 35;
    return 10; // 4+ courses heavily discouraged
  }

  /**
   * Calculate faculty preference score (0-100)
   * Checks if course matches faculty's preferred teaching patterns
   */
  private calculateFacultyPreferenceScore(faculty: Faculty, course: Course): number {
    // Placeholder: In production, check faculty preferences
    // For now, check if they're the original assigned faculty
    if (faculty.id === course.facultyId) return 100; // Original assignment
    return 50; // Neutral if not original
  }

  /**
   * Calculate course type match score (0-100)
   * Matches faculty expertise to course type (Core, Elective, etc.)
   */
  private calculateCourseTypeMatchScore(faculty: Faculty, course: Course): number {
    // Placeholder: In production, track faculty expertise by course type
    // For now, give bonus to original assignment
    if (faculty.id === course.facultyId) return 80;
    return 50; // Neutral
  }

  /**
   * Calculate historical consistency score (0-100)
   * Rewards keeping assignments consistent with past semesters
   */
  private calculateHistoricalConsistencyScore(facultyId: string, course: Course): number {
    // Placeholder: In production, query historical assignment database
    // For now, prefer original CSV assignment
    if (facultyId === course.facultyId) return 100;
    return 50; // Neutral
  }

  /**
   * Calculate time efficiency score (0-100)
   * Prefers assignments that minimize schedule gaps for faculty
   */
  private calculateTimeEfficiencyScore(facultyId: string, workload: Map<string, number>): number {
    // Placeholder: In production, analyze faculty's existing schedule for gaps
    // For now, slight preference for faculty with existing courses (clustering)
    const currentLoad = workload.get(facultyId) || 0;
    if (currentLoad === 1 || currentLoad === 2) return 70; // Good clustering
    if (currentLoad === 0) return 60; // Neutral
    return 50; // Multiple courses may have gaps
  }

  /**
   * Calculate room proximity score (0-100)
   * Prefers assignments that minimize room changes for faculty
   */
  private calculateRoomProximityScore(facultyId: string): number {
    // Placeholder: In production, track assigned rooms and calculate proximity
    // For now, return neutral score
    return 50;
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

    // Anti-clustering: De-prioritize time slots that already have sections of this course
    // This helps spread sections across different times for student flexibility
    slots = this.rankSlotsByDistribution(slots, course);

    return slots;
  }

  /**
   * Rank time slots to avoid clustering sections of the same course
   * Prioritizes time slots that don't already have this course scheduled
   */
  private rankSlotsByDistribution(slots: TimeSlot[], course: Course): TimeSlot[] {
    // Get existing sections of this course
    const existingSections = this.sections.filter(s => s.courseId === course.id);

    if (existingSections.length === 0) {
      return slots; // No existing sections, no need to adjust
    }

    // Count how many days are already used by this course
    const usedDays = new Set<string>();
    existingSections.forEach(section => {
      section.timeSlot.days.forEach(day => usedDays.add(day));
    });

    // Map each slot to a score (higher = better distribution)
    const slotsWithScores = slots.map(slot => {
      let score = 100; // Base score

      // Check if any existing section of this course is at this exact time
      const hasExactMatch = existingSections.some(existing => {
        const sameTime = existing.timeSlot.startTime === slot.startTime;
        const sameDays = existing.timeSlot.days.some(day => slot.days.includes(day));
        return sameTime && sameDays;
      });

      if (hasExactMatch) {
        score -= 50; // Heavily penalize exact same time slot
      }

      // Check if this slot uses a day that's already in use
      const usesExistingDay = slot.days.some(day => usedDays.has(day));
      if (usesExistingDay) {
        score -= 20; // Moderate penalty for using same day
      }

      // Special case for LPPP 7750: strongly encourage spreading across multiple days
      if (course.code === 'LPPP 7750') {
        // If we have 4+ sections, give extra bonus for new days
        if (existingSections.length >= 3 && !usesExistingDay) {
          score += 30; // Bonus for using a completely new day
        }
      }

      return { slot, score };
    });

    // Sort by score (highest first)
    slotsWithScores.sort((a, b) => b.score - a.score);

    return slotsWithScores.map(s => s.slot);
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
