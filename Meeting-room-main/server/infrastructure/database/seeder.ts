import { DataSource } from 'typeorm';
import { RoomEntity } from './entities/RoomEntity.js';

export const INITIAL_ROOMS = [
  {
    name: 'Atlas',
    capacity: 4,
    floor: 1,
    amenities: ['monitor'],
  },
  {
    name: 'Borealis',
    capacity: 8,
    floor: 1,
    amenities: ['projector', 'whiteboard'],
  },
  {
    name: 'Cascade',
    capacity: 12,
    floor: 2,
    amenities: ['projector', 'video-conferencing'],
  },
  {
    name: 'Delta',
    capacity: 20,
    floor: 3,
    amenities: ['projector', 'video-conferencing', 'whiteboard'],
  },
  {
    name: 'Ember',
    capacity: 2,
    floor: 2,
    amenities: [],
  },
];

export async function seedDatabase(dataSource: DataSource): Promise<void> {
  const roomRepo = dataSource.getRepository(RoomEntity);
  const count = await roomRepo.count();

  if (count === 0) {
    for (const roomData of INITIAL_ROOMS) {
      const room = roomRepo.create(roomData);
      await roomRepo.save(room);
    }
  }
}
