'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { parseCombinedData } from '@/lib/utils/fileParser';
import { Faculty, Course } from '@/types/scheduling';

interface FileUploadSectionProps {
  onFilesUploaded: (faculty: Faculty[], courses: Course[]) => void;
}

export default function FileUploadSection({ onFilesUploaded }: FileUploadSectionProps) {
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDataFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!dataFile) {
      setError('Please upload a course and faculty data file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Starting to parse combined data file:', dataFile.name);
      // Parse combined course and faculty data
      const { faculty, courses } = await parseCombinedData(dataFile);
      console.log('Parsed faculty:', faculty.length, 'members');
      console.log('Parsed courses:', courses.length, 'courses');

      onFilesUploaded(faculty, courses);
    } catch (err) {
      console.error('Error parsing file:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 w-full">
      <h2 className="text-3xl font-bold text-uva-navy mb-4">Upload Course and Faculty Data</h2>

      <div className="mb-6">
        {/* Combined Data Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-uva-orange transition-colors">
          <div className="text-center">
            <FileSpreadsheet className="w-12 h-12 text-uva-orange mx-auto mb-3" />
            <h3 className="font-bold text-xl text-gray-900 mb-2">Upload Combined Course & Faculty Data</h3>
            <p className="text-base text-gray-600 mb-4">
              Upload a single Excel or CSV file with course and faculty information
            </p>

            <label className="cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <span className="inline-block px-6 py-3 text-base bg-uva-navy text-white rounded-lg hover:bg-uva-blue-light transition-colors font-semibold">
                Choose File
              </span>
            </label>

            {dataFile && (
              <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-base font-medium">{dataFile.name}</span>
              </div>
            )}
          </div>

          <div className="mt-6 text-left bg-gray-50 rounded-lg p-4">
            <p className="font-bold mb-3 text-base text-gray-800">Required columns:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
              <div>
                <p className="font-semibold text-gray-700 mb-1">Course Information:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>code</strong> - Course code (e.g., LPPA 7110)</li>
                  <li><strong>name</strong> - Course name</li>
                  <li><strong>type</strong> - Core/Elective/Capstone</li>
                  <li><strong>enrollmentCap</strong> - Max students</li>
                  <li><strong>numberOfSections</strong> - Number of sections</li>
                  <li><strong>duration</strong> - Minutes per session</li>
                  <li><strong>sessionsPerWeek</strong> - Meetings per week</li>
                  <li><strong>targetPrograms</strong> - Student cohorts (e.g., "MPP Year 1")</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-1">Faculty Information:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>faculty</strong> - Faculty name</li>
                  <li><strong>facultyEmail</strong> - Email address</li>
                  <li><strong>facultyPreferredDays</strong> - Preferred teaching days</li>
                  <li><strong>facultyCannotTeachDays</strong> - Days unavailable</li>
                  <li><strong>shareParentingWith</strong> - Partner faculty name</li>
                </ul>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Optional: numberOfDiscussions, notes
            </p>
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
        disabled={!dataFile || loading}
        className="w-full px-6 py-3 bg-uva-orange text-white rounded-lg font-semibold hover:bg-uva-orange-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing File...' : 'Continue to Configuration'}
      </button>
    </div>
  );
}

// Server-side component for download links - renders as static HTML
export function TemplateDownloadSection() {
  return (
    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="font-semibold text-blue-900 mb-2">Sample Template</h4>
      <p className="text-sm text-blue-700 mb-3">
        Download a sample CSV template to see the expected format:
      </p>
      <div className="flex gap-3">
        <a
          href="/templates/course-faculty-template.csv"
          download="course-faculty-template.csv"
          className="text-sm text-uva-orange hover:text-uva-orange-light font-medium underline cursor-pointer"
        >
          Download Combined Template
        </a>
      </div>
    </div>
  );
}
