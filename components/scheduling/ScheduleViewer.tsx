'use client';

import { useState } from 'react';
import { Schedule, Course, Faculty, DayOfWeek, ScheduledSection } from '@/types/scheduling';
import { Download, Grid, List, Search } from 'lucide-react';
import { exportScheduleToExcel, exportConflictsToExcel } from '@/lib/utils/fileParser';
import { formatTimeRange12Hour } from '@/lib/utils/timeFormat';

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
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);

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
              <button
                onClick={handleExportConflicts}
                className="flex items-center gap-2 px-4 py-2 bg-uva-navy text-white rounded-lg hover:bg-uva-blue-light transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export Conflicts</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
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
          <p className="text-xs text-gray-600 mt-2">
            💡 Drag a faculty member onto any course section below to reassign them
          </p>
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
      </div>
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
}: {
  sections: ScheduledSection[];
  courseMap: Map<string, Course>;
  facultyMap: Map<string, Faculty>;
  onSectionDragOver: (e: React.DragEvent, sectionId: string) => void;
  onSectionDragLeave: () => void;
  onSectionDrop: (e: React.DragEvent, sectionId: string) => void;
  dragOverSection: string | null;
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
                return (
                  <td key={day} className="border border-gray-300 px-2 py-2 align-top">
                    <div className="space-y-2">
                      {sectionsInSlot.map(section => {
                        const course = courseMap.get(section.courseId);
                        const facultyMember = facultyMap.get(section.facultyId);
                        const isDragOver = dragOverSection === section.id;
                        return (
                          <div
                            key={section.id}
                            onDragOver={(e) => onSectionDragOver(e, section.id)}
                            onDragLeave={onSectionDragLeave}
                            onDrop={(e) => onSectionDrop(e, section.id)}
                            className={`border-l-4 rounded p-2 text-sm transition-all cursor-pointer ${
                              isDragOver
                                ? 'bg-green-100 border-green-500 ring-2 ring-green-500'
                                : 'bg-uva-orange bg-opacity-10 border-uva-orange hover:bg-opacity-20'
                            }`}
                          >
                            <p className="font-semibold text-uva-navy">{course?.code}</p>
                            <p className="text-xs text-gray-700 mt-1">{course?.name}</p>
                            <p className="text-xs text-gray-600 mt-1 font-medium">{facultyMember?.name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {section.room.name} ({section.enrollmentCap} students)
                            </p>
                            {isDragOver && (
                              <p className="text-xs text-green-700 font-semibold mt-1">
                                Drop to reassign
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
