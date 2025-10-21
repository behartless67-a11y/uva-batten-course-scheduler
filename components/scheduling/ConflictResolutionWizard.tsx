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
  type: 'reassign_faculty' | 'reschedule_section' | 'mark_reviewed';
  sectionId: string;
  newFacultyId?: string;
  newTimeSlot?: TimeSlot;
  notes?: string;
}

interface ConflictSuggestion {
  description: string;
  resolution: ConflictResolution;
  score: number; // 0-100, higher is better
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

    // Suggestion 1: Find alternative faculty for any conflict
    const availableFaculty = findAvailableFaculty(section, conflict);
    availableFaculty.slice(0, 3).forEach(f => {
      newSuggestions.push({
        description: `Reassign to ${f.name} (has availability and meets requirements)`,
        resolution: {
          type: 'reassign_faculty',
          sectionId: section.id,
          newFacultyId: f.id,
        },
        score: calculateFacultyScore(f, section, course),
      });
    });

    // Suggestion 2: Find alternative time slots for any conflict
    const availableTimeSlots = findAvailableTimeSlots(section);
    availableTimeSlots.slice(0, 3).forEach(timeSlot => {
      newSuggestions.push({
        description: `Reschedule to ${timeSlot.days.join('/')} ${formatTimeRange12Hour(timeSlot.startTime, timeSlot.endTime)}`,
        resolution: {
          type: 'reschedule_section',
          sectionId: section.id,
          newTimeSlot: timeSlot,
        },
        score: calculateTimeSlotScore(timeSlot, section, currentFaculty),
      });
    });

    // Sort by score (highest first)
    newSuggestions.sort((a, b) => b.score - a.score);
    setSuggestions(newSuggestions);
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
    onResolveConflict(currentConflict.id, suggestion.resolution);
    setResolvedConflicts(prev => new Set([...prev, currentConflict.id]));

    if (currentConflictIndex < conflicts.length - 1) {
      setCurrentConflictIndex(prev => prev + 1);
    } else {
      onClose();
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
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-uva-orange transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-gray-500">
                            Score: {suggestion.score}/100
                          </span>
                          {suggestion.score >= 70 && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-900 font-medium">
                          {suggestion.description}
                        </p>
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
