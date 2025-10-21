'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { FacultySubmissionEntity } from '@/lib/azure/tableStorage';

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState<FacultySubmissionEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/faculty-submissions');
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (err: any) {
      console.error('Error fetching submissions:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) {
      return;
    }

    try {
      const response = await fetch(`/api/faculty-submissions?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete submission');
      }
      await fetchSubmissions();
    } catch (err: any) {
      alert('Failed to delete submission: ' + err.message);
    }
  };

  const exportToExcel = () => {
    if (submissions.length === 0) {
      alert('No submissions to export');
      return;
    }

    // Transform data for Excel
    const excelData = filteredSubmissions.map(sub => ({
      'Faculty Name': sub.facultyName,
      'Email': sub.email,
      'Preferred Days': sub.preferredDays || 'None',
      'Cannot Teach Days': sub.cannotTeachDays || 'None',
      'Preferred Time Slots': sub.preferredTimeSlots || 'None',
      'Share Parenting With': sub.shareParentingWith || 'N/A',
      'Additional Notes': sub.additionalNotes || '',
      'Submitted At': new Date(sub.submittedAt).toLocaleString(),
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // Faculty Name
      { wch: 30 }, // Email
      { wch: 30 }, // Preferred Days
      { wch: 30 }, // Cannot Teach Days
      { wch: 35 }, // Preferred Time Slots
      { wch: 25 }, // Share Parenting With
      { wch: 50 }, // Additional Notes
      { wch: 20 }, // Submitted At
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Faculty Preferences');

    // Download
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `faculty-preferences-${timestamp}.xlsx`);
  };

  const filteredSubmissions = submissions.filter(sub =>
    filter === '' ||
    sub.facultyName.toLowerCase().includes(filter.toLowerCase()) ||
    sub.email.toLowerCase().includes(filter.toLowerCase())
  );

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

      <div className="min-h-screen">
        {/* Header */}
        <div className="bg-uva-navy text-white py-6 shadow-lg">
          <div className="max-w-[98vw] mx-auto px-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold">UVA Batten School</h1>
                <p className="text-xl mt-2">Faculty Preferences - Admin Dashboard</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/"
                  className="px-4 py-2 bg-white hover:bg-gray-100 text-uva-navy font-semibold rounded-lg transition-all"
                >
                  Main Scheduler
                </Link>
                <Link
                  href="/faculty-submit"
                  className="px-4 py-2 bg-uva-orange hover:bg-opacity-90 text-white font-semibold rounded-lg transition-all"
                >
                  Faculty Form
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-[98vw] mx-auto px-4 py-8">

          {/* Controls */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex-1 max-w-md">
                <label htmlFor="filter" className="block text-sm font-semibold text-gray-700 mb-2">
                  Search Submissions
                </label>
                <input
                  type="text"
                  id="filter"
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uva-orange focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={fetchSubmissions}
                  disabled={isLoading}
                  className="px-6 py-2 bg-uva-navy text-white font-semibold rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Refreshing...' : 'Refresh'}
                </button>
                <button
                  onClick={exportToExcel}
                  disabled={filteredSubmissions.length === 0}
                  className="px-6 py-2 bg-uva-orange text-white font-semibold rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50"
                >
                  Export to Excel
                </button>
              </div>
            </div>

            <div className="mt-4 text-gray-600">
              <p className="text-sm">
                Total submissions: <strong>{submissions.length}</strong>
                {filter && ` | Showing: ${filteredSubmissions.length}`}
              </p>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-800 p-4 rounded-lg mb-6">
              <p className="font-semibold">Error loading submissions</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-uva-orange"></div>
              <p className="mt-4 text-gray-600">Loading submissions...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredSubmissions.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-xl text-gray-600 mb-4">
                {filter ? 'No submissions match your search' : 'No submissions yet'}
              </p>
              <Link
                href="/faculty-submit"
                className="inline-block px-6 py-3 bg-uva-orange text-white font-semibold rounded-lg hover:bg-opacity-90 transition-all"
              >
                Go to Submission Form
              </Link>
            </div>
          )}

          {/* Submissions Table */}
          {!isLoading && filteredSubmissions.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-uva-navy text-white">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">Faculty Name</th>
                      <th className="px-6 py-4 text-left font-semibold">Email</th>
                      <th className="px-6 py-4 text-left font-semibold">Preferred Days</th>
                      <th className="px-6 py-4 text-left font-semibold">Cannot Teach</th>
                      <th className="px-6 py-4 text-left font-semibold">Time Preferences</th>
                      <th className="px-6 py-4 text-left font-semibold">Submitted</th>
                      <th className="px-6 py-4 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredSubmissions.map(sub => (
                      <tr key={sub.rowKey} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{sub.facultyName}</td>
                        <td className="px-6 py-4 text-gray-600 text-sm">{sub.email}</td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {sub.preferredDays || <span className="text-gray-400">None</span>}
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {sub.cannotTeachDays || <span className="text-gray-400">None</span>}
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {sub.preferredTimeSlots || <span className="text-gray-400">None</span>}
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {new Date(sub.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDelete(sub.rowKey)}
                            className="text-red-600 hover:text-red-800 font-semibold text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
