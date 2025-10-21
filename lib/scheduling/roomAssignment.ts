import { Room, RoomType, ROOM_CAPACITIES, Course, CourseType } from '@/types/scheduling';

// Pre-defined rooms based on requirements
export const ROOMS: Room[] = [
  {
    id: 'dell',
    name: 'Dell',
    type: RoomType.DELL,
    capacity: ROOM_CAPACITIES[RoomType.DELL],
  },
  {
    id: 'rouss',
    name: 'Rouss Hall',
    type: RoomType.ROUSS,
    capacity: ROOM_CAPACITIES[RoomType.ROUSS],
  },
  {
    id: 'pavilion-viii',
    name: 'Pavilion VIII',
    type: RoomType.PAVILION_VIII,
    capacity: ROOM_CAPACITIES[RoomType.PAVILION_VIII],
  },
  {
    id: 'ureg-1',
    name: 'UREG Assigned Room 1',
    type: RoomType.UREG_ASSIGNED,
    capacity: ROOM_CAPACITIES[RoomType.UREG_ASSIGNED],
  },
  {
    id: 'ureg-2',
    name: 'UREG Assigned Room 2',
    type: RoomType.UREG_ASSIGNED,
    capacity: ROOM_CAPACITIES[RoomType.UREG_ASSIGNED],
  },
  {
    id: 'ureg-3',
    name: 'UREG Assigned Room 3',
    type: RoomType.UREG_ASSIGNED,
    capacity: ROOM_CAPACITIES[RoomType.UREG_ASSIGNED],
  },
];

/**
 * Assigns a room to a course section based on priority rules:
 * 1. Dell (60 capacity) - for large lectures
 * 2. Rouss Hall (48 capacity) - for medium courses
 * 3. Pavilion VIII (18 capacity) - for small electives and capstones
 * 4. UREG Assigned - for everything else
 */
export function assignRoom(course: Course, enrollmentCap: number): Room {
  // Priority 1: Check for explicit preferred room
  if (course.preferredRoom) {
    const preferredRoom = ROOMS.find(r => r.type === course.preferredRoom);
    if (preferredRoom && preferredRoom.capacity >= enrollmentCap) {
      return preferredRoom;
    }
  }

  // Priority 2: Core courses need Dell or Rouss
  if (course.type === CourseType.CORE) {
    // If only one section, must use large lecture hall
    if (course.numberOfSections === 1) {
      return ROOMS.find(r => r.type === RoomType.DELL)!;
    }

    // Multiple sections - prefer Dell then Rouss
    if (enrollmentCap > 48) {
      return ROOMS.find(r => r.type === RoomType.DELL)!;
    } else {
      return ROOMS.find(r => r.type === RoomType.ROUSS)!;
    }
  }

  // Priority 3: Capstones prefer Pavilion VIII
  if (course.type === CourseType.CAPSTONE || course.type === CourseType.ADVANCED_PROJECT) {
    if (enrollmentCap <= 20) {
      return ROOMS.find(r => r.type === RoomType.PAVILION_VIII)!;
    }
  }

  // Priority 4: Small electives (< 20 students)
  if (course.type === CourseType.ELECTIVE && enrollmentCap <= 20) {
    return ROOMS.find(r => r.type === RoomType.PAVILION_VIII)!;
  }

  // Priority 5: Medium electives
  if (course.type === CourseType.ELECTIVE && enrollmentCap <= 48) {
    return ROOMS.find(r => r.type === RoomType.ROUSS)!;
  }

  // Priority 6: Large electives
  if (course.type === CourseType.ELECTIVE && enrollmentCap <= 60) {
    return ROOMS.find(r => r.type === RoomType.DELL)!;
  }

  // Default: UREG assigned (leave blank for registrar to assign)
  return ROOMS.find(r => r.type === RoomType.UREG_ASSIGNED)!;
}

/**
 * Get available rooms for a given time slot
 */
export function getAvailableRooms(
  timeSlotId: string,
  existingSections: any[],
  minCapacity: number = 0
): Room[] {
  const occupiedRoomIds = existingSections
    .filter(s => s.timeSlot.id === timeSlotId)
    .map(s => s.room.id);

  return ROOMS.filter(
    room => !occupiedRoomIds.includes(room.id) && room.capacity >= minCapacity
  );
}

/**
 * Suggest best room based on course characteristics and availability
 */
export function suggestBestRoom(
  course: Course,
  enrollmentCap: number,
  timeSlotId: string,
  existingSections: any[]
): Room | null {
  const availableRooms = getAvailableRooms(timeSlotId, existingSections, enrollmentCap);

  if (availableRooms.length === 0) return null;

  // Get the ideal room
  const idealRoom = assignRoom(course, enrollmentCap);

  // If ideal room is available, use it
  if (availableRooms.find(r => r.id === idealRoom.id)) {
    return idealRoom;
  }

  // Otherwise, find the closest capacity match
  const sortedByCapacity = availableRooms
    .filter(r => r.capacity >= enrollmentCap)
    .sort((a, b) => a.capacity - b.capacity);

  return sortedByCapacity[0] || null;
}
