import { NextRequest, NextResponse } from 'next/server';
import { Schedule, ScheduledSection } from '@/types/scheduling';

// In-memory storage (should match the one in parent route)
let schedules: Schedule[] = [];

/**
 * GET /api/schedules/[id] - Get a specific schedule
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const schedule = schedules.find(s => s.id === id);

    if (!schedule) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      schedule,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schedule' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/schedules/[id] - Update a schedule
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const scheduleIndex = schedules.findIndex(s => s.id === id);

    if (scheduleIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      );
    }

    // Update the schedule
    schedules[scheduleIndex] = {
      ...schedules[scheduleIndex],
      ...body,
      updatedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      schedule: schedules[scheduleIndex],
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update schedule' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/schedules/[id] - Delete a schedule
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scheduleIndex = schedules.findIndex(s => s.id === id);

    if (scheduleIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      );
    }

    schedules.splice(scheduleIndex, 1);

    return NextResponse.json({
      success: true,
      message: 'Schedule deleted',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete schedule' },
      { status: 500 }
    );
  }
}
