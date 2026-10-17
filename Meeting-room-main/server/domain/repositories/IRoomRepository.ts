import { Room } from '../entities/Room.js';

export interface IRoomRepository {
  findAll(): Promise<Room[]>;
  findById(id: number): Promise<Room | null>;
  findAvailable(
    startISO: string,
    endISO: string,
    minCapacity?: number
  ): Promise<Room[]>;
}
