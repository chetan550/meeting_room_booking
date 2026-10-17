import { EntitySchema } from 'typeorm';
import { Room } from '../../../domain/entities/Room.js';

export const RoomEntity = new EntitySchema<Room>({
  name: 'Room',
  tableName: 'rooms',
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    name: {
      type: String,
      length: 100,
      unique: true,
    },
    capacity: {
      type: Number,
    },
    floor: {
      type: Number,
    },
    amenities: {
      type: 'simple-json',
    },
  },
});
