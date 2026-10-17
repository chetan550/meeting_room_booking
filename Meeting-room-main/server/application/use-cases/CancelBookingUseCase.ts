import { IBookingRepository } from '../../domain/repositories/IBookingRepository.js';
import { Booking } from '../../domain/entities/Booking.js';
import { AppError } from '../../domain/errors/DomainErrors.js';
import { BookingRulesValidator } from '../../domain/rules/BookingRulesValidator.js';

export class CancelBookingUseCase {
  constructor(private bookingRepository: IBookingRepository) {}

  async execute(bookingId: number, now: Date = new Date()): Promise<Booking> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new AppError(404, 'BOOKING_NOT_FOUND', `Booking with id ${bookingId} not found.`);
    }

    const { shouldUpdate } = BookingRulesValidator.validateCancellation(booking, now);

    if (shouldUpdate) {
      return await this.bookingRepository.cancel(bookingId);
    }

    return booking;
  }
}
