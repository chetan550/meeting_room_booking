import { IRoomRepository } from '../../domain/repositories/IRoomRepository.js';
import { IBookingRepository } from '../../domain/repositories/IBookingRepository.js';
import { Booking } from '../../domain/entities/Booking.js';
import { BookingRulesValidator } from '../../domain/rules/BookingRulesValidator.js';
import { AppError } from '../../domain/errors/DomainErrors.js';
import { RoomMutexPool } from '../../infrastructure/concurrency/RoomMutexPool.js';

export interface CreateBookingInput {
  roomId: unknown;
  title: unknown;
  organizerEmail: unknown;
  attendees: unknown;
  start: unknown;
  end: unknown;
}

export class CreateBookingUseCase {
  private mutexPool = RoomMutexPool.getInstance();

  constructor(
    private roomRepository: IRoomRepository,
    private bookingRepository: IBookingRepository
  ) {}

  async execute(input: CreateBookingInput, now: Date = new Date()): Promise<Booking> {
    const sanitized = BookingRulesValidator.validateInputFields(input);

    const { startDate, endDate } = BookingRulesValidator.validateTimeRules(
      sanitized.start,
      sanitized.end,
      { checkPast: true, now }
    );

    const room = await this.roomRepository.findById(sanitized.roomId);
    if (!room) {
      throw new AppError(404, 'ROOM_NOT_FOUND', `Room with id ${sanitized.roomId} does not exist.`);
    }

    BookingRulesValidator.validateCapacity(sanitized.attendees, room);

    return await this.mutexPool.runWithLock(sanitized.roomId, async () => {
      const overlappingBookings = await this.bookingRepository.findConfirmedOverlapping(
        sanitized.roomId,
        sanitized.start,
        sanitized.end
      );

      BookingRulesValidator.validateNoOverlap(
        startDate,
        endDate,
        room,
        overlappingBookings
      );

      const dayDateString = sanitized.start.substring(0, 10);
      const organizerBookings = await this.bookingRepository.findByOrganizerAndDate(
        sanitized.organizerEmail,
        dayDateString
      );

      BookingRulesValidator.validateOrganizerDailyLimit(
        sanitized.organizerEmail,
        startDate,
        organizerBookings
      );

      return await this.bookingRepository.create({
        roomId: sanitized.roomId,
        title: sanitized.title,
        organizerEmail: sanitized.organizerEmail,
        attendees: sanitized.attendees,
        start: sanitized.start,
        end: sanitized.end,
        status: 'confirmed',
      });
    });
  }
}
