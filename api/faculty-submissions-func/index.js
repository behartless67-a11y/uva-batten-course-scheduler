/**
 * Azure Function for Faculty Submissions
 * Handles GET, POST, and DELETE operations for faculty preference submissions
 */

// In-memory storage (will persist during function lifetime)
let submissions = [];

module.exports = async function (context, req) {
  context.log('Faculty submissions function triggered');

  // Set CORS headers
  context.res = {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  };

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    context.res.status = 200;
    return;
  }

  try {
    // GET - Fetch all submissions
    if (req.method === 'GET') {
      context.log(`Fetching ${submissions.length} submissions`);
      context.res.status = 200;
      context.res.body = {
        success: true,
        count: submissions.length,
        submissions: submissions,
      };
      return;
    }

    // POST - Create new submission
    if (req.method === 'POST') {
      const body = req.body;

      // Validate required fields
      if (!body.facultyName || !body.email) {
        context.res.status = 400;
        context.res.body = { error: 'Faculty name and email are required' };
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        context.res.status = 400;
        context.res.body = { error: 'Invalid email format' };
        return;
      }

      // Create submission
      const submission = {
        partitionKey: 'FacultyPreferences',
        rowKey: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

        // Faculty Info
        facultyName: body.facultyName,
        email: body.email,
        preferredDays: body.preferredDays || '',
        cannotTeachDays: body.cannotTeachDays || '',
        preferredTimeSlots: body.preferredTimeSlots || '',
        shareParentingWith: body.shareParentingWith || '',
        additionalNotes: body.additionalNotes || '',

        // Course Info
        courseCode: body.courseCode || '',
        courseName: body.courseName || '',
        courseType: body.courseType || '',
        enrollmentCap: body.enrollmentCap || '',
        numberOfSections: body.numberOfSections || '',
        numberOfDiscussions: body.numberOfDiscussions || '',
        duration: body.duration || '',
        sessionsPerWeek: body.sessionsPerWeek || '',
        targetPrograms: body.targetPrograms || '',
        courseNotes: body.courseNotes || '',

        submittedAt: new Date().toISOString(),
      };

      submissions.push(submission);
      context.log(`Saved submission for ${submission.facultyName}`);

      context.res.status = 201;
      context.res.body = {
        success: true,
        message: 'Preferences submitted successfully',
        submissionId: submission.rowKey,
      };
      return;
    }

    // DELETE - Remove a submission
    if (req.method === 'DELETE') {
      const id = req.query.id;

      if (!id) {
        context.res.status = 400;
        context.res.body = { error: 'Submission ID is required' };
        return;
      }

      const index = submissions.findIndex(s => s.rowKey === id);
      if (index !== -1) {
        submissions.splice(index, 1);
        context.log(`Deleted submission: ${id}`);
        context.res.status = 200;
        context.res.body = {
          success: true,
          message: 'Submission deleted successfully',
        };
      } else {
        context.res.status = 404;
        context.res.body = { error: 'Submission not found' };
      }
      return;
    }

    // Method not allowed
    context.res.status = 405;
    context.res.body = { error: 'Method not allowed' };
  } catch (error) {
    context.log.error('Error in faculty-submissions function:', error);
    context.res.status = 500;
    context.res.body = {
      error: error.message || 'Internal server error',
    };
  }
};
