import { IRoomRepository } from '../../domain/repositories/IRoomRepository.js';
import { Room } from '../../domain/entities/Room.js';
import { AppError } from '../../domain/errors/DomainErrors.js';
import { BookingRulesValidator } from '../../domain/rules/BookingRulesValidator.js';

export interface AvailabilityQuery {
  date?: string;
  start?: string;
  end?: string;
  minCapacity?: string | number;
}

export class GetAvailabilityUseCase {
  constructor(private roomRepository: IRoomRepository) {}

  async execute(query: AvailabilityQuery): Promise<Room[]> {
    const { date, start, end, minCapacity } = query;

    if (!date || !start || !end) {
      throw new AppError(
        400,
        'INVALID_INPUT',
        'date (YYYY-MM-DD), start (HH:mm), and end (HH:mm) are required query parameters.'
      );
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new AppError(400, 'INVALID_INPUT', 'date must be in YYYY-MM-DD format.');
    }

    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!timeRegex.test(start) || !timeRegex.test(end)) {
      throw new AppError(
        400,
        'INVALID_INPUT',
        'start and end must be formatted as HH:mm in 24-hour time.'
      );
    }

    const startISO = `${date}T${start}:00.000Z`;
    const endISO = `${date}T${end}:00.000Z`;

    BookingRulesValidator.validateTimeRules(startISO, endISO, { checkPast: false });

    let parsedMinCapacity = 1;
    if (minCapacity !== undefined && minCapacity !== '') {
      parsedMinCapacity = Number(minCapacity);
      if (isNaN(parsedMinCapacity) || parsedMinCapacity < 1) {
        throw new AppError(400, 'INVALID_INPUT', 'minCapacity must be a positive integer.');
      }
    }

    return await this.roomRepository.findAvailable(startISO, endISO, parsedMinCapacity);
  }
}
