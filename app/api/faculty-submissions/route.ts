import { NextRequest, NextResponse } from 'next/server';
import { mockStorage } from '@/lib/azure/mockStorage';

// For now, we'll use mock storage
// When Azure is configured, uncomment these imports:
// import { saveFacultySubmission, getAllSubmissions } from '@/lib/azure/tableStorage';

/**
 * POST /api/faculty-submissions
 * Save a new faculty preference submission
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.facultyName || !body.email) {
      return NextResponse.json(
        { error: 'Faculty name and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Save submission (using mock storage for now)
    const submission = await mockStorage.saveFacultySubmission({
      facultyName: body.facultyName,
      email: body.email,
      preferredDays: body.preferredDays || '',
      cannotTeachDays: body.cannotTeachDays || '',
      preferredTimeSlots: body.preferredTimeSlots || '',
      shareParentingWith: body.shareParentingWith || '',
      additionalNotes: body.additionalNotes || '',
    });

    console.log(`✓ Saved preferences for ${submission.facultyName}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Preferences submitted successfully',
        submissionId: submission.rowKey,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error saving faculty submission:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save submission' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/faculty-submissions
 * Get all faculty preference submissions (for admin)
 */
export async function GET(request: NextRequest) {
  try {
    // Get all submissions (using mock storage for now)
    const submissions = await mockStorage.getAllSubmissions();

    return NextResponse.json({
      success: true,
      count: submissions.length,
      submissions,
    });
  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/faculty-submissions?id=xxx
 * Delete a submission (for admin)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      );
    }

    await mockStorage.deleteSubmission(id);

    return NextResponse.json({
      success: true,
      message: 'Submission deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting submission:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete submission' },
      { status: 500 }
    );
  }
}
