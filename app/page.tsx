'use client';

import { useState } from 'react';
import { Calendar, Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import FileUploadSection, { TemplateDownloadSection } from '@/components/scheduling/FileUploadSection';
import ScheduleViewer from '@/components/scheduling/ScheduleViewer';
import ConflictPanel from '@/components/scheduling/ConflictPanel';
import { AssignmentWeightsConfig } from '@/components/scheduling/AssignmentWeightsConfig';
import {
  Schedule,
  Faculty,
  Course,
  SchedulerConfig,
  Semester,
  AssignmentWeights,
  DEFAULT_ASSIGNMENT_WEIGHTS,
} from '@/types/scheduling';
import { CourseScheduler } from '@/lib/scheduling/scheduler';

export default function Home() {
  const [step, setStep] = useState<'upload' | 'configure' | 'viewing'>('upload');
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [config, setConfig] = useState<SchedulerConfig>({
    semester: Semester.SPRING,
    year: 2026,
    allowFridayElectives: false,
    battenHourEnabled: true,
    maxElectivesPerSlot: 2,
    preferMixedElectives: true,
    avoidThursdayDiscussionsAfter5pm: true,
    balanceWorkload: true,
    assignmentWeights: DEFAULT_ASSIGNMENT_WEIGHTS,
  });

  const handleWeightsChange = (newWeights: AssignmentWeights) => {
    setConfig({ ...config, assignmentWeights: newWeights });
  };

  const handleFilesUploaded = (uploadedFaculty: Faculty[], uploadedCourses: Course[]) => {
    setFaculty(uploadedFaculty);
    setCourses(uploadedCourses);
    setStep('configure');
  };

  const handleGenerateSchedule = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use client-side scheduler instead of API call
      const scheduler = new CourseScheduler(config, courses, faculty);
      const result = scheduler.generateSchedule();

      if (!result.success || !result.schedule) {
        setError(result.errors?.join(', ') || 'Failed to generate schedule');
        return;
      }

      setSchedule(result.schedule);
      setStep('viewing');
    } catch (err) {
      setError('An error occurred while generating the schedule');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('upload');
    setFaculty([]);
    setCourses([]);
    setSchedule(null);
    setError(null);
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: 'url(/garrett-hall-sunset.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          filter: 'grayscale(100%)',
        }}
      ></div>
      {/* Background Overlay */}
      <div className="fixed inset-0 bg-white/85 -z-10"></div>

      {/* Header */}
      <header className="bg-uva-navy text-white shadow-lg">
        <div className="max-w-[98vw] mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-uva-orange" />
              <div>
                <h1 className="text-3xl font-bold font-serif">UVA Batten Course Scheduling Tool</h1>
                <p className="text-sm text-gray-300 mt-1">
                  Automated course scheduling with constraint satisfaction
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <a
                href="/faculty-submit"
                className="px-4 py-2 bg-uva-orange hover:bg-opacity-90 text-white font-semibold rounded-lg transition-all"
              >
                Faculty Form
              </a>
              <a
                href="/admin"
                className="px-4 py-2 bg-white hover:bg-gray-100 text-uva-navy font-semibold rounded-lg transition-all"
              >
                Admin Dashboard
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[98vw] mx-auto px-2 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-uva-orange font-semibold' : 'text-gray-500'}`}>
              <Upload className="w-5 h-5" />
              <span>1. Upload Data</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300" />
            <div className={`flex items-center gap-2 ${step === 'configure' ? 'text-uva-orange font-semibold' : 'text-gray-500'}`}>
              <FileSpreadsheet className="w-5 h-5" />
              <span>2. Configure</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300" />
            <div className={`flex items-center gap-2 ${step === 'viewing' ? 'text-uva-orange font-semibold' : 'text-gray-500'}`}>
              <Calendar className="w-5 h-5" />
              <span>3. View Schedule</span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Step 1: Upload Files */}
        {step === 'upload' && (
          <>
            <FileUploadSection onFilesUploaded={handleFilesUploaded} />
            <TemplateDownloadSection />
          </>
        )}

        {/* Step 2: Configure */}
        {step === 'configure' && (
          <div className="bg-white rounded-lg shadow-md p-6 w-full">
            <h2 className="text-2xl font-bold text-uva-navy mb-6">Configure Schedule Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Semester
                </label>
                <select
                  value={config.semester}
                  onChange={(e) => setConfig({ ...config, semester: e.target.value as Semester })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uva-orange focus:border-transparent"
                >
                  <option value={Semester.FALL}>Fall</option>
                  <option value={Semester.SPRING}>Spring</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Year
                </label>
                <input
                  type="number"
                  value={config.year}
                  onChange={(e) => setConfig({ ...config, year: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uva-orange focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Max Electives Per Time Slot
                </label>
                <input
                  type="number"
                  value={config.maxElectivesPerSlot}
                  onChange={(e) => setConfig({ ...config, maxElectivesPerSlot: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uva-orange focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.allowFridayElectives}
                  onChange={(e) => setConfig({ ...config, allowFridayElectives: e.target.checked })}
                  className="w-5 h-5 text-uva-orange focus:ring-uva-orange border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Allow Friday electives</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.battenHourEnabled}
                  onChange={(e) => setConfig({ ...config, battenHourEnabled: e.target.checked })}
                  className="w-5 h-5 text-uva-orange focus:ring-uva-orange border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Enforce Batten Hour (Monday 12:30-1:30)</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.preferMixedElectives}
                  onChange={(e) => setConfig({ ...config, preferMixedElectives: e.target.checked })}
                  className="w-5 h-5 text-uva-orange focus:ring-uva-orange border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Prefer mixed electives (1 undergrad + 1 grad per slot)</span>
              </label>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900">Data Loaded</h4>
                  <p className="text-blue-700 text-sm mt-1">
                    {faculty.length} faculty members and {courses.length} courses ready to schedule
                  </p>
                </div>
              </div>
            </div>

            {/* Assignment Weights Configuration */}
            <div className="mb-6">
              <AssignmentWeightsConfig
                weights={config.assignmentWeights || DEFAULT_ASSIGNMENT_WEIGHTS}
                onChange={handleWeightsChange}
                disabled={loading}
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Back to Upload
              </button>
              <button
                onClick={handleGenerateSchedule}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-uva-orange text-white rounded-lg font-semibold hover:bg-uva-orange-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating Schedule...' : 'Generate Schedule'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: View Schedule */}
        {step === 'viewing' && schedule && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-uva-navy">{schedule.name}</h2>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Create New Schedule
              </button>
            </div>

            <ConflictPanel conflicts={schedule.conflicts} />
            <ScheduleViewer schedule={schedule} courses={courses} faculty={faculty} />
          </div>
        )}
      </main>
    </div>
  );
}
