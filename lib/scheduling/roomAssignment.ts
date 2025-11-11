import { Room, RoomType, ROOM_CAPACITIES, Course, CourseType, TimeSlot } from '@/types/scheduling';
import { isBlockBusting } from '@/lib/utils/blockBusting';

// Pre-defined rooms based on requirements
export const ROOMS: Room[] = [
  // Standard Batten School rooms
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
  // Block-busting rooms (for classes outside standard university scheduling blocks)
  {
    id: 'rouss-403',
    name: 'Rouss 403',
    type: RoomType.ROUSS_403,
    capacity: ROOM_CAPACITIES[RoomType.ROUSS_403],
  },
  {
    id: 'monroe-120',
    name: 'Monroe 120',
    type: RoomType.MONROE_120,
    capacity: ROOM_CAPACITIES[RoomType.MONROE_120],
  },
  {
    id: 'pavilion-viii-blockbust',
    name: 'Pavilion VIII (Block-Bust)',
    type: RoomType.PAVILION_VIII_BLOCKBUST,
    capacity: ROOM_CAPACITIES[RoomType.PAVILION_VIII_BLOCKBUST],
  },
  // UREG assigned rooms (registrar assigns later)
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

/**
 * Assign room considering block-busting constraints
 *
 * Block-busting classes (outside standard university scheduling blocks) MUST use:
 * - Rouss 403 (48 capacity)
 * - Monroe 120 (60 capacity)
 * - Pavilion VIII Block-Bust (18 capacity)
 *
 * @param course The course to assign
 * @param enrollmentCap The enrollment capacity
 * @param timeSlot The time slot (optional, needed for block-busting detection)
 * @returns The assigned room
 */
export function assignRoomWithBlockBusting(
  course: Course,
  enrollmentCap: number,
  timeSlot?: TimeSlot
): Room {
  // Check if this is a block-busting course
  const isBlockBustingCourse = timeSlot ? isBlockBusting(timeSlot, course.duration) : false;

  if (isBlockBustingCourse) {
    // MUST use block-busting rooms
    // Priority: smallest room that fits
    const blockBustingRooms = ROOMS.filter(r =>
      r.type === RoomType.ROUSS_403 ||
      r.type === RoomType.MONROE_120 ||
      r.type === RoomType.PAVILION_VIII_BLOCKBUST
    );

    const suitableRooms = blockBustingRooms
      .filter(r => r.capacity >= enrollmentCap)
      .sort((a, b) => a.capacity - b.capacity);

    if (suitableRooms.length > 0) {
      return suitableRooms[0];
    }

    // If no suitable block-busting room, use the largest one
    // (This will create a capacity conflict that should be flagged)
    return blockBustingRooms.sort((a, b) => b.capacity - a.capacity)[0];
  }

  // Not block-busting - use standard room assignment logic
  return assignRoom(course, enrollmentCap);
}

/**
 * Check if a room is valid for the given time slot and course
 *
 * @param room The room to check
 * @param course The course
 * @param timeSlot The time slot
 * @returns true if the room is valid, false if it violates block-busting rules
 */
export function isRoomValidForBlockBusting(
  room: Room,
  course: Course,
  timeSlot: TimeSlot
): boolean {
  const isBlockBustingCourse = isBlockBusting(timeSlot, course.duration);
  const isBlockBustingRoomType =
    room.type === RoomType.ROUSS_403 ||
    room.type === RoomType.MONROE_120 ||
    room.type === RoomType.PAVILION_VIII_BLOCKBUST;

  // If course is block-busting, MUST use block-busting room
  if (isBlockBustingCourse && !isBlockBustingRoomType) {
    return false;
  }

  // If course is NOT block-busting, should NOT use block-busting room
  // (Reserve them for actual block-busting courses)
  if (!isBlockBustingCourse && isBlockBustingRoomType) {
    return false;
  }

  return true;
}
