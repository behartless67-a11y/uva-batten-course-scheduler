'use client';

import { useState } from 'react';
import Link from 'next/link';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeSlotOptions = ['Morning (before 12pm)', 'Afternoon (12pm-5pm)', 'Evening (after 5pm)'];

export default function FacultySubmitPage() {
  const [formData, setFormData] = useState({
    facultyName: '',
    email: '',
    preferredDays: [] as string[],
    cannotTeachDays: [] as string[],
    preferredTimeSlots: [] as string[],
    shareParentingWith: '',
    additionalNotes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleDayToggle = (day: string, field: 'preferredDays' | 'cannotTeachDays') => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(day)
        ? prev[field].filter(d => d !== day)
        : [...prev[field], day],
    }));
  };

  const handleTimeSlotToggle = (slot: string) => {
    setFormData(prev => ({
      ...prev,
      preferredTimeSlots: prev.preferredTimeSlots.includes(slot)
        ? prev.preferredTimeSlots.filter(s => s !== slot)
        : [...prev.preferredTimeSlots, slot],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/faculty-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facultyName: formData.facultyName,
          email: formData.email,
          preferredDays: formData.preferredDays.join(','),
          cannotTeachDays: formData.cannotTeachDays.join(','),
          preferredTimeSlots: formData.preferredTimeSlots.join(','),
          shareParentingWith: formData.shareParentingWith,
          additionalNotes: formData.additionalNotes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit preferences');
      }

      setSubmitStatus('success');
      // Reset form
      setFormData({
        facultyName: '',
        email: '',
        preferredDays: [],
        cannotTeachDays: [],
        preferredTimeSlots: [],
        shareParentingWith: '',
        additionalNotes: '',
      });
    } catch (error: any) {
      console.error('Submission error:', error);
      setSubmitStatus('error');
      setErrorMessage(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('/garrett-hall-grayscale.jpg')" }}
    >
      <div className="min-h-screen bg-white bg-opacity-95 backdrop-blur-sm">
        {/* Header */}
        <div className="bg-uva-navy text-white py-6 shadow-lg">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl font-bold">UVA Batten School</h1>
            <p className="text-xl mt-2">Faculty Teaching Preferences</p>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* Back Link */}
          <Link
            href="/"
            className="inline-flex items-center text-uva-navy hover:text-uva-orange mb-6 transition-colors"
          >
            <span className="mr-2">←</span> Back to Scheduler
          </Link>

          {/* Form Card */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-uva-navy mb-2">
                Submit Your Teaching Preferences
              </h2>
              <p className="text-gray-600">
                Please fill out this form to let us know your teaching day and time preferences
                for the upcoming semester. This information will be used to create the course
                schedule.
              </p>
            </div>

            {/* Success Message */}
            {submitStatus === 'success' && (
              <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-800 rounded-lg">
                <p className="font-semibold">✓ Preferences submitted successfully!</p>
                <p className="text-sm mt-1">
                  Thank you for submitting your preferences. You will receive a confirmation email
                  shortly.
                </p>
              </div>
            )}

            {/* Error Message */}
            {submitStatus === 'error' && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-800 rounded-lg">
                <p className="font-semibold">✗ Submission failed</p>
                <p className="text-sm mt-1">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Faculty Name */}
              <div>
                <label htmlFor="facultyName" className="block font-semibold text-gray-800 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="facultyName"
                  required
                  value={formData.facultyName}
                  onChange={e => setFormData(prev => ({ ...prev, facultyName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uva-orange focus:border-transparent text-base"
                  placeholder="Dr. Jane Smith"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block font-semibold text-gray-800 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uva-orange focus:border-transparent text-base"
                  placeholder="jsmith@virginia.edu"
                />
              </div>

              {/* Preferred Days */}
              <div>
                <label className="block font-semibold text-gray-800 mb-2">
                  Preferred Teaching Days
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Select the days you prefer to teach (select multiple if applicable)
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {daysOfWeek.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day, 'preferredDays')}
                      className={`px-4 py-3 rounded-lg border-2 text-base font-medium transition-all ${
                        formData.preferredDays.includes(day)
                          ? 'bg-uva-orange text-white border-uva-orange'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-uva-orange'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cannot Teach Days */}
              <div>
                <label className="block font-semibold text-gray-800 mb-2">
                  Days You Cannot Teach
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Select the days you are NOT available to teach
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {daysOfWeek.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day, 'cannotTeachDays')}
                      className={`px-4 py-3 rounded-lg border-2 text-base font-medium transition-all ${
                        formData.cannotTeachDays.includes(day)
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-red-600'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Time Slots */}
              <div>
                <label className="block font-semibold text-gray-800 mb-2">
                  Preferred Time Slots
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Select your preferred teaching times
                </p>
                <div className="space-y-2">
                  {timeSlotOptions.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => handleTimeSlotToggle(slot)}
                      className={`w-full px-4 py-3 rounded-lg border-2 text-base font-medium text-left transition-all ${
                        formData.preferredTimeSlots.includes(slot)
                          ? 'bg-uva-orange text-white border-uva-orange'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-uva-orange'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Share Parenting With */}
              <div>
                <label htmlFor="shareParentingWith" className="block font-semibold text-gray-800 mb-2">
                  Share Parenting Responsibilities With
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  If you share parenting responsibilities with another faculty member, enter their
                  name here
                </p>
                <input
                  type="text"
                  id="shareParentingWith"
                  value={formData.shareParentingWith}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, shareParentingWith: e.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uva-orange focus:border-transparent text-base"
                  placeholder="Dr. John Doe"
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label htmlFor="additionalNotes" className="block font-semibold text-gray-800 mb-2">
                  Additional Notes or Constraints
                </label>
                <textarea
                  id="additionalNotes"
                  rows={4}
                  value={formData.additionalNotes}
                  onChange={e => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uva-orange focus:border-transparent text-base"
                  placeholder="Any other preferences, constraints, or notes you'd like us to know..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-uva-orange hover:bg-opacity-90 text-white font-bold py-4 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Preferences'}
                </button>
                <Link
                  href="/"
                  className="px-6 py-4 border-2 border-gray-300 rounded-lg hover:border-uva-navy transition-colors text-center text-lg font-semibold text-gray-700"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
