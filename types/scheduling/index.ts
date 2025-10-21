// Enums and Constants
export enum Semester {
  FALL = 'Fall',
  SPRING = 'Spring',
}

export enum DayOfWeek {
  MONDAY = 'Monday',
  TUESDAY = 'Tuesday',
  WEDNESDAY = 'Wednesday',
  THURSDAY = 'Thursday',
  FRIDAY = 'Friday',
}

export enum CourseLevel {
  UNDERGRADUATE = 'Undergraduate', // < 5000
  GRADUATE = 'Graduate', // >= 5000
}

export enum CourseType {
  CORE = 'Core',
  ELECTIVE = 'Elective',
  CAPSTONE = 'Capstone',
  ADVANCED_PROJECT = 'Advanced Project',
}

export enum RoomType {
  DELL = 'Dell',
  ROUSS = 'Rouss Hall',
  PAVILION_VIII = 'Pavilion VIII',
  UREG_ASSIGNED = 'UREG Assigned',
}

export const ROOM_CAPACITIES = {
  [RoomType.DELL]: 60,
  [RoomType.ROUSS]: 48,
  [RoomType.PAVILION_VIII]: 18,
  [RoomType.UREG_ASSIGNED]: 30, // Default
};

// Time Slots
export interface TimeSlot {
  id: string;
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  days: DayOfWeek[];
  isPreferredMorning?: boolean; // For core courses
  isPreferredAfternoon?: boolean; // For core courses
}

// Room
export interface Room {
  id: string;
  name: string;
  type: RoomType;
  capacity: number;
}

// Faculty
export interface Faculty {
  id: string;
  name: string;
  email?: string;
  preferences: FacultyPreference[];
  hardConstraints: HardConstraint[];
  shareParentingWith?: string; // Faculty ID of partner
}

export interface FacultyPreference {
  id: string;
  preferredDays?: DayOfWeek[];
  preferredTimeSlots?: string[]; // TimeSlot IDs
  avoidDays?: DayOfWeek[];
  avoidTimeSlots?: string[]; // TimeSlot IDs
  priority: 'high' | 'medium' | 'low'; // Soft constraints
}

export interface HardConstraint {
  id: string;
  type: 'cannot_teach_day' | 'cannot_teach_time' | 'must_teach_time' | 'custom';
  days?: DayOfWeek[];
  timeSlots?: string[]; // TimeSlot IDs
  description: string;
}

// Course
export interface Course {
  id: string;
  code: string; // e.g., "LPPA 7110"
  name: string;
  type: CourseType;
  level: CourseLevel;
  facultyId: string;
  enrollmentCap: number;
  actualEnrollment?: number;
  numberOfSections: number;
  numberOfDiscussions?: number;
  studentsPerDiscussion?: number;

  // Special requirements
  requiresLargeLectureHall?: boolean;
  requiresSmallRoom?: boolean;
  preferredRoom?: RoomType;
  duration: number; // In minutes
  sessionsPerWeek: number; // 1, 2, or 3

  // Targeting
  targetStudents: StudentCohort[];

  // Notes
  notes?: string;
}

export interface StudentCohort {
  year: 1 | 2 | 3 | 4;
  program: 'MPP_Postgrad' | 'MPP_Accel' | 'BA' | 'Minor' | 'Cert';
  count: number;
}

// Scheduled Section
export interface ScheduledSection {
  id: string;
  courseId: string;
  sectionNumber: number;
  timeSlot: TimeSlot;
  room: Room;
  facultyId: string;
  enrollmentCap: number;
  actualEnrollment?: number;
  conflicts: Conflict[];
}

// Conflict Detection
export interface Conflict {
  id: string;
  type: ConflictType;
  severity: 'error' | 'warning' | 'info';
  description: string;
  affectedSections: string[]; // ScheduledSection IDs
  affectedCourses?: string[]; // Course IDs
}

export enum ConflictType {
  // Hard conflicts (errors)
  ROOM_DOUBLE_BOOKED = 'Room Double Booked',
  FACULTY_DOUBLE_BOOKED = 'Faculty Double Booked',
  HARD_CONSTRAINT_VIOLATED = 'Hard Constraint Violated',
  STUDENT_COHORT_OVERLAP = 'Student Cohort Overlap',
  BATTEN_HOUR_CONFLICT = 'Batten Hour Conflict', // Monday 12:30-1:30
  CORE_OVERLAP_UNDERGRAD = 'Undergraduate Core Overlap',
  CORE_OVERLAP_GRAD = 'Graduate Core Overlap',

  // Soft conflicts (warnings)
  SOFT_PREFERENCE_VIOLATED = 'Faculty Preference Violated',
  TOO_MANY_ELECTIVES_SAME_SLOT = 'Too Many Electives in Same Slot',
  NO_MORNING_CORE_OFFERING = 'No Morning Core Offering',
  NO_AFTERNOON_CORE_OFFERING = 'No Afternoon Core Offering',
  PARENTING_PARTNER_CONFLICT = 'Parenting Partner Conflict',

  // Info
  ROOM_OVER_CAPACITY = 'Room Over Capacity',
  ROOM_UNDER_UTILIZED = 'Room Under Utilized',
}

// Schedule
export interface Schedule {
  id: string;
  name: string;
  semester: Semester;
  year: number;
  sections: ScheduledSection[];
  conflicts: Conflict[];
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'in_progress' | 'completed' | 'published';
}

// Import/Export formats
export interface FacultyPreferenceUpload {
  facultyName: string;
  email?: string;
  preferredDays?: string; // Comma-separated
  preferredTimes?: string; // Comma-separated
  cannotTeachDays?: string; // Comma-separated
  cannotTeachTimes?: string; // Comma-separated
  shareParentingWith?: string;
  notes?: string;
}

export interface CourseDataUpload {
  code: string;
  name: string;
  type: string;
  level: string;
  faculty: string;
  enrollmentCap: number;
  numberOfSections: number;
  numberOfDiscussions?: number;
  duration: number;
  sessionsPerWeek: number;
  targetPrograms?: string; // Comma-separated
  notes?: string;
}

// Scheduler Configuration
export interface SchedulerConfig {
  semester: Semester;
  year: number;
  allowFridayElectives: boolean;
  battenHourEnabled: boolean; // Monday 12:30-1:30
  maxElectivesPerSlot: number;
  preferMixedElectives: boolean; // 1 undergrad + 1 grad per slot
  avoidThursdayDiscussionsAfter5pm: boolean;
}

// API Response types
export interface ScheduleGenerationResult {
  success: boolean;
  schedule?: Schedule;
  errors?: string[];
  warnings?: string[];
  stats?: {
    totalSections: number;
    scheduledSections: number;
    unscheduledSections: number;
    totalConflicts: number;
    errorConflicts: number;
    warningConflicts: number;
  };
}
