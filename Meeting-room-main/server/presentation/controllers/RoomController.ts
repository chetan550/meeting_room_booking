import { Request, Response, NextFunction } from 'express';
import { GetRoomsUseCase } from '../../application/use-cases/GetRoomsUseCase.js';

export class RoomController {
  constructor(private getRoomsUseCase: GetRoomsUseCase) {}

  getRooms = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rooms = await this.getRoomsUseCase.execute();
      res.status(200).json(rooms);
    } catch (err) {
      next(err);
    }
  };
}
