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
    <div className="bg-white rounded-lg shadow-md p-8 w-full">
      <h2 className="text-2xl font-bold text-uva-navy mb-6">Upload Course and Faculty Data</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
        {/* Faculty Preferences Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-uva-orange transition-colors">
          <div className="text-center">
            <FileSpreadsheet className="w-12 h-12 text-uva-orange mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Faculty Preferences</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload an Excel or CSV file with faculty teaching preferences
            </p>

            <label className="cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFacultyFileChange}
                className="hidden"
              />
              <span className="inline-block px-4 py-2 bg-uva-navy text-white rounded-lg hover:bg-uva-blue-light transition-colors">
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

          <div className="mt-6 text-sm text-gray-600 text-left">
            <p className="font-semibold mb-3 text-base">Expected columns:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-uva-orange mt-1">•</span>
                <span><strong>facultyName</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-uva-orange mt-1">•</span>
                <span><strong>email</strong> (optional)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-uva-orange mt-1">•</span>
                <span><strong>preferredDays</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-uva-orange mt-1">•</span>
                <span><strong>cannotTeachDays</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-uva-orange mt-1">•</span>
                <span><strong>shareParentingWith</strong> (optional)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Course Data Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-uva-orange transition-colors">
          <div className="text-center">
            <Upload className="w-12 h-12 text-uva-orange mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Course Data</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload an Excel or CSV file with course information
            </p>

            <label className="cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleCourseFileChange}
                className="hidden"
              />
              <span className="inline-block px-4 py-2 bg-uva-navy text-white rounded-lg hover:bg-uva-blue-light transition-colors">
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

          <div className="mt-6 text-sm text-gray-600 text-left">
            <p className="font-semibold mb-3 text-base">Expected columns:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-uva-orange mt-1">•</span>
                <span><strong>code</strong> (e.g., LPPA 7110)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-uva-orange mt-1">•</span>
                <span><strong>name</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-uva-orange mt-1">•</span>
                <span><strong>type</strong> (Core/Elective/Capstone)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-uva-orange mt-1">•</span>
                <span><strong>faculty</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-uva-orange mt-1">•</span>
                <span><strong>enrollmentCap</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-uva-orange mt-1">•</span>
                <span><strong>numberOfSections</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-uva-orange mt-1">•</span>
                <span><strong>duration</strong> (minutes)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-uva-orange mt-1">•</span>
                <span><strong>sessionsPerWeek</strong></span>
              </li>
            </ul>
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
