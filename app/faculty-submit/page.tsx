'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeSlotOptions = ['Morning (before 12pm)', 'Afternoon (12pm-5pm)', 'Evening (after 5pm)'];
const courseTypes = ['Core', 'Elective', 'Capstone'];
const durationOptions = [75, 80, 150];
const sessionsPerWeekOptions = [1, 2, 4];
const targetProgramOptions = [
  'MPP Year 1',
  'MPP Year 2',
  'BA Year 2',
  'BA Year 3',
  'BA Year 4',
  'Minor',
  'Certificate'
];

export default function FacultySubmitPage() {
  const [formData, setFormData] = useState({
    // Faculty Info
    facultyName: '',
    email: '',
    preferredDays: [] as string[],
    cannotTeachDays: [] as string[],
    preferredTimeSlots: [] as string[],
    shareParentingWith: '',
    additionalNotes: '',

    // Course Info
    courseCode: '',
    courseName: '',
    courseType: 'Core',
    enrollmentCap: '',
    numberOfSections: '2',
    numberOfDiscussions: '0',
    duration: '80',
    sessionsPerWeek: '2',
    targetPrograms: [] as string[],
    courseNotes: '',
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

  const handleTargetProgramToggle = (program: string) => {
    setFormData(prev => ({
      ...prev,
      targetPrograms: prev.targetPrograms.includes(program)
        ? prev.targetPrograms.filter(p => p !== program)
        : [...prev.targetPrograms, program],
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
          // Faculty Info
          facultyName: formData.facultyName,
          email: formData.email,
          preferredDays: formData.preferredDays.join(','),
          cannotTeachDays: formData.cannotTeachDays.join(','),
          preferredTimeSlots: formData.preferredTimeSlots.join(','),
          shareParentingWith: formData.shareParentingWith,
          additionalNotes: formData.additionalNotes,

          // Course Info
          courseCode: formData.courseCode,
          courseName: formData.courseName,
          courseType: formData.courseType,
          enrollmentCap: formData.enrollmentCap,
          numberOfSections: formData.numberOfSections,
          numberOfDiscussions: formData.numberOfDiscussions,
          duration: formData.duration,
          sessionsPerWeek: formData.sessionsPerWeek,
          targetPrograms: formData.targetPrograms.join(','),
          courseNotes: formData.courseNotes,
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
        courseCode: '',
        courseName: '',
        courseType: 'Core',
        enrollmentCap: '',
        numberOfSections: '2',
        numberOfDiscussions: '0',
        duration: '80',
        sessionsPerWeek: '2',
        targetPrograms: [],
        courseNotes: '',
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
                    Course & Teaching Preferences Submission
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
                Submit Course and Teaching Preferences
              </h2>
              <p className="text-gray-600">
                Please provide your course information and teaching preferences for the upcoming
                semester. This comprehensive form collects both course details and your scheduling
                preferences to help us create an optimal schedule.
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
                <h3 className="text-xl font-bold text-uva-navy mb-2">Course Information</h3>
                <p className="text-gray-600 text-sm">
                  Please provide information about the course(s) you will be teaching
                </p>
              </div>

              {/* Course Code */}
              <div>
                <label htmlFor="courseCode" className="block font-semibold text-gray-800 mb-2">
                  Course Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="courseCode"
                  required
                  value={formData.courseCode}
                  onChange={e => setFormData(prev => ({ ...prev, courseCode: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uva-orange focus:border-transparent text-base"
                  placeholder="LPPA 7110"
                />
              </div>

              {/* Course Name */}
              <div>
                <label htmlFor="courseName" className="block font-semibold text-gray-800 mb-2">
                  Course Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="courseName"
                  required
                  value={formData.courseName}
                  onChange={e => setFormData(prev => ({ ...prev, courseName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uva-orange focus:border-transparent text-base"
                  placeholder="Economics 2"
                />
              </div>

              {/* Course Type and Enrollment Cap - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="courseType" className="block font-semibold text-gray-800 mb-2">
                    Course Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="courseType"
                    required
                    value={formData.courseType}
                    onChange={e => setFormData(prev => ({ ...prev, courseType: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uva-orange focus:border-transparent text-base"
                  >
                    {courseTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="enrollmentCap" className="block font-semibold text-gray-800 mb-2">
                    Enrollment Cap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="enrollmentCap"
                    required
                    min="1"
                    value={formData.enrollmentCap}
                    onChange={e => setFormData(prev => ({ ...prev, enrollmentCap: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uva-orange focus:border-transparent text-base"
                    placeholder="30"
                  />
                </div>
              </div>

              {/* Number of Sections and Discussions - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="numberOfSections" className="block font-semibold text-gray-800 mb-2">
                    Number of Sections <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="numberOfSections"
                    required
                    value={formData.numberOfSections}
                    onChange={e => setFormData(prev => ({ ...prev, numberOfSections: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uva-orange focus:border-transparent text-base"
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="numberOfDiscussions" className="block font-semibold text-gray-800 mb-2">
                    Number of Discussion Sections
                  </label>
                  <select
                    id="numberOfDiscussions"
                    value={formData.numberOfDiscussions}
                    onChange={e => setFormData(prev => ({ ...prev, numberOfDiscussions: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uva-orange focus:border-transparent text-base"
                  >
                    {[0, 2, 4, 6, 8, 10, 12, 14].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Duration and Sessions Per Week - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="duration" className="block font-semibold text-gray-800 mb-2">
                    Class Duration (minutes) <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="duration"
                    required
                    value={formData.duration}
                    onChange={e => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uva-orange focus:border-transparent text-base"
                  >
                    {durationOptions.map(dur => (
                      <option key={dur} value={dur}>{dur} minutes</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="sessionsPerWeek" className="block font-semibold text-gray-800 mb-2">
                    Sessions Per Week <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="sessionsPerWeek"
                    required
                    value={formData.sessionsPerWeek}
                    onChange={e => setFormData(prev => ({ ...prev, sessionsPerWeek: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uva-orange focus:border-transparent text-base"
                  >
                    {sessionsPerWeekOptions.map(num => (
                      <option key={num} value={num}>{num} session{num > 1 ? 's' : ''} per week</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Target Programs */}
              <div>
                <label className="block font-semibold text-gray-800 mb-2">
                  Target Student Programs <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Select all student groups this course is designed for
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {targetProgramOptions.map(program => (
                    <button
                      key={program}
                      type="button"
                      onClick={() => handleTargetProgramToggle(program)}
                      className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        formData.targetPrograms.includes(program)
                          ? 'bg-uva-orange text-white border-uva-orange'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-uva-orange'
                      }`}
                    >
                      {program}
                    </button>
                  ))}
                </div>
              </div>

              {/* Course Notes */}
              <div>
                <label htmlFor="courseNotes" className="block font-semibold text-gray-800 mb-2">
                  Course-Specific Notes
                </label>
                <textarea
                  id="courseNotes"
                  rows={3}
                  value={formData.courseNotes}
                  onChange={e => setFormData(prev => ({ ...prev, courseNotes: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uva-orange focus:border-transparent text-base"
                  placeholder="Any special requirements for this course..."
                />
              </div>

              {/* Section Divider */}
              <div className="border-t-2 border-uva-navy pt-6 mt-8">
                <h3 className="text-xl font-bold text-uva-navy mb-2">Teaching Preferences</h3>
                <p className="text-gray-600 text-sm">
                  Let us know your preferred days and times for teaching
                </p>
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
