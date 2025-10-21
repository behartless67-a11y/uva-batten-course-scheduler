'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Lightbulb, ChevronRight } from 'lucide-react';
import { Conflict, ScheduledSection, Faculty, Course, TimeSlot, DayOfWeek } from '@/types/scheduling';
import { formatTimeRange12Hour } from '@/lib/utils/timeFormat';
import { TIME_SLOTS } from '@/lib/scheduling/timeSlots';

interface ConflictResolutionWizardProps {
  conflicts: Conflict[];
  sections: ScheduledSection[];
  faculty: Faculty[];
  courses: Course[];
  onResolveConflict: (conflictId: string, resolution: ConflictResolution) => void;
  onClose: () => void;
}

export interface ConflictResolution {
  type: 'reassign_faculty' | 'reschedule_section' | 'mark_reviewed' | 'undo';
  sectionId: string;
  newFacultyId?: string;
  newTimeSlot?: TimeSlot;
  notes?: string;
  previousState?: {
    facultyId?: string;
    timeSlot?: TimeSlot;
  };
}

interface ConflictSuggestion {
  description: string;
  resolution: ConflictResolution;
  score: number; // 0-100, higher is better
  cascadingIssues?: string[];
  affectedSections?: number;
}

export default function ConflictResolutionWizard({
  conflicts,
  sections,
  faculty,
  courses,
  onResolveConflict,
  onClose,
}: ConflictResolutionWizardProps) {
  const [currentConflictIndex, setCurrentConflictIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<ConflictSuggestion[]>([]);
  const [resolvedConflicts, setResolvedConflicts] = useState<Set<string>>(new Set());
  const [resolutionHistory, setResolutionHistory] = useState<Array<{conflictId: string, resolution: ConflictResolution}>>([]);

  const currentConflict = conflicts[currentConflictIndex];
  const progress = ((currentConflictIndex + 1) / conflicts.length) * 100;

  useEffect(() => {
    if (currentConflict) {
      generateSuggestions(currentConflict);
    }
  }, [currentConflictIndex]);

  const generateSuggestions = (conflict: Conflict) => {
    const newSuggestions: ConflictSuggestion[] = [];
    // Get the first affected section
    const sectionId = conflict.affectedSections[0];
    if (!sectionId) return;
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const course = courses.find(c => c.id === section.courseId);
    const currentFaculty = faculty.find(f => f.id === section.facultyId);

    // Build conflict context for detailed descriptions
    const conflictContext = buildConflictContext(conflict, section, currentFaculty);

    // Suggestion 1: Find alternative faculty for any conflict
    const availableFaculty = findAvailableFaculty(section, conflict);
    availableFaculty.slice(0, 3).forEach(f => {
      const facultyDetails = getFacultyReassignmentDetails(f, section, currentFaculty, course);
      const resolution: ConflictResolution = {
        type: 'reassign_faculty',
        sectionId: section.id,
        newFacultyId: f.id,
        previousState: {
          facultyId: section.facultyId,
        },
      };
      const cascadingIssues = checkCascadingEffects(resolution, section);

      newSuggestions.push({
        description: `Reassign to ${f.name} - ${facultyDetails}`,
        resolution,
        score: calculateFacultyScore(f, section, course) - (cascadingIssues.length * 20),
        cascadingIssues,
      });
    });

    // Suggestion 2: Find alternative time slots for any conflict
    const availableTimeSlots = findAvailableTimeSlots(section);
    availableTimeSlots.slice(0, 3).forEach(timeSlot => {
      const rescheduleDetails = getRescheduleDetails(timeSlot, section, currentFaculty, conflictContext);
      const resolution: ConflictResolution = {
        type: 'reschedule_section',
        sectionId: section.id,
        newTimeSlot: timeSlot,
        previousState: {
          timeSlot: section.timeSlot,
        },
      };
      const cascadingIssues = checkCascadingEffects(resolution, section);

      newSuggestions.push({
        description: `Reschedule to ${timeSlot.days.join('/')} ${formatTimeRange12Hour(timeSlot.startTime, timeSlot.endTime)} - ${rescheduleDetails}`,
        resolution,
        score: calculateTimeSlotScore(timeSlot, section, currentFaculty) - (cascadingIssues.length * 20),
        cascadingIssues,
      });
    });

    // Sort by score (highest first)
    newSuggestions.sort((a, b) => b.score - a.score);
    setSuggestions(newSuggestions);
  };

  // Helper function to convert "HH:MM" to minutes since midnight
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const checkCascadingEffects = (
    resolution: ConflictResolution,
    currentSection: ScheduledSection
  ): string[] => {
    const issues: string[] = [];

    if (resolution.type === 'reschedule_section' && resolution.newTimeSlot) {
      const newSlot = resolution.newTimeSlot;

      // Check for room conflicts
      const roomConflicts = sections.filter(s =>
        s.id !== currentSection.id &&
        s.room.id === currentSection.room.id &&
        s.timeSlot.days.some(day => newSlot.days.includes(day)) &&
        s.timeSlot.startTime === newSlot.startTime &&
        s.timeSlot.endTime === newSlot.endTime
      );

      if (roomConflicts.length > 0) {
        const conflictingCourse = courses.find(c => c.id === roomConflicts[0].courseId);
        issues.push(`Room conflict with ${conflictingCourse?.code || 'another course'}`);
      }

      // Check for Batten Hour violations (Monday 12:30-1:30 PM)
      const battenHourStart = 12 * 60 + 30; // 12:30 PM in minutes
      const battenHourEnd = 13 * 60 + 30; // 1:30 PM in minutes
      const course = courses.find(c => c.id === currentSection.courseId);
      const newStartMinutes = timeToMinutes(newSlot.startTime);

      if (
        course?.type === 'Core' &&
        newSlot.days.includes('Monday' as DayOfWeek) &&
        newStartMinutes >= battenHourStart &&
        newStartMinutes < battenHourEnd
      ) {
        issues.push('⚠️ BATTEN HOUR VIOLATION: Core courses cannot be scheduled Monday 12:30-1:30 PM');
      }

      // Check for student cohort conflicts
      const currentCourse = courses.find(c => c.id === currentSection.courseId);
      const sameCohortSections = sections.filter(s => {
        if (s.id === currentSection.id) return false;
        const otherCourse = courses.find(c => c.id === s.courseId);
        // Check if courses share any student cohorts (same program)
        return currentCourse?.targetStudents?.some(cohort1 =>
          otherCourse?.targetStudents?.some(cohort2 =>
            cohort1.program === cohort2.program
          )
        );
      });

      const cohortConflicts = sameCohortSections.filter(s =>
        s.timeSlot.days.some(day => newSlot.days.includes(day)) &&
        s.timeSlot.startTime === newSlot.startTime &&
        s.timeSlot.endTime === newSlot.endTime
      );

      if (cohortConflicts.length > 0) {
        const conflictingCourses = cohortConflicts
          .map(s => courses.find(c => c.id === s.courseId)?.code)
          .filter(Boolean)
          .slice(0, 2)
          .join(', ');
        issues.push(`Student cohort conflict with ${conflictingCourses}`);
      }
    }

    if (resolution.type === 'reassign_faculty' && resolution.newFacultyId) {
      const newFaculty = faculty.find(f => f.id === resolution.newFacultyId);

      // Check for parenting partner conflicts
      if (newFaculty?.shareParentingWith) {
        const parentingPartnerId = newFaculty.shareParentingWith;
        const partnerSections = sections.filter(s => s.facultyId === parentingPartnerId);
        const conflicts = partnerSections.filter(s =>
          s.timeSlot.days.some(day => currentSection.timeSlot.days.includes(day)) &&
          s.timeSlot.startTime === currentSection.timeSlot.startTime
        );

        if (conflicts.length > 0) {
          const partner = faculty.find(f => f.id === parentingPartnerId);
          issues.push(`⚠️ Parenting partner conflict with ${partner?.name}`);
        }
      }
    }

    return issues;
  };

  const buildConflictContext = (
    conflict: Conflict,
    section: ScheduledSection,
    faculty: Faculty | undefined
  ): string => {
    const reasons: string[] = [];

    // Check for Batten Hour violations
    const battenHourStart = 12 * 60 + 30;
    const battenHourEnd = 13 * 60 + 30;
    const course = courses.find(c => c.id === section.courseId);
    const sectionStartMinutes = timeToMinutes(section.timeSlot.startTime);

    if (
      conflict.type.toLowerCase().includes('batten') ||
      (course?.type === 'Core' &&
        section.timeSlot.days.includes('Monday' as DayOfWeek) &&
        sectionStartMinutes >= battenHourStart &&
        sectionStartMinutes < battenHourEnd)
    ) {
      reasons.push('⚠️ BATTEN HOUR VIOLATION: Core courses cannot be scheduled Monday 12:30-1:30 PM');
    }

    // Identify the specific conflict reason
    if (conflict.type.toLowerCase().includes('faculty') && conflict.type.toLowerCase().includes('conflict')) {
      const conflictingSections = sections.filter(s =>
        s.facultyId === faculty?.id &&
        s.id !== section.id &&
        s.timeSlot.days.some(day => section.timeSlot.days.includes(day)) &&
        s.timeSlot.startTime === section.timeSlot.startTime
      );
      if (conflictingSections.length > 0) {
        const conflictingCourses = conflictingSections
          .map(s => courses.find(c => c.id === s.courseId)?.code)
          .filter(Boolean)
          .join(', ');
        reasons.push(`${faculty?.name} is teaching ${conflictingCourses} at this time`);
      }
    }

    if (conflict.type.toLowerCase().includes('room')) {
      reasons.push(`room ${section.room.name} is double-booked`);
    }

    if (conflict.type.toLowerCase().includes('preference')) {
      reasons.push(`conflicts with ${faculty?.name}'s availability preferences`);
    }

    if (conflict.type.toLowerCase().includes('parenting')) {
      reasons.push('⚠️ parenting partner scheduling conflict');
    }

    // Handle multiple affected sections
    if (conflict.affectedSections.length > 1) {
      reasons.push(`affects ${conflict.affectedSections.length} sections`);
    }

    return reasons.join(', ') || 'scheduling conflict';
  };

  const getFacultyReassignmentDetails = (
    newFaculty: Faculty,
    section: ScheduledSection,
    currentFaculty: Faculty | undefined,
    course: Course | undefined
  ): string => {
    const details: string[] = [];

    // Check day preferences
    const preferredDays = newFaculty.preferences
      .filter(p => p.preferredDays && p.preferredDays.length > 0)
      .flatMap(p => p.preferredDays || []);
    const matchingDays = section.timeSlot.days.filter(day =>
      preferredDays.includes(day)
    );

    if (matchingDays.length > 0) {
      details.push(`prefers ${matchingDays.join('/')}`);
    } else if (preferredDays.length > 0) {
      details.push(`normally prefers ${preferredDays.slice(0, 2).join('/')}`);
    }

    // Check current workload
    const currentAssignments = sections.filter(s => s.facultyId === newFaculty.id).length;
    const originalAssignments = currentFaculty
      ? sections.filter(s => s.facultyId === currentFaculty.id).length
      : 0;

    if (currentAssignments < originalAssignments - 1) {
      details.push(`lighter teaching load (${currentAssignments} courses)`);
    } else if (currentAssignments > originalAssignments + 1) {
      details.push(`heavier load (${currentAssignments} courses)`);
    }

    // Check if they're available
    details.push('available at this time');

    return details.length > 0 ? details.join(', ') : 'has availability and meets requirements';
  };

  const getRescheduleDetails = (
    timeSlot: TimeSlot,
    section: ScheduledSection,
    faculty: Faculty | undefined,
    conflictContext: string
  ): string => {
    const details: string[] = [];

    // Explain why this resolves the conflict
    details.push(`resolves ${conflictContext}`);

    // Check if it matches faculty preferences
    if (faculty) {
      const preferredDays = faculty.preferences
        .filter(p => p.preferredDays && p.preferredDays.length > 0)
        .flatMap(p => p.preferredDays || []);
      const matchingDays = timeSlot.days.filter(day =>
        preferredDays.includes(day)
      );

      if (matchingDays.length === timeSlot.days.length) {
        details.push(`matches ${faculty.name}'s preferred days`);
      } else if (matchingDays.length > 0) {
        details.push(`partially matches ${faculty.name}'s preferences`);
      } else if (preferredDays.length > 0) {
        details.push(`${faculty.name} prefers ${preferredDays.slice(0, 2).join('/')}`);
      }
    }

    // Note if it's the same time of day
    if (timeSlot.startTime === section.timeSlot.startTime) {
      details.push('keeps same time of day');
    } else {
      const originalMinutes = timeToMinutes(section.timeSlot.startTime);
      const newMinutes = timeToMinutes(timeSlot.startTime);
      const originalHour = Math.floor(originalMinutes / 60);
      const newHour = Math.floor(newMinutes / 60);
      if (originalHour < 12 && newHour < 12) {
        details.push('stays in morning');
      } else if (originalHour >= 12 && newHour >= 12) {
        details.push('stays in afternoon');
      } else {
        details.push('shifts time of day');
      }
    }

    // Check room availability (basic check)
    const roomConflicts = sections.filter(s =>
      s.id !== section.id &&
      s.room.id === section.room.id &&
      s.timeSlot.days.some(day => timeSlot.days.includes(day)) &&
      s.timeSlot.startTime === timeSlot.startTime
    );

    if (roomConflicts.length === 0) {
      details.push(`${section.room.name} available`);
    }

    return details.join(', ');
  };

  const findAvailableFaculty = (section: ScheduledSection, conflict: Conflict): Faculty[] => {
    return faculty.filter(f => {
      // Don't suggest the current faculty
      if (f.id === section.facultyId) return false;

      // Check if faculty can teach on these days
      const cannotTeachDays = f.hardConstraints
        .filter(hc => hc.type === 'cannot_teach_day')
        .flatMap(hc => hc.days || []);
      const hasConflictingDays = section.timeSlot.days.some(day =>
        cannotTeachDays.includes(day)
      );
      if (hasConflictingDays) return false;

      // Check for time conflicts
      const facultySections = sections.filter(s => s.facultyId === f.id);
      const hasTimeConflict = facultySections.some(fs => {
        const sameDays = section.timeSlot.days.some(day =>
          fs.timeSlot.days.includes(day)
        );
        const overlappingTime =
          fs.timeSlot.startTime === section.timeSlot.startTime &&
          fs.timeSlot.endTime === section.timeSlot.endTime;
        return sameDays && overlappingTime;
      });
      if (hasTimeConflict) return false;

      return true;
    });
  };

  const findAvailableTimeSlots = (section: ScheduledSection): TimeSlot[] => {
    const currentFaculty = faculty.find(f => f.id === section.facultyId);
    if (!currentFaculty) return [];

    // Get faculty's cannot teach days
    const cannotTeachDays = currentFaculty.hardConstraints
      .filter(hc => hc.type === 'cannot_teach_day')
      .flatMap(hc => hc.days || []);

    // Filter TIME_SLOTS to exclude cannot teach days
    return TIME_SLOTS.filter(slot => {
      // Must not be on cannot teach days
      const hasConflictingDays = slot.days.some(day =>
        cannotTeachDays.includes(day)
      );
      if (hasConflictingDays) return false;

      // Check if faculty has other classes at this time
      const facultySections = sections.filter(
        s => s.facultyId === currentFaculty.id && s.id !== section.id
      );
      const hasTimeConflict = facultySections.some(fs => {
        const sameDays = slot.days.some(day => fs.timeSlot.days.includes(day));
        const sameTime =
          fs.timeSlot.startTime === slot.startTime &&
          fs.timeSlot.endTime === slot.endTime;
        return sameDays && sameTime;
      });
      if (hasTimeConflict) return false;

      return true;
    });
  };

  const calculateFacultyScore = (
    faculty: Faculty,
    section: ScheduledSection,
    course: Course | undefined
  ): number => {
    let score = 50; // Base score

    // Prefer faculty with matching day preferences
    const preferredDays = faculty.preferences
      .filter(p => p.preferredDays && p.preferredDays.length > 0)
      .flatMap(p => p.preferredDays || []);
    const matchingDays = section.timeSlot.days.filter(day =>
      preferredDays.includes(day)
    );
    score += matchingDays.length * 10;

    // Prefer faculty with fewer current assignments (balanced workload)
    const currentAssignments = sections.filter(s => s.facultyId === faculty.id).length;
    score -= currentAssignments * 5;

    return Math.max(0, Math.min(100, score));
  };

  const calculateTimeSlotScore = (
    timeSlot: TimeSlot,
    section: ScheduledSection,
    currentFaculty: Faculty | undefined
  ): number => {
    let score = 50; // Base score

    // Prefer faculty's preferred days
    if (currentFaculty) {
      const preferredDays = currentFaculty.preferences
        .filter(p => p.preferredDays && p.preferredDays.length > 0)
        .flatMap(p => p.preferredDays || []);
      const matchingDays = timeSlot.days.filter(day =>
        preferredDays.includes(day)
      );
      score += matchingDays.length * 15;
    }

    // Prefer similar time of day to original
    if (timeSlot.startTime === section.timeSlot.startTime) {
      score += 20;
    }

    return Math.max(0, Math.min(100, score));
  };

  const handleApplySuggestion = (suggestion: ConflictSuggestion) => {
    // Save to history for undo
    setResolutionHistory(prev => [...prev, {
      conflictId: currentConflict.id,
      resolution: suggestion.resolution
    }]);

    onResolveConflict(currentConflict.id, suggestion.resolution);
    setResolvedConflicts(prev => new Set([...prev, currentConflict.id]));

    if (currentConflictIndex < conflicts.length - 1) {
      setCurrentConflictIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handleUndo = () => {
    if (resolutionHistory.length === 0) {
      alert('No actions to undo');
      return;
    }

    const lastResolution = resolutionHistory[resolutionHistory.length - 1];

    // Create undo resolution
    const undoResolution: ConflictResolution = {
      type: 'undo',
      sectionId: lastResolution.resolution.sectionId,
      previousState: lastResolution.resolution.previousState,
    };

    // Restore previous state
    if (lastResolution.resolution.previousState?.facultyId) {
      undoResolution.newFacultyId = lastResolution.resolution.previousState.facultyId;
    }
    if (lastResolution.resolution.previousState?.timeSlot) {
      undoResolution.newTimeSlot = lastResolution.resolution.previousState.timeSlot;
    }

    // Apply undo
    onResolveConflict(lastResolution.conflictId, undoResolution);

    // Remove from resolved conflicts
    setResolvedConflicts(prev => {
      const newSet = new Set(prev);
      newSet.delete(lastResolution.conflictId);
      return newSet;
    });

    // Remove from history
    setResolutionHistory(prev => prev.slice(0, -1));

    // Go back if possible
    if (currentConflictIndex > 0) {
      setCurrentConflictIndex(prev => prev - 1);
    }
  };

  const handleMarkReviewed = () => {
    onResolveConflict(currentConflict.id, {
      type: 'mark_reviewed',
      sectionId: currentConflict.affectedSections[0],
      notes: 'Reviewed - no action needed',
    });
    setResolvedConflicts(prev => new Set([...prev, currentConflict.id]));

    if (currentConflictIndex < conflicts.length - 1) {
      setCurrentConflictIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    if (currentConflictIndex < conflicts.length - 1) {
      setCurrentConflictIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  if (!currentConflict) return null;

  const section = sections.find(s => s.id === currentConflict.affectedSections[0]);
  const course = section ? courses.find(c => c.id === section.courseId) : undefined;
  const facultyMember = section ? faculty.find(f => f.id === section.facultyId) : undefined;

  const getConflictIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="w-6 h-6 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-blue-600" />;
    }
  };

  const getConflictColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'border-red-300 bg-red-50';
      case 'warning':
        return 'border-yellow-300 bg-yellow-50';
      default:
        return 'border-blue-300 bg-blue-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-uva-navy text-white p-6 sticky top-0">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">Conflict Resolution Wizard</h2>
              <p className="text-gray-300 text-sm mt-1">
                Resolving conflict {currentConflictIndex + 1} of {conflicts.length}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-uva-blue-light rounded-full h-2">
            <div
              className="bg-uva-orange h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-300 mt-1">
            {resolvedConflicts.size} resolved, {conflicts.length - resolvedConflicts.size} remaining
          </p>
        </div>

        {/* Conflict Details */}
        <div className="p-6">
          <div className={`border-2 rounded-lg p-4 mb-6 ${getConflictColor(currentConflict.severity)}`}>
            <div className="flex items-start gap-3">
              {getConflictIcon(currentConflict.severity)}
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">
                  {currentConflict.type}
                </h3>
                <p className="text-gray-700 text-sm mb-2">{currentConflict.description}</p>
                {section && course && (
                  <div className="text-xs text-gray-600 space-y-1">
                    <p><strong>Course:</strong> {course.code} - {course.name}</p>
                    <p><strong>Faculty:</strong> {facultyMember?.name}</p>
                    <p>
                      <strong>Time:</strong>{' '}
                      {section.timeSlot.days.join('/')} {formatTimeRange12Hour(section.timeSlot.startTime, section.timeSlot.endTime)}
                    </p>
                    <p><strong>Room:</strong> {section.room.name}</p>
                    {currentConflict.affectedSections.length > 1 && (
                      <p className="text-yellow-700 font-semibold mt-2">
                        ⚠️ Affects {currentConflict.affectedSections.length} sections total
                      </p>
                    )}
                    {course.targetStudents && course.targetStudents.length > 0 && (
                      <p className="mt-1">
                        <strong>Student Impact:</strong> {course.targetStudents.map(s => s.program).join(', ')} students
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-uva-orange" />
                <h4 className="font-semibold text-gray-900">Suggested Solutions</h4>
              </div>

              <div className="space-y-3">
                {suggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className={`border-2 rounded-lg p-4 transition-colors ${
                      suggestion.cascadingIssues && suggestion.cascadingIssues.length > 0
                        ? 'border-yellow-300 bg-yellow-50'
                        : 'border-gray-200 hover:border-uva-orange'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-gray-500">
                            Score: {suggestion.score}/100
                          </span>
                          {suggestion.score >= 70 && !suggestion.cascadingIssues?.length && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                              Recommended
                            </span>
                          )}
                          {suggestion.cascadingIssues && suggestion.cascadingIssues.length > 0 && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                              ⚠️ May Create Issues
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-900 font-medium mb-2">
                          {suggestion.description}
                        </p>
                        {suggestion.cascadingIssues && suggestion.cascadingIssues.length > 0 && (
                          <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
                            <p className="font-semibold text-yellow-900 mb-1">
                              ⚠️ Warning: This may cause:
                            </p>
                            <ul className="list-disc list-inside text-yellow-800 space-y-0.5">
                              {suggestion.cascadingIssues.map((issue, issueIdx) => (
                                <li key={issueIdx}>{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleApplySuggestion(suggestion)}
                        className="px-4 py-2 bg-uva-orange text-white rounded-lg hover:bg-uva-orange-light transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        Apply
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-gray-600 text-sm">
                No automatic solutions available. Please review manually.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleUndo}
              disabled={resolutionHistory.length === 0}
              className="px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              title={resolutionHistory.length > 0 ? `Undo last ${resolutionHistory.length} action(s)` : 'No actions to undo'}
            >
              ↶ Undo Last
            </button>
            <button
              onClick={handleMarkReviewed}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Mark as Reviewed
            </button>
            <button
              onClick={handleSkip}
              className="px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-colors font-medium"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
