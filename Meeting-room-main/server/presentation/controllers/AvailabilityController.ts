import { Request, Response, NextFunction } from 'express';
import { GetAvailabilityUseCase } from '../../application/use-cases/GetAvailabilityUseCase.js';

export class AvailabilityController {
  constructor(private getAvailabilityUseCase: GetAvailabilityUseCase) {}

  getAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = {
        date: req.query.date ? String(req.query.date) : undefined,
        start: req.query.start ? String(req.query.start) : undefined,
        end: req.query.end ? String(req.query.end) : undefined,
        minCapacity: req.query.minCapacity ? String(req.query.minCapacity) : undefined,
      };

      const rooms = await this.getAvailabilityUseCase.execute(query);
      res.status(200).json(rooms);
    } catch (err) {
      next(err);
    }
  };
}
