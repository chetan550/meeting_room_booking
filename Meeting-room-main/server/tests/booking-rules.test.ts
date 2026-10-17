import { BookingRulesValidator } from '../domain/rules/BookingRulesValidator.js';
import { Room } from '../domain/entities/Room.js';
import { Booking } from '../domain/entities/Booking.js';
import { AppError } from '../domain/errors/DomainErrors.js';

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

export function runBookingRulesUnitTests(): TestResult[] {
  const results: TestResult[] = [];

  function test(name: string, fn: () => void) {
    const start = performance.now();
    try {
      fn();
      results.push({
        suite: 'Unit Tests: Business Rules (R1–R9)',
        name,
        passed: true,
        durationMs: Math.round(performance.now() - start),
      });
    } catch (err: any) {
      results.push({
        suite: 'Unit Tests: Business Rules (R1–R9)',
        name,
        passed: false,
        error: err.message || String(err),
        durationMs: Math.round(performance.now() - start),
      });
    }
  }

  const roomAtlas: Room = { id: 1, name: 'Atlas', capacity: 4, floor: 1, amenities: ['monitor'] };
  const roomBorealis: Room = { id: 2, name: 'Borealis', capacity: 8, floor: 1, amenities: ['projector', 'whiteboard'] };

  const existingAtlasBooking: Booking = {
    id: 100,
    roomId: 1,
    title: 'Design Review',
    organizerEmail: 'lead@example.com',
    attendees: 3,
    start: '2030-05-14T10:00:00.000Z',
    end: '2030-05-14T11:00:00.000Z',
    status: 'confirmed',
    createdAt: '2030-05-01T08:00:00.000Z',
  };

  // ==========================================
  // Section 4: All 8 Overlap Reference Cases
  // ==========================================

  // Case 1: 09:00 to 10:00 -> Allowed (Ends exactly when existing starts)
  test('Overlap Table Case 1: 09:00 to 10:00 is Allowed (ends when existing starts)', () => {
    const start = new Date('2030-05-14T09:00:00.000Z');
    const end = new Date('2030-05-14T10:00:00.000Z');
    BookingRulesValidator.validateNoOverlap(start, end, roomAtlas, [existingAtlasBooking]);
  });

  // Case 2: 11:00 to 12:00 -> Allowed (Starts exactly when existing ends)
  test('Overlap Table Case 2: 11:00 to 12:00 is Allowed (starts when existing ends)', () => {
    const start = new Date('2030-05-14T11:00:00.000Z');
    const end = new Date('2030-05-14T12:00:00.000Z');
    BookingRulesValidator.validateNoOverlap(start, end, roomAtlas, [existingAtlasBooking]);
  });

  // Case 3: 09:30 to 10:30 -> Rejected (Overlaps the start)
  test('Overlap Table Case 3: 09:30 to 10:30 is Rejected with 409 (overlaps start)', () => {
    const start = new Date('2030-05-14T09:30:00.000Z');
    const end = new Date('2030-05-14T10:30:00.000Z');
    let thrown = false;
    try {
      BookingRulesValidator.validateNoOverlap(start, end, roomAtlas, [existingAtlasBooking]);
    } catch (err: any) {
      thrown = true;
      if (!(err instanceof AppError) || err.statusCode !== 409 || err.code !== 'BOOKING_CONFLICT') {
        throw new Error(`Expected 409 BOOKING_CONFLICT, got: ${err.message}`);
      }
    }
    if (!thrown) throw new Error('Expected overlap rejection, but validation passed.');
  });

  // Case 4: 10:30 to 11:30 -> Rejected (Overlaps the end)
  test('Overlap Table Case 4: 10:30 to 11:30 is Rejected with 409 (overlaps end)', () => {
    const start = new Date('2030-05-14T10:30:00.000Z');
    const end = new Date('2030-05-14T11:30:00.000Z');
    let thrown = false;
    try {
      BookingRulesValidator.validateNoOverlap(start, end, roomAtlas, [existingAtlasBooking]);
    } catch (err: any) {
      thrown = true;
      if (!(err instanceof AppError) || err.statusCode !== 409 || err.code !== 'BOOKING_CONFLICT') {
        throw new Error(`Expected 409 BOOKING_CONFLICT, got: ${err.message}`);
      }
    }
    if (!thrown) throw new Error('Expected overlap rejection, but validation passed.');
  });

  // Case 5: 10:15 to 10:45 -> Rejected (Fully inside)
  test('Overlap Table Case 5: 10:15 to 10:45 is Rejected with 409 (fully inside)', () => {
    const start = new Date('2030-05-14T10:15:00.000Z');
    const end = new Date('2030-05-14T10:45:00.000Z');
    let thrown = false;
    try {
      BookingRulesValidator.validateNoOverlap(start, end, roomAtlas, [existingAtlasBooking]);
    } catch (err: any) {
      thrown = true;
      if (!(err instanceof AppError) || err.statusCode !== 409 || err.code !== 'BOOKING_CONFLICT') {
        throw new Error(`Expected 409 BOOKING_CONFLICT, got: ${err.message}`);
      }
    }
    if (!thrown) throw new Error('Expected overlap rejection, but validation passed.');
  });

  // Case 6: 09:00 to 12:00 -> Rejected (Fully contains)
  test('Overlap Table Case 6: 09:00 to 12:00 is Rejected with 409 (fully contains)', () => {
    const start = new Date('2030-05-14T09:00:00.000Z');
    const end = new Date('2030-05-14T12:00:00.000Z');
    let thrown = false;
    try {
      BookingRulesValidator.validateNoOverlap(start, end, roomAtlas, [existingAtlasBooking]);
    } catch (err: any) {
      thrown = true;
      if (!(err instanceof AppError) || err.statusCode !== 409 || err.code !== 'BOOKING_CONFLICT') {
        throw new Error(`Expected 409 BOOKING_CONFLICT, got: ${err.message}`);
      }
    }
    if (!thrown) throw new Error('Expected overlap rejection, but validation passed.');
  });

  // Case 7: 10:00 to 11:00 -> Rejected (Identical)
  test('Overlap Table Case 7: 10:00 to 11:00 is Rejected with 409 (identical slot)', () => {
    const start = new Date('2030-05-14T10:00:00.000Z');
    const end = new Date('2030-05-14T11:00:00.000Z');
    let thrown = false;
    try {
      BookingRulesValidator.validateNoOverlap(start, end, roomAtlas, [existingAtlasBooking]);
    } catch (err: any) {
      thrown = true;
      if (!(err instanceof AppError) || err.statusCode !== 409 || err.code !== 'BOOKING_CONFLICT') {
        throw new Error(`Expected 409 BOOKING_CONFLICT, got: ${err.message}`);
      }
    }
    if (!thrown) throw new Error('Expected overlap rejection, but validation passed.');
  });

  // Case 8: 10:00 to 11:00 in Borealis -> Allowed (Different room)
  test('Overlap Table Case 8: 10:00 to 11:00 in Borealis is Allowed (different room)', () => {
    const start = new Date('2030-05-14T10:00:00.000Z');
    const end = new Date('2030-05-14T11:00:00.000Z');
    BookingRulesValidator.validateNoOverlap(start, end, roomBorealis, [existingAtlasBooking]);
  });

  // Cancelled bookings do not block a slot
  test('Overlap Rule R7: Cancelled bookings in same room do not block a slot', () => {
    const cancelledBooking: Booking = {
      ...existingAtlasBooking,
      id: 101,
      status: 'cancelled',
    };
    const start = new Date('2030-05-14T10:00:00.000Z');
    const end = new Date('2030-05-14T11:00:00.000Z');
    BookingRulesValidator.validateNoOverlap(start, end, roomAtlas, [cancelledBooking]);
  });

  // ==========================================
  // Rules R1 to R6, R8, R9 Unit Tests
  // ==========================================

  // R1: end must be after start
  test('Rule R1: end before start throws 400 INVALID_TIME_RANGE', () => {
    let thrown = false;
    try {
      BookingRulesValidator.validateTimeRules(
        '2030-05-14T11:00:00.000Z',
        '2030-05-14T10:00:00.000Z'
      );
    } catch (err: any) {
      thrown = true;
      if (err.statusCode !== 400 || err.code !== 'INVALID_TIME_RANGE') {
        throw new Error(`Expected 400 INVALID_TIME_RANGE, got: ${err.message}`);
      }
    }
    if (!thrown) throw new Error('Should have rejected end <= start');
  });

  // R2: 15-minute boundary
  test('Rule R2: start at 10:07:00 throws 400 INVALID_TIME_BOUNDARY', () => {
    let thrown = false;
    try {
      BookingRulesValidator.validateTimeRules(
        '2030-05-14T10:07:00.000Z',
        '2030-05-14T10:30:00.000Z'
      );
    } catch (err: any) {
      thrown = true;
      if (err.statusCode !== 400 || err.code !== 'INVALID_TIME_BOUNDARY') {
        throw new Error(`Expected 400 INVALID_TIME_BOUNDARY, got: ${err.message}`);
      }
    }
    if (!thrown) throw new Error('Should have rejected non-15min boundary');
  });

  // R3: Min 15 mins, max 4 hours
  test('Rule R3: duration 5 hours throws 400 INVALID_DURATION', () => {
    let thrown = false;
    try {
      BookingRulesValidator.validateTimeRules(
        '2030-05-14T09:00:00.000Z',
        '2030-05-14T14:15:00.000Z' // 5 hours 15 mins
      );
    } catch (err: any) {
      thrown = true;
      if (err.statusCode !== 400 || err.code !== 'INVALID_DURATION') {
        throw new Error(`Expected 400 INVALID_DURATION, got: ${err.message}`);
      }
    }
    if (!thrown) throw new Error('Should have rejected > 4 hours');
  });

  // R4: Business hours 08:00 to 20:00 UTC and same UTC day
  test('Rule R4: Booking starting at 07:30 UTC throws 400 OUTSIDE_BUSINESS_HOURS', () => {
    let thrown = false;
    try {
      BookingRulesValidator.validateTimeRules(
        '2030-05-14T07:30:00.000Z',
        '2030-05-14T08:30:00.000Z'
      );
    } catch (err: any) {
      thrown = true;
      if (err.statusCode !== 400 || err.code !== 'OUTSIDE_BUSINESS_HOURS') {
        throw new Error(`Expected 400 OUTSIDE_BUSINESS_HOURS, got: ${err.message}`);
      }
    }
    if (!thrown) throw new Error('Should have rejected start before 08:00');
  });

  test('Rule R4: Booking ending at 20:15 UTC throws 400 OUTSIDE_BUSINESS_HOURS', () => {
    let thrown = false;
    try {
      BookingRulesValidator.validateTimeRules(
        '2030-05-14T19:00:00.000Z',
        '2030-05-14T20:15:00.000Z'
      );
    } catch (err: any) {
      thrown = true;
      if (err.statusCode !== 400 || err.code !== 'OUTSIDE_BUSINESS_HOURS') {
        throw new Error(`Expected 400 OUTSIDE_BUSINESS_HOURS, got: ${err.message}`);
      }
    }
    if (!thrown) throw new Error('Should have rejected end after 20:00');
  });

  // R5: Cannot start in past
  test('Rule R5: Booking in the past throws 400 BOOKING_IN_PAST', () => {
    let thrown = false;
    const pastStart = '2020-01-01T10:00:00.000Z';
    const pastEnd = '2020-01-01T11:00:00.000Z';
    try {
      BookingRulesValidator.validateTimeRules(pastStart, pastEnd, {
        checkPast: true,
        now: new Date('2026-01-01T00:00:00.000Z'),
      });
    } catch (err: any) {
      thrown = true;
      if (err.statusCode !== 400 || err.code !== 'BOOKING_IN_PAST') {
        throw new Error(`Expected 400 BOOKING_IN_PAST, got: ${err.message}`);
      }
    }
    if (!thrown) throw new Error('Should have rejected past booking');
  });

  // R6: Attendees cannot exceed room capacity
  test('Rule R6: 5 attendees in room Atlas (cap 4) throws 400 CAPACITY_EXCEEDED', () => {
    let thrown = false;
    try {
      BookingRulesValidator.validateCapacity(5, roomAtlas);
    } catch (err: any) {
      thrown = true;
      if (err.statusCode !== 400 || err.code !== 'CAPACITY_EXCEEDED') {
        throw new Error(`Expected 400 CAPACITY_EXCEEDED, got: ${err.message}`);
      }
    }
    if (!thrown) throw new Error('Should have rejected attendee count > capacity');
  });

  // R8: Cannot cancel already started booking; cancelled booking no-op
  test('Rule R8: Cancelling an already started booking throws 409 BOOKING_ALREADY_STARTED', () => {
    const startedBooking: Booking = {
      ...existingAtlasBooking,
      start: '2026-10-17T10:00:00.000Z',
      end: '2026-10-17T11:00:00.000Z',
    };
    const now = new Date('2026-10-17T10:15:00.000Z'); // during the meeting
    let thrown = false;
    try {
      BookingRulesValidator.validateCancellation(startedBooking, now);
    } catch (err: any) {
      thrown = true;
      if (err.statusCode !== 409 || err.code !== 'BOOKING_ALREADY_STARTED') {
        throw new Error(`Expected 409 BOOKING_ALREADY_STARTED, got: ${err.message}`);
      }
    }
    if (!thrown) throw new Error('Should have rejected cancelling started booking');
  });

  test('Rule R8: Cancelling an already cancelled booking returns shouldUpdate: false (no-op success)', () => {
    const cancelledBooking: Booking = {
      ...existingAtlasBooking,
      status: 'cancelled',
    };
    const result = BookingRulesValidator.validateCancellation(cancelledBooking, new Date('2026-10-17T08:00:00.000Z'));
    if (result.shouldUpdate !== false) {
      throw new Error('Expected shouldUpdate to be false for already cancelled booking');
    }
  });

  // R9: An organizer cannot hold more than 3 confirmed bookings that start on the same day
  test('Rule R9: 4th confirmed booking on same day throws 409 ORGANIZER_LIMIT_EXCEEDED', () => {
    const existingOrgBookings: Booking[] = [
      {
        ...existingAtlasBooking,
        id: 1,
        organizerEmail: 'sam@example.com',
        start: '2030-05-14T08:00:00.000Z',
        end: '2030-05-14T09:00:00.000Z',
      },
      {
        ...existingAtlasBooking,
        id: 2,
        organizerEmail: 'sam@example.com',
        start: '2030-05-14T09:15:00.000Z',
        end: '2030-05-14T10:00:00.000Z',
      },
      {
        ...existingAtlasBooking,
        id: 3,
        organizerEmail: 'sam@example.com',
        start: '2030-05-14T13:00:00.000Z',
        end: '2030-05-14T14:00:00.000Z',
      },
    ];

    let thrown = false;
    try {
      BookingRulesValidator.validateOrganizerDailyLimit(
        'sam@example.com',
        new Date('2030-05-14T15:00:00.000Z'),
        existingOrgBookings
      );
    } catch (err: any) {
      thrown = true;
      if (err.statusCode !== 409 || err.code !== 'ORGANIZER_LIMIT_EXCEEDED') {
        throw new Error(`Expected 409 ORGANIZER_LIMIT_EXCEEDED, got: ${err.message}`);
      }
    }
    if (!thrown) throw new Error('Should have rejected 4th booking on same day');
  });

  return results;
}
