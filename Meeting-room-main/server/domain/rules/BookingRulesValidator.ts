import { AppError } from '../errors/DomainErrors.js';
import { Booking } from '../entities/Booking.js';
import { Room } from '../entities/Room.js';

export class BookingRulesValidator {
  static formatUTCTime(date: Date): string {
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes} UTC`;
  }

  static validateInputFields(dto: {
    roomId: unknown;
    title: unknown;
    organizerEmail: unknown;
    attendees: unknown;
    start: unknown;
    end: unknown;
  }): {
    roomId: number;
    title: string;
    organizerEmail: string;
    attendees: number;
    start: string;
    end: string;
  } {
    if (typeof dto.roomId !== 'number' || isNaN(dto.roomId)) {
      throw new AppError(400, 'INVALID_INPUT', 'roomId must be a valid number.');
    }

    if (typeof dto.title !== 'string') {
      throw new AppError(400, 'INVALID_INPUT', 'title must be a string.');
    }
    const trimmedTitle = dto.title.trim();
    if (trimmedTitle.length < 1 || trimmedTitle.length > 100) {
      throw new AppError(400, 'INVALID_INPUT', 'title must be between 1 and 100 characters after trimming.');
    }

    if (typeof dto.organizerEmail !== 'string') {
      throw new AppError(400, 'INVALID_INPUT', 'organizerEmail must be a string.');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(dto.organizerEmail.trim())) {
      throw new AppError(400, 'INVALID_INPUT', 'organizerEmail must be a valid email address.');
    }

    if (typeof dto.attendees !== 'number' || !Number.isInteger(dto.attendees) || dto.attendees < 1) {
      throw new AppError(400, 'INVALID_INPUT', 'attendees must be an integer of at least 1.');
    }

    if (typeof dto.start !== 'string' || typeof dto.end !== 'string') {
      throw new AppError(400, 'INVALID_INPUT', 'start and end must be valid ISO 8601 UTC timestamp strings.');
    }

    return {
      roomId: dto.roomId,
      title: trimmedTitle,
      organizerEmail: dto.organizerEmail.trim().toLowerCase(),
      attendees: dto.attendees,
      start: dto.start,
      end: dto.end,
    };
  }

  static validateTimeRules(
    startISO: string,
    endISO: string,
    options?: { checkPast?: boolean; now?: Date }
  ): { startDate: Date; endDate: Date } {
    const startDate = new Date(startISO);
    const endDate = new Date(endISO);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new AppError(400, 'INVALID_INPUT', 'start and end must be valid ISO 8601 UTC timestamps.');
    }

    const startMs = startDate.getTime();
    const endMs = endDate.getTime();

    if (endMs <= startMs) {
      throw new AppError(400, 'INVALID_TIME_RANGE', 'end must be strictly after start.');
    }

    const is15MinBoundary = (d: Date) =>
      d.getUTCMinutes() % 15 === 0 &&
      d.getUTCSeconds() === 0 &&
      d.getUTCMilliseconds() === 0;

    if (!is15MinBoundary(startDate) || !is15MinBoundary(endDate)) {
      throw new AppError(
        400,
        'INVALID_TIME_BOUNDARY',
        'start and end must fall on 15-minute boundaries (minutes 00, 15, 30, or 45, with zero seconds).'
      );
    }

    const durationMinutes = (endMs - startMs) / (60 * 1000);
    if (durationMinutes < 15 || durationMinutes > 240) {
      throw new AppError(
        400,
        'INVALID_DURATION',
        `A booking must last at least 15 minutes and at most 4 hours (duration was ${durationMinutes} minutes).`
      );
    }

    const isSameUTCDay =
      startDate.getUTCFullYear() === endDate.getUTCFullYear() &&
      startDate.getUTCMonth() === endDate.getUTCMonth() &&
      startDate.getUTCDate() === endDate.getUTCDate();

    if (!isSameUTCDay) {
      throw new AppError(
        400,
        'OUTSIDE_BUSINESS_HOURS',
        'Booking must start and end on the same UTC day.'
      );
    }

    const startHour = startDate.getUTCHours();
    const endHour = endDate.getUTCHours();
    const endMinutes = endDate.getUTCMinutes();

    if (startHour < 8) {
      throw new AppError(
        400,
        'OUTSIDE_BUSINESS_HOURS',
        'Booking cannot start before business hours (08:00 UTC).'
      );
    }

    if (endHour > 20 || (endHour === 20 && endMinutes > 0)) {
      throw new AppError(
        400,
        'OUTSIDE_BUSINESS_HOURS',
        'Booking cannot end after business hours (20:00 UTC).'
      );
    }

    const checkPast = options?.checkPast ?? true;
    if (checkPast) {
      const now = options?.now ?? new Date();
      if (startMs < now.getTime()) {
        throw new AppError(400, 'BOOKING_IN_PAST', 'A booking cannot start in the past.');
      }
    }

    return { startDate, endDate };
  }

  static validateCapacity(attendees: number, room: Room): void {
    if (attendees > room.capacity) {
      throw new AppError(
        400,
        'CAPACITY_EXCEEDED',
        `Attendees (${attendees}) cannot exceed room capacity (${room.capacity}) for ${room.name}.`,
        { attendees, roomCapacity: room.capacity, roomName: room.name }
      );
    }
  }

  static intervalsOverlap(
    startA: Date | number,
    endA: Date | number,
    startB: Date | number,
    endB: Date | number
  ): boolean {
    const sA = startA instanceof Date ? startA.getTime() : startA;
    const eA = endA instanceof Date ? endA.getTime() : endA;
    const sB = startB instanceof Date ? startB.getTime() : startB;
    const eB = endB instanceof Date ? endB.getTime() : endB;

    return sA < eB && sB < eA;
  }

  static validateNoOverlap(
    candidateStart: Date,
    candidateEnd: Date,
    room: Room,
    existingBookings: Booking[]
  ): void {
    const candidateStartMs = candidateStart.getTime();
    const candidateEndMs = candidateEnd.getTime();

    for (const booking of existingBookings) {
      if (booking.status !== 'confirmed') {
        continue;
      }

      if (booking.roomId !== room.id) {
        continue;
      }

      const existingStartMs = new Date(booking.start).getTime();
      const existingEndMs = new Date(booking.end).getTime();

      if (this.intervalsOverlap(candidateStartMs, candidateEndMs, existingStartMs, existingEndMs)) {
        const startStr = this.formatUTCTime(new Date(existingStartMs));
        const endStr = this.formatUTCTime(new Date(existingEndMs));

        throw new AppError(
          409,
          'BOOKING_CONFLICT',
          `Room ${room.name} is already booked from ${startStr} to ${endStr}.`,
          { conflictingBookingId: booking.id }
        );
      }
    }
  }

  static validateOrganizerDailyLimit(
    organizerEmail: string,
    candidateStart: Date,
    existingBookingsForOrganizer: Booking[]
  ): void {
    const year = candidateStart.getUTCFullYear();
    const month = candidateStart.getUTCMonth();
    const date = candidateStart.getUTCDate();

    const confirmedSameDayBookings = existingBookingsForOrganizer.filter((b) => {
      if (b.status !== 'confirmed') return false;
      const bStart = new Date(b.start);
      return (
        bStart.getUTCFullYear() === year &&
        bStart.getUTCMonth() === month &&
        bStart.getUTCDate() === date
      );
    });

    if (confirmedSameDayBookings.length >= 3) {
      throw new AppError(
        409,
        'ORGANIZER_LIMIT_EXCEEDED',
        `An organizer cannot hold more than 3 confirmed bookings that start on the same day.`,
        {
          organizerEmail,
          date: `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`,
          activeCount: confirmedSameDayBookings.length,
        }
      );
    }
  }

  static validateCancellation(
    booking: Booking,
    now: Date = new Date()
  ): { shouldUpdate: boolean } {
    if (booking.status === 'cancelled') {
      return { shouldUpdate: false };
    }

    const startMs = new Date(booking.start).getTime();
    if (now.getTime() >= startMs) {
      throw new AppError(
        409,
        'BOOKING_ALREADY_STARTED',
        'A booking that has already started cannot be cancelled.'
      );
    }

    return { shouldUpdate: true };
  }
}
