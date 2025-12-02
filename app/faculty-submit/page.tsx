'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeSlotOptions = ['Morning (before 12pm)', 'Afternoon (12pm-5pm)', 'Evening (after 5pm)'];
const dayPreferenceOptions = ['Ideal', 'Acceptable', 'Cannot'];

type DayPreference = 'Ideal' | 'Acceptable' | 'Cannot' | '';

interface DayPreferences {
  Monday: DayPreference;
  Tuesday: DayPreference;
  Wednesday: DayPreference;
  Thursday: DayPreference;
  Friday: DayPreference;
}

export default function FacultySubmitPage() {
  const [formData, setFormData] = useState({
    // Faculty Info
    facultyName: '',
    email: '',
    dayPreferences: {
      Monday: '',
      Tuesday: '',
      Wednesday: '',
      Thursday: '',
      Friday: '',
    } as DayPreferences,
    preferredTimeSlots: [] as string[],
    shareParentingWith: '',
    budgetNotes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleDayPreferenceChange = (day: keyof DayPreferences, value: DayPreference) => {
    setFormData(prev => ({
      ...prev,
      dayPreferences: {
        ...prev.dayPreferences,
        [day]: value,
      },
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

  // Convert day preferences to the format expected by the API
  const convertDayPreferences = () => {
    const idealDays: string[] = [];
    const cannotDays: string[] = [];

    Object.entries(formData.dayPreferences).forEach(([day, pref]) => {
      if (pref === 'Ideal') {
        idealDays.push(day);
      } else if (pref === 'Cannot') {
        cannotDays.push(day);
      }
    });

    return { idealDays, cannotDays };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const { idealDays, cannotDays } = convertDayPreferences();

      const response = await fetch('/api/faculty-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facultyName: formData.facultyName,
          email: formData.email,
          preferredDays: idealDays.join(','),
          cannotTeachDays: cannotDays.join(','),
          dayPreferences: formData.dayPreferences,
          preferredTimeSlots: formData.preferredTimeSlots.join(','),
          shareParentingWith: formData.shareParentingWith,
          budgetNotes: formData.budgetNotes,
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
        dayPreferences: {
          Monday: '',
          Tuesday: '',
          Wednesday: '',
          Thursday: '',
          Friday: '',
        },
        preferredTimeSlots: [],
        shareParentingWith: '',
        budgetNotes: '',
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
        <header className="bg-uva-navy text-white shadow-lg">
          <div className="max-w-[98vw] mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-uva-orange" />
                <div>
                  <h1 className="text-3xl font-bold font-serif">UVA Batten Course Scheduling Tool</h1>
                  <p className="text-sm text-gray-300 mt-1">
                    Faculty Teaching Preferences Submission
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/"
                  className="px-4 py-2 bg-white hover:bg-gray-100 text-uva-navy font-semibold rounded-lg transition-all"
                >
                  Main Scheduler
                </Link>
                <Link
                  href="/admin"
                  className="px-4 py-2 bg-uva-orange hover:bg-opacity-90 text-white font-semibold rounded-lg transition-all"
                >
                  Admin Dashboard
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-8">

          {/* Form Card */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-uva-navy mb-2">
                Submit Teaching Preferences
              </h2>
              <p className="text-gray-600">
                Please provide your teaching availability and preferences for the upcoming
                semester. Course assignments are handled separately - this form is only for
                your scheduling preferences.
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

              {/* Section Divider */}
              <div className="border-t-2 border-uva-navy pt-6 mt-8">
                <h3 className="text-xl font-bold text-uva-navy mb-2">Teaching Days</h3>
                <p className="text-gray-600 text-sm">
                  For each day, indicate your availability: <strong>Ideal</strong> (preferred),
                  <strong> Acceptable</strong> (can teach if needed), or <strong>Cannot</strong> (not available)
                </p>
              </div>

              {/* Day Preferences - Dropdowns */}
              <div className="space-y-4">
                {daysOfWeek.map(day => (
                  <div key={day} className="flex items-center gap-4">
                    <label className="w-32 font-semibold text-gray-800">
                      {day}
                    </label>
                    <select
                      value={formData.dayPreferences[day as keyof DayPreferences]}
                      onChange={e => handleDayPreferenceChange(day as keyof DayPreferences, e.target.value as DayPreference)}
                      className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-uva-orange focus:border-transparent text-base ${
                        formData.dayPreferences[day as keyof DayPreferences] === 'Ideal'
                          ? 'bg-green-50 border-green-400'
                          : formData.dayPreferences[day as keyof DayPreferences] === 'Acceptable'
                          ? 'bg-yellow-50 border-yellow-400'
                          : formData.dayPreferences[day as keyof DayPreferences] === 'Cannot'
                          ? 'bg-red-50 border-red-400'
                          : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select availability...</option>
                      {dayPreferenceOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Preferred Time Slots */}
              <div>
                <label className="block font-semibold text-gray-800 mb-2">
                  Preferred Time Slots
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Select your preferred teaching times (select all that apply)
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
                  name here. This ensures you won&apos;t be scheduled at conflicting times.
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

              {/* Section Divider */}
              <div className="border-t-2 border-uva-navy pt-6 mt-8">
                <h3 className="text-xl font-bold text-uva-navy mb-2">Course-Related Budget Requests</h3>
                <p className="text-gray-600 text-sm">
                  Please note any budget-related requests for your courses (e.g., guest speakers,
                  field trips, materials, software licenses, etc.)
                </p>
              </div>

              {/* Budget Notes */}
              <div>
                <label htmlFor="budgetNotes" className="block font-semibold text-gray-800 mb-2">
                  Budget Request Notes
                </label>
                <textarea
                  id="budgetNotes"
                  rows={4}
                  value={formData.budgetNotes}
                  onChange={e => setFormData(prev => ({ ...prev, budgetNotes: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uva-orange focus:border-transparent text-base"
                  placeholder="E.g., Need $500 for guest speaker honorarium, $200 for field trip transportation, software license for data analysis..."
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
