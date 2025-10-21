import { NextRequest, NextResponse } from 'next/server';
import { generateCourseSchedule } from '@/lib/scheduling/scheduler';
import { Course, Faculty, SchedulerConfig, Schedule } from '@/types/scheduling';

// In-memory storage (replace with database in production)
let schedules: Schedule[] = [];

/**
 * GET /api/schedules - List all schedules
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const semester = searchParams.get('semester');
    const year = searchParams.get('year');
    const status = searchParams.get('status');

    let filtered = schedules;

    if (semester) {
      filtered = filtered.filter(s => s.semester === semester);
    }

    if (year) {
      filtered = filtered.filter(s => s.year === parseInt(year));
    }

    if (status) {
      filtered = filtered.filter(s => s.status === status);
    }

    return NextResponse.json({
      success: true,
      schedules: filtered,
      count: filtered.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/schedules - Create a new schedule
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received body with keys:', Object.keys(body));
    console.log('Config:', !!body.config, 'Courses:', body.courses?.length, 'Faculty:', body.faculty?.length);

    const { config, courses, faculty } = body as {
      config: SchedulerConfig;
      courses: Course[];
      faculty: Faculty[];
    };

    // Validate input
    if (!config || !courses || !faculty) {
      console.error('Validation failed');
      return NextResponse.json(
        { success: false, error: 'Missing required fields: config, courses, faculty' },
        { status: 400 }
      );
    }

    console.log(`Starting schedule generation: ${courses.length} courses, ${faculty.length} faculty`);

    // Generate schedule using CSP algorithm
    const result = generateCourseSchedule(config, courses, faculty);

    console.log('Generation complete. Success:', result.success);
    if (result.errors && result.errors.length > 0) {
      console.error('Errors:', result.errors);
    }

    if (!result.success || !result.schedule) {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate schedule',
        errors: result.errors,
        warnings: result.warnings,
      }, { status: 400 });
    }

    // Store the schedule
    schedules.push(result.schedule);

    console.log('Schedule stored successfully');

    return NextResponse.json({
      success: true,
      schedule: result.schedule,
      stats: result.stats,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create schedule' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/schedules - Delete all schedules (for testing)
 */
export async function DELETE() {
  schedules = [];
  return NextResponse.json({ success: true, message: 'All schedules deleted' });
}
