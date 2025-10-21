'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { parseFacultyPreferences, parseCourseData } from '@/lib/utils/fileParser';
import { Faculty, Course } from '@/types/scheduling';

interface FileUploadSectionProps {
  onFilesUploaded: (faculty: Faculty[], courses: Course[]) => void;
}

export default function FileUploadSection({ onFilesUploaded }: FileUploadSectionProps) {
  const [facultyFile, setFacultyFile] = useState<File | null>(null);
  const [courseFile, setCourseFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFacultyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFacultyFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleCourseFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCourseFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!facultyFile || !courseFile) {
      setError('Please upload both faculty preferences and course data files');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Starting to parse faculty file:', facultyFile.name);
      // Parse faculty preferences first
      const faculty = await parseFacultyPreferences(facultyFile);
      console.log('Parsed faculty:', faculty.length, 'members');

      console.log('Starting to parse course file:', courseFile.name);
      // Parse course data (needs faculty for matching)
      const courses = await parseCourseData(courseFile, faculty);
      console.log('Parsed courses:', courses.length, 'courses');

      onFilesUploaded(faculty, courses);
    } catch (err) {
      console.error('Error parsing files:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse files');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 w-full">
      <h2 className="text-3xl font-bold text-uva-navy mb-4">Upload Course and Faculty Data</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        {/* Faculty Preferences Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-5 hover:border-uva-orange transition-colors">
          <div className="text-center">
            <FileSpreadsheet className="w-10 h-10 text-uva-orange mx-auto mb-2" />
            <h3 className="font-bold text-lg text-gray-900 mb-2">Faculty Preferences</h3>
            <p className="text-base text-gray-600 mb-3">
              Upload Excel or CSV with faculty preferences
            </p>

            <label className="cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFacultyFileChange}
                className="hidden"
              />
              <span className="inline-block px-5 py-2.5 text-base bg-uva-navy text-white rounded-lg hover:bg-uva-blue-light transition-colors font-semibold">
                Choose File
              </span>
            </label>

            {facultyFile && (
              <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{facultyFile.name}</span>
              </div>
            )}
          </div>

          <div className="mt-4 text-left">
            <p className="font-bold mb-2 text-base text-gray-700">Expected columns:</p>
            <div className="text-base text-gray-600 space-y-1">
              <div><strong className="text-uva-navy">facultyName</strong>, <strong className="text-uva-navy">preferredDays</strong>, <strong className="text-uva-navy">cannotTeachDays</strong></div>
              <div className="text-sm text-gray-500">Optional: email, shareParentingWith</div>
            </div>
          </div>
        </div>

        {/* Course Data Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-5 hover:border-uva-orange transition-colors">
          <div className="text-center">
            <Upload className="w-10 h-10 text-uva-orange mx-auto mb-2" />
            <h3 className="font-bold text-lg text-gray-900 mb-2">Course Data</h3>
            <p className="text-base text-gray-600 mb-3">
              Upload Excel or CSV with course information
            </p>

            <label className="cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleCourseFileChange}
                className="hidden"
              />
              <span className="inline-block px-5 py-2.5 text-base bg-uva-navy text-white rounded-lg hover:bg-uva-blue-light transition-colors font-semibold">
                Choose File
              </span>
            </label>

            {courseFile && (
              <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{courseFile.name}</span>
              </div>
            )}
          </div>

          <div className="mt-4 text-left">
            <p className="font-bold mb-2 text-base text-gray-700">Expected columns:</p>
            <div className="text-base text-gray-600 space-y-1">
              <div><strong className="text-uva-navy">code</strong>, <strong className="text-uva-navy">name</strong>, <strong className="text-uva-navy">type</strong>, <strong className="text-uva-navy">faculty</strong></div>
              <div><strong className="text-uva-navy">enrollmentCap</strong>, <strong className="text-uva-navy">numberOfSections</strong>, <strong className="text-uva-navy">duration</strong>, <strong className="text-uva-navy">sessionsPerWeek</strong></div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!facultyFile || !courseFile || loading}
        className="w-full px-6 py-3 bg-uva-orange text-white rounded-lg font-semibold hover:bg-uva-orange-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing Files...' : 'Continue to Configuration'}
      </button>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Sample Templates</h4>
        <p className="text-sm text-blue-700 mb-3">
          Download sample Excel templates to see the expected format:
        </p>
        <div className="flex gap-3">
          <button className="text-sm text-uva-orange hover:text-uva-orange-light font-medium">
            Download Faculty Template
          </button>
          <button className="text-sm text-uva-orange hover:text-uva-orange-light font-medium">
            Download Course Template
          </button>
        </div>
      </div>
    </div>
  );
}
