import { Request, Response, NextFunction } from 'express';
import { GetBookingsUseCase } from '../../application/use-cases/GetBookingsUseCase.js';
import { CreateBookingUseCase } from '../../application/use-cases/CreateBookingUseCase.js';
import { CancelBookingUseCase } from '../../application/use-cases/CancelBookingUseCase.js';

export class BookingController {
  constructor(
    private getBookingsUseCase: GetBookingsUseCase,
    private createBookingUseCase: CreateBookingUseCase,
    private cancelBookingUseCase: CancelBookingUseCase
  ) {}

  getBookings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roomId = req.query.roomId ? Number(req.query.roomId) : undefined;
      const date = req.query.date ? String(req.query.date) : undefined;
      const bookings = await this.getBookingsUseCase.execute(roomId, date);
      res.status(200).json(bookings);
    } catch (err) {
      next(err);
    }
  };

  createBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const newBooking = await this.createBookingUseCase.execute(req.body);
      res.status(201).json(newBooking);
    } catch (err) {
      next(err);
    }
  };

  cancelBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const updatedBooking = await this.cancelBookingUseCase.execute(id);
      res.status(200).json(updatedBooking);
    } catch (err) {
      next(err);
    }
  };
}
