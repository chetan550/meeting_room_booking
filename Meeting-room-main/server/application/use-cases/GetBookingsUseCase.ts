import { IBookingRepository } from '../../domain/repositories/IBookingRepository.js';
import { Booking } from '../../domain/entities/Booking.js';
import { AppError } from '../../domain/errors/DomainErrors.js';

export class GetBookingsUseCase {
  constructor(private bookingRepository: IBookingRepository) {}

  async execute(roomId?: number, dateString?: string): Promise<Booking[]> {
    if (dateString) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateString)) {
        throw new AppError(400, 'INVALID_INPUT', 'date must be in YYYY-MM-DD format.');
      }
    }

    return await this.bookingRepository.findByRoomAndDate(roomId, dateString);
  }
}
