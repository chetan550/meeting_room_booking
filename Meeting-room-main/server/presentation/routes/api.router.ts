import { Router, Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { TypeORMRoomRepository } from '../../infrastructure/repositories/TypeORMRoomRepository.js';
import { TypeORMBookingRepository } from '../../infrastructure/repositories/TypeORMBookingRepository.js';
import { GetRoomsUseCase } from '../../application/use-cases/GetRoomsUseCase.js';
import { GetBookingsUseCase } from '../../application/use-cases/GetBookingsUseCase.js';
import { CreateBookingUseCase } from '../../application/use-cases/CreateBookingUseCase.js';
import { CancelBookingUseCase } from '../../application/use-cases/CancelBookingUseCase.js';
import { GetAvailabilityUseCase } from '../../application/use-cases/GetAvailabilityUseCase.js';
import { RoomController } from '../controllers/RoomController.js';
import { BookingController } from '../controllers/BookingController.js';
import { AvailabilityController } from '../controllers/AvailabilityController.js';
import { AppError } from '../../domain/errors/DomainErrors.js';
import { runAllTests } from '../../tests/run-all-tests.js';

export function createApiRouter(dataSource: DataSource): Router {
  const router = Router();

  const roomRepository = new TypeORMRoomRepository(dataSource);
  const bookingRepository = new TypeORMBookingRepository(dataSource);

  const getRoomsUseCase = new GetRoomsUseCase(roomRepository);
  const getBookingsUseCase = new GetBookingsUseCase(bookingRepository);
  const createBookingUseCase = new CreateBookingUseCase(roomRepository, bookingRepository);
  const cancelBookingUseCase = new CancelBookingUseCase(bookingRepository);
  const getAvailabilityUseCase = new GetAvailabilityUseCase(roomRepository);

  const roomController = new RoomController(getRoomsUseCase);
  const bookingController = new BookingController(
    getBookingsUseCase,
    createBookingUseCase,
    cancelBookingUseCase
  );
  const availabilityController = new AvailabilityController(getAvailabilityUseCase);

  router.get('/rooms', roomController.getRooms);
  router.get('/bookings', bookingController.getBookings);
  router.post('/bookings', bookingController.createBooking);
  router.delete('/bookings/:id', bookingController.cancelBooking);
  router.get('/availability', availabilityController.getAvailability);

  router.get('/tests/run', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const results = await runAllTests();
      res.status(200).json(results);
    } catch (err) {
      next(err);
    }
  });

  router.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json(err.toResponseJSON());
      return;
    }

    console.error('Unhandled API Error:', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected internal error occurred.',
      },
    });
  });

  return router;
}
