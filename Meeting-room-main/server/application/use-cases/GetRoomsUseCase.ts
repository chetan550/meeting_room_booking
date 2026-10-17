import { IRoomRepository } from '../../domain/repositories/IRoomRepository.js';
import { Room } from '../../domain/entities/Room.js';

export class GetRoomsUseCase {
  constructor(private roomRepository: IRoomRepository) {}

  async execute(): Promise<Room[]> {
    return await this.roomRepository.findAll();
  }
}
