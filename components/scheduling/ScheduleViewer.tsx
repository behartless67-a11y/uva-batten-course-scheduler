'use client';

import { useState } from 'react';
import { Schedule, Course, Faculty, DayOfWeek, ScheduledSection, TimeSlot, StudentCohort } from '@/types/scheduling';
import { Download, Grid, List, Search, Wand2, ChevronDown, ChevronUp, User } from 'lucide-react';
import { exportScheduleToExcel, exportConflictsToExcel } from '@/lib/utils/fileParser';
import { formatTimeRange12Hour } from '@/lib/utils/timeFormat';
import ConflictResolutionWizard, { ConflictResolution } from './ConflictResolutionWizard';
import { TIME_SLOTS } from '@/lib/scheduling/timeSlots';

/**
 * Get cohort color classes for a course based on its target students
 * Returns background and border color classes
 */
function getCohortColors(course: Course | undefined): { bg: string; border: string; text: string } {
  if (!course || !course.targetStudents || course.targetStudents.length === 0) {
    console.log(`No cohort data for course: ${course?.code || 'unknown'}`);
    return { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-900' };
  }

  // Use the primary (first) target cohort for color coding
  const primaryCohort = course.targetStudents[0];
  const cohortKey = `${primaryCohort.program}-${primaryCohort.year}`;

  console.log(`Course ${course.code}: cohortKey = "${cohortKey}", program = "${primaryCohort.program}", year = ${primaryCohort.year}`);

  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    // MPP Year 1 - Blue shades
    'MPP_Postgrad-1': { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-900' },
    'MPP_Accel-1': { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-900' },

    // MPP Year 2 - Indigo shades
    'MPP_Postgrad-2': { bg: 'bg-indigo-100', border: 'border-indigo-400', text: 'text-indigo-900' },
    'MPP_Accel-2': { bg: 'bg-indigo-100', border: 'border-indigo-400', text: 'text-indigo-900' },

    // BA Year 1 - Purple shades
    'BA-1': { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-900' },

    // BA Year 2 - Pink shades
    'BA-2': { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-900' },

    // BA Year 3 - Rose shades
    'BA-3': { bg: 'bg-rose-100', border: 'border-rose-400', text: 'text-rose-900' },

    // BA Year 4 - Red shades
    'BA-4': { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-900' },

    // Minor - Green shades
    'Minor-1': { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-900' },
    'Minor-2': { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-900' },
    'Minor-3': { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-900' },
    'Minor-4': { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-900' },

    // Cert - Amber shades
    'Cert-1': { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-900' },
    'Cert-2': { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-900' },
    'Cert-3': { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-900' },
    'Cert-4': { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-900' },
  };

  const colors = colorMap[cohortKey] || { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-900' };

  if (!colorMap[cohortKey]) {
    console.warn(`No color mapping found for cohortKey: "${cohortKey}"`);
  }

  return colors;
}

/**
 * Get a display-friendly cohort label
 */
function getCohortLabel(cohort: StudentCohort): string {
  const programMap: Record<string, string> = {
    'MPP_Postgrad': 'MPP',
    'MPP_Accel': 'MPP',
    'BA': 'BA',
    'Minor': 'Minor',
    'Cert': 'Cert',
  };
  return `${programMap[cohort.program]} Year ${cohort.year}`;
}

interface ScheduleViewerProps {
  schedule: Schedule;
  courses: Course[];
  faculty: Faculty[];
}

export default function ScheduleViewer({ schedule, courses, faculty }: ScheduleViewerProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<'all' | 'undergraduate' | 'graduate'>('all');
  const [localSchedule, setLocalSchedule] = useState(schedule);
  const [draggedFaculty, setDraggedFaculty] = useState<Faculty | null>(null);
  const [draggedSection, setDraggedSection] = useState<ScheduledSection | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const [dragOverTimeSlot, setDragOverTimeSlot] = useState<{day: DayOfWeek, timeSlot: string} | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [showFacultySummary, setShowFacultySummary] = useState(true);

  const courseMap = new Map(courses.map(c => [c.id, c]));
  const facultyMap = new Map(faculty.map(f => [f.id, f]));

  const handleFacultyDragStart = (e: React.DragEvent, faculty: Faculty) => {
    setDraggedFaculty(faculty);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSectionDragOver = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSection(sectionId);
  };

  const handleSectionDragLeave = () => {
    setDragOverSection(null);
  };

  const handleSectionDrop = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    setDragOverSection(null);

    if (!draggedFaculty) return;

    // Get the section being modified
    const targetSection = localSchedule.sections.find(s => s.id === sectionId);
    if (!targetSection) return;

    // Check for conflicts
    const warnings: string[] = [];

    // Extract cannot teach days from hard constraints
    const sectionDays = targetSection.timeSlot.days;
    const cannotTeachConstraints = draggedFaculty.hardConstraints.filter(
      hc => hc.type === 'cannot_teach_day' && hc.days
    );
    const cannotTeachDays = cannotTeachConstraints.flatMap(hc => hc.days || []);
    const conflictingDays = sectionDays.filter(day =>
      cannotTeachDays.some(cannotDay => day === cannotDay)
    );

    if (conflictingDays.length > 0) {
      warnings.push(`⚠️ ${draggedFaculty.name} CANNOT teach on ${conflictingDays.join(', ')}`);
    }

    // Extract preferred days from preferences
    const preferredDaysArrays = draggedFaculty.preferences
      .filter(p => p.preferredDays && p.preferredDays.length > 0)
      .map(p => p.preferredDays || []);
    const preferredDays = preferredDaysArrays.length > 0 ? preferredDaysArrays[0] : [];

    if (preferredDays.length > 0) {
      const nonPreferredDays = sectionDays.filter(day =>
        !preferredDays.some(prefDay => day === prefDay)
      );
      if (nonPreferredDays.length > 0) {
        warnings.push(`ℹ️ ${draggedFaculty.name} prefers not to teach on ${nonPreferredDays.join(', ')}`);
      }
    }

    // Check for time conflicts with other courses this faculty teaches
    const facultyOtherSections = localSchedule.sections.filter(
      s => s.facultyId === draggedFaculty.id && s.id !== sectionId
    );

    const hasTimeConflict = facultyOtherSections.some(otherSection => {
      const sameDays = targetSection.timeSlot.days.some(day =>
        otherSection.timeSlot.days.includes(day)
      );
      const sameTime =
        targetSection.timeSlot.startTime === otherSection.timeSlot.startTime &&
        targetSection.timeSlot.endTime === otherSection.timeSlot.endTime;
      return sameDays && sameTime;
    });

    if (hasTimeConflict) {
      const conflictCourse = facultyOtherSections.find(otherSection => {
        const sameDays = targetSection.timeSlot.days.some(day =>
          otherSection.timeSlot.days.includes(day)
        );
        const sameTime =
          targetSection.timeSlot.startTime === otherSection.timeSlot.startTime &&
          targetSection.timeSlot.endTime === otherSection.timeSlot.endTime;
        return sameDays && sameTime;
      });
      const conflictCourseName = conflictCourse ? courseMap.get(conflictCourse.courseId)?.code : 'another course';
      warnings.push(`❌ TIME CONFLICT: ${draggedFaculty.name} is already teaching ${conflictCourseName} at this time`);
    }

    // Show warnings if any exist
    if (warnings.length > 0) {
      const proceed = confirm(
        `Warning: Assigning ${draggedFaculty.name} to this section may cause issues:\n\n` +
        warnings.join('\n\n') +
        '\n\nDo you want to proceed anyway?'
      );

      if (!proceed) {
        setDraggedFaculty(null);
        return;
      }
    }

    // Update the section with new faculty
    const updatedSections = localSchedule.sections.map(section =>
      section.id === sectionId
        ? { ...section, facultyId: draggedFaculty.id }
        : section
    );

    setLocalSchedule({
      ...localSchedule,
      sections: updatedSections,
    });

    setDraggedFaculty(null);
  };

  // Course drag handlers for rescheduling
  const handleCourseDragStart = (e: React.DragEvent, section: ScheduledSection) => {
    setDraggedSection(section);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTimeSlotDragOver = (e: React.DragEvent, day: DayOfWeek, timeSlot: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTimeSlot({ day, timeSlot });
  };

  const handleTimeSlotDragLeave = () => {
    setDragOverTimeSlot(null);
  };

  const handleTimeSlotDrop = (e: React.DragEvent, day: DayOfWeek, timeSlotKey: string) => {
    e.preventDefault();
    setDragOverTimeSlot(null);

    if (!draggedSection) return;

    const [startTime, endTime] = timeSlotKey.split('-');

    // Find matching TIME_SLOT that includes this day
    const newTimeSlot = TIME_SLOTS.find(
      ts => ts.days.includes(day) && ts.startTime === startTime && ts.endTime === endTime
    );

    if (!newTimeSlot) {
      alert('Could not find matching time slot. The course may need to stay on the same days.');
      setDraggedSection(null);
      return;
    }

    // Check for conflicts
    const currentFaculty = faculty.find(f => f.id === draggedSection.facultyId);
    if (currentFaculty) {
      const cannotTeachDays = currentFaculty.hardConstraints
        .filter(hc => hc.type === 'cannot_teach_day')
        .flatMap(hc => hc.days || []);

      const conflictingDays = newTimeSlot.days.filter(d => cannotTeachDays.includes(d));
      if (conflictingDays.length > 0) {
        const proceed = confirm(
          `Warning: ${currentFaculty.name} CANNOT teach on ${conflictingDays.join(', ')}.\n\n` +
          `Do you want to proceed anyway?`
        );
        if (!proceed) {
          setDraggedSection(null);
          return;
        }
      }
    }

    // Update the section with new time slot
    const updatedSections = localSchedule.sections.map(section =>
      section.id === draggedSection.id
        ? { ...section, timeSlot: newTimeSlot }
        : section
    );

    setLocalSchedule({
      ...localSchedule,
      sections: updatedSections,
    });

    setDraggedSection(null);
  };

  // Conflict resolution handler
  const handleResolveConflict = (conflictId: string, resolution: ConflictResolution) => {
    let updatedSections = [...localSchedule.sections];

    if (resolution.type === 'reassign_faculty' && resolution.newFacultyId) {
      updatedSections = updatedSections.map(section =>
        section.id === resolution.sectionId
          ? { ...section, facultyId: resolution.newFacultyId! }
          : section
      );
    } else if (resolution.type === 'reschedule_section' && resolution.newTimeSlot) {
      updatedSections = updatedSections.map(section =>
        section.id === resolution.sectionId
          ? { ...section, timeSlot: resolution.newTimeSlot! }
          : section
      );
    }

    // Remove the resolved conflict
    const updatedConflicts = localSchedule.conflicts.filter(c => c.id !== conflictId);

    setLocalSchedule({
      ...localSchedule,
      sections: updatedSections,
      conflicts: updatedConflicts,
    });
  };

  // Filter sections
  const filteredSections = localSchedule.sections.filter(section => {
    const course = courseMap.get(section.courseId);
    const facultyMember = facultyMap.get(section.facultyId);

    const matchesSearch =
      !searchTerm ||
      course?.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facultyMember?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLevel =
      filterLevel === 'all' ||
      (filterLevel === 'undergraduate' && course?.level === 'Undergraduate') ||
      (filterLevel === 'graduate' && course?.level === 'Graduate');

    return matchesSearch && matchesLevel;
  });

  const handleExportSchedule = () => {
    const enrichedSchedule = {
      ...localSchedule,
      sections: localSchedule.sections.map(section => ({
        ...section,
        course: courseMap.get(section.courseId),
        faculty: facultyMap.get(section.facultyId),
      })),
    };
    exportScheduleToExcel(enrichedSchedule, `${localSchedule.name}.xlsx`);
  };

  const handleExportConflicts = () => {
    exportConflictsToExcel(localSchedule.conflicts, `${localSchedule.name}-conflicts.xlsx`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md w-full">
      {/* Toolbar */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses or faculty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uva-orange focus:border-transparent w-64"
              />
            </div>

            {/* Level Filter */}
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uva-orange focus:border-transparent"
            >
              <option value="all">All Levels</option>
              <option value="undergraduate">Undergraduate</option>
              <option value="graduate">Graduate</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-uva-navy shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-uva-navy shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Export Buttons */}
            <button
              onClick={handleExportSchedule}
              className="flex items-center gap-2 px-4 py-2 bg-uva-orange text-white rounded-lg hover:bg-uva-orange-light transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export Schedule</span>
            </button>

            {schedule.conflicts.length > 0 && (
              <>
                <button
                  onClick={handleExportConflicts}
                  className="flex items-center gap-2 px-4 py-2 bg-uva-navy text-white rounded-lg hover:bg-uva-blue-light transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium">Export Conflicts</span>
                </button>
                <button
                  onClick={() => setShowWizard(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Wand2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Resolve Conflicts ({localSchedule.conflicts.length})</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Color Legend */}
        <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Student Cohort Color Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-400"></div>
              <span className="text-gray-700">MPP Year 1</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-indigo-100 border-2 border-indigo-400"></div>
              <span className="text-gray-700">MPP Year 2</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-100 border-2 border-purple-400"></div>
              <span className="text-gray-700">BA Year 1</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-pink-100 border-2 border-pink-400"></div>
              <span className="text-gray-700">BA Year 2</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-rose-100 border-2 border-rose-400"></div>
              <span className="text-gray-700">BA Year 3</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-400"></div>
              <span className="text-gray-700">BA Year 4</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-400"></div>
              <span className="text-gray-700">Minor</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-100 border-2 border-amber-400"></div>
              <span className="text-gray-700">Certificate</span>
            </div>
          </div>
        </div>

        {/* Faculty Panel for Drag & Drop */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Faculty Members (Drag to Reassign)</h3>
          <div className="flex flex-wrap gap-2">
            {faculty.map(f => (
              <div
                key={f.id}
                draggable
                onDragStart={(e) => handleFacultyDragStart(e, f)}
                className="px-3 py-2 bg-white border-2 border-uva-navy rounded-lg cursor-move hover:bg-uva-navy hover:text-white transition-colors text-sm font-medium"
              >
                {f.name}
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1">
            <p className="text-xs text-gray-600">
              💡 <strong>Faculty Reassignment:</strong> Drag a faculty member onto any course section below
            </p>
            <p className="text-xs text-gray-600">
              📅 <strong>Course Rescheduling:</strong> Drag a course section to a different time slot in the grid
            </p>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <GridView
            sections={filteredSections}
            courseMap={courseMap}
            facultyMap={facultyMap}
            onSectionDragOver={handleSectionDragOver}
            onSectionDragLeave={handleSectionDragLeave}
            onSectionDrop={handleSectionDrop}
            dragOverSection={dragOverSection}
            onCourseDragStart={handleCourseDragStart}
            onTimeSlotDragOver={handleTimeSlotDragOver}
            onTimeSlotDragLeave={handleTimeSlotDragLeave}
            onTimeSlotDrop={handleTimeSlotDrop}
            dragOverTimeSlot={dragOverTimeSlot}
          />
        ) : (
          <ListView
            sections={filteredSections}
            courseMap={courseMap}
            facultyMap={facultyMap}
            onSectionDragOver={handleSectionDragOver}
            onSectionDragLeave={handleSectionDragLeave}
            onSectionDrop={handleSectionDrop}
            dragOverSection={dragOverSection}
          />
        )}

        {/* Faculty Schedule Summary */}
        <div className="mt-6 bg-white rounded-lg border-2 border-gray-200">
          <button
            onClick={() => setShowFacultySummary(!showFacultySummary)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-uva-navy" />
              <h3 className="text-lg font-bold text-uva-navy">Faculty Schedule Summary</h3>
              <span className="text-sm text-gray-500">({faculty.length} faculty members)</span>
            </div>
            {showFacultySummary ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {showFacultySummary && (
            <div className="px-6 pb-6">
              {faculty
                .slice()
                .sort((a, b) => {
                  // Sort by last name, then first name
                  const aLast = a.name.split(' ').pop() || '';
                  const bLast = b.name.split(' ').pop() || '';
                  const lastCompare = aLast.localeCompare(bLast);
                  if (lastCompare !== 0) return lastCompare;
                  return a.name.localeCompare(b.name);
                })
                .map(facultyMember => {
                  const facultySections = localSchedule.sections.filter(
                    s => s.facultyId === facultyMember.id
                  );

                  // Calculate total teaching hours per week
                  const totalHours = facultySections.reduce((sum, section) => {
                    // Calculate duration from start and end time
                    const [startHour, startMin] = section.timeSlot.startTime.split(':').map(Number);
                    const [endHour, endMin] = section.timeSlot.endTime.split(':').map(Number);
                    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
                    const sessionsPerWeek = section.timeSlot.days.length;
                    return sum + (durationMinutes / 60) * sessionsPerWeek;
                  }, 0);

                  // Format name as Last, First
                  const nameParts = facultyMember.name.split(' ');
                  const formattedName =
                    nameParts.length > 1
                      ? `${nameParts[nameParts.length - 1]}, ${nameParts.slice(0, -1).join(' ')}`
                      : facultyMember.name;

                  return (
                    <div
                      key={facultyMember.id}
                      className="border-t border-gray-200 py-4 first:border-t-0"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-gray-900">{formattedName}</h4>
                          <p className="text-sm text-gray-600">
                            {facultySections.length} {facultySections.length === 1 ? 'course' : 'courses'} •{' '}
                            {totalHours.toFixed(1)} hours/week
                          </p>
                        </div>
                      </div>

                      {facultySections.length > 0 ? (
                        <div className="space-y-2">
                          {facultySections.map(section => {
                            const course = courseMap.get(section.courseId);
                            const colors = getCohortColors(course);
                            return (
                              <div
                                key={section.id}
                                className={`flex items-center justify-between ${colors.bg} rounded px-3 py-2 text-sm border-l-4 ${colors.border}`}
                              >
                                <div className="flex-1">
                                  <span className={`font-medium ${colors.text}`}>
                                    {course?.code} - {course?.name}
                                  </span>
                                  {section.sectionNumber > 1 && (
                                    <span className="text-gray-600 ml-1">(Section {section.sectionNumber})</span>
                                  )}
                                  {course && course.targetStudents && course.targetStudents.length > 0 && (
                                    <span className="ml-2 text-xs text-gray-600">
                                      [{getCohortLabel(course.targetStudents[0])}]
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-gray-600">
                                  <span>{section.timeSlot.days.join('/')}</span>
                                  <span>
                                    {formatTimeRange12Hour(
                                      section.timeSlot.startTime,
                                      section.timeSlot.endTime
                                    )}
                                  </span>
                                  <span className="text-gray-500">{section.room.name}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No courses assigned</p>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Conflict Resolution Wizard */}
      {showWizard && (
        <ConflictResolutionWizard
          conflicts={localSchedule.conflicts}
          sections={localSchedule.sections}
          faculty={faculty}
          courses={courses}
          onResolveConflict={handleResolveConflict}
          onClose={() => setShowWizard(false)}
        />
      )}
    </div>
  );
}

// Grid View Component
function GridView({
  sections,
  courseMap,
  facultyMap,
  onSectionDragOver,
  onSectionDragLeave,
  onSectionDrop,
  dragOverSection,
  onCourseDragStart,
  onTimeSlotDragOver,
  onTimeSlotDragLeave,
  onTimeSlotDrop,
  dragOverTimeSlot,
}: {
  sections: ScheduledSection[];
  courseMap: Map<string, Course>;
  facultyMap: Map<string, Faculty>;
  onSectionDragOver: (e: React.DragEvent, sectionId: string) => void;
  onSectionDragLeave: () => void;
  onSectionDrop: (e: React.DragEvent, sectionId: string) => void;
  dragOverSection: string | null;
  onCourseDragStart: (e: React.DragEvent, section: ScheduledSection) => void;
  onTimeSlotDragOver: (e: React.DragEvent, day: DayOfWeek, timeSlot: string) => void;
  onTimeSlotDragLeave: () => void;
  onTimeSlotDrop: (e: React.DragEvent, day: DayOfWeek, timeSlot: string) => void;
  dragOverTimeSlot: {day: DayOfWeek, timeSlot: string} | null;
}) {
  const days = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY];

  // Group sections by day and time
  const schedule: Record<string, Record<string, ScheduledSection[]>> = {};

  sections.forEach(section => {
    section.timeSlot.days.forEach(day => {
      const timeKey = `${section.timeSlot.startTime}-${section.timeSlot.endTime}`;
      if (!schedule[day]) schedule[day] = {};
      if (!schedule[day][timeKey]) schedule[day][timeKey] = [];
      schedule[day][timeKey].push(section);
    });
  });

  // Get all unique time slots sorted
  const timeSlots = Array.from(
    new Set(
      sections.flatMap(s =>
        s.timeSlot.days.map(() => `${s.timeSlot.startTime}-${s.timeSlot.endTime}`)
      )
    )
  ).sort();

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border border-gray-300 bg-uva-navy text-white px-4 py-3 text-left font-semibold">
              Time
            </th>
            {days.map(day => (
              <th
                key={day}
                className="border border-gray-300 bg-uva-navy text-white px-4 py-3 text-center font-semibold"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map(timeSlot => (
            <tr key={timeSlot}>
              <td className="border border-gray-300 bg-gray-50 px-4 py-3 font-medium text-sm whitespace-nowrap">
                {(() => {
                  const [start, end] = timeSlot.split('-');
                  return formatTimeRange12Hour(start, end);
                })()}
              </td>
              {days.map(day => {
                const sectionsInSlot = schedule[day]?.[timeSlot] || [];
                const isTimeSlotDragOver = dragOverTimeSlot?.day === day && dragOverTimeSlot?.timeSlot === timeSlot;
                return (
                  <td
                    key={day}
                    className={`border border-gray-300 px-2 py-2 align-top min-h-[80px] transition-colors ${
                      isTimeSlotDragOver ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                    }`}
                    onDragOver={(e) => onTimeSlotDragOver(e, day, timeSlot)}
                    onDragLeave={onTimeSlotDragLeave}
                    onDrop={(e) => onTimeSlotDrop(e, day, timeSlot)}
                  >
                    <div className="space-y-2">
                      {sectionsInSlot.map(section => {
                        const course = courseMap.get(section.courseId);
                        const facultyMember = facultyMap.get(section.facultyId);
                        const isDragOver = dragOverSection === section.id;
                        const colors = getCohortColors(course);
                        return (
                          <div
                            key={section.id}
                            draggable
                            onDragStart={(e) => onCourseDragStart(e, section)}
                            onDragOver={(e) => onSectionDragOver(e, section.id)}
                            onDragLeave={onSectionDragLeave}
                            onDrop={(e) => onSectionDrop(e, section.id)}
                            className={`border-l-4 rounded p-2 text-sm transition-all cursor-move ${
                              isDragOver
                                ? 'bg-green-100 border-green-500 ring-2 ring-green-500'
                                : `${colors.bg} ${colors.border} hover:opacity-90`
                            }`}
                          >
                            <p className={`font-semibold ${colors.text}`}>{course?.code}</p>
                            <p className="text-xs text-gray-700 mt-1">{course?.name}</p>
                            {course && course.targetStudents && course.targetStudents.length > 0 && (
                              <p className="text-xs text-gray-600 mt-1 font-medium">
                                {getCohortLabel(course.targetStudents[0])}
                              </p>
                            )}
                            <p className="text-xs text-gray-600 mt-1 font-medium">{facultyMember?.name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {section.room.name} ({section.enrollmentCap} students)
                            </p>
                            {isDragOver && (
                              <p className="text-xs text-green-700 font-semibold mt-1">
                                Drop faculty to reassign
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// List View Component
function ListView({
  sections,
  courseMap,
  facultyMap,
  onSectionDragOver,
  onSectionDragLeave,
  onSectionDrop,
  dragOverSection,
}: {
  sections: ScheduledSection[];
  courseMap: Map<string, Course>;
  facultyMap: Map<string, Faculty>;
  onSectionDragOver: (e: React.DragEvent, sectionId: string) => void;
  onSectionDragLeave: () => void;
  onSectionDrop: (e: React.DragEvent, sectionId: string) => void;
  dragOverSection: string | null;
}) {
  return (
    <div className="space-y-3">
      {sections.map(section => {
        const course = courseMap.get(section.courseId);
        const facultyMember = facultyMap.get(section.facultyId);
        const isDragOver = dragOverSection === section.id;

        return (
          <div
            key={section.id}
            onDragOver={(e) => onSectionDragOver(e, section.id)}
            onDragLeave={onSectionDragLeave}
            onDrop={(e) => onSectionDrop(e, section.id)}
            className={`border rounded-lg p-4 transition-all ${
              isDragOver
                ? 'border-green-500 ring-2 ring-green-500 bg-green-50'
                : 'border-gray-200 hover:border-uva-orange'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-uva-navy">{course?.code}</h3>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                    Section {section.sectionNumber}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      course?.level === 'Graduate'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {course?.level}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      course?.type === 'Core'
                        ? 'bg-red-100 text-red-800'
                        : course?.type === 'Capstone'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {course?.type}
                  </span>
                </div>
                <p className="text-gray-700 mt-1">{course?.name}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                  <div>
                    <span className="text-gray-500">Faculty:</span>
                    <p className="font-medium text-gray-900">{facultyMember?.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Time:</span>
                    <p className="font-medium text-gray-900">
                      {section.timeSlot.days.join(', ')} {formatTimeRange12Hour(section.timeSlot.startTime, section.timeSlot.endTime)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Room:</span>
                    <p className="font-medium text-gray-900">{section.room.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Enrollment:</span>
                    <p className="font-medium text-gray-900">
                      {section.enrollmentCap} / {section.room.capacity}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {sections.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No sections match your search criteria</p>
        </div>
      )}
    </div>
  );
}
