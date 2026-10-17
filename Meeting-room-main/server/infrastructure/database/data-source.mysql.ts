import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { RoomEntity } from './entities/RoomEntity.js';
import { BookingEntity } from './entities/BookingEntity.js';
import { InitialMigration1700000000000 } from './migrations/1700000000000-InitialMigration.js';

export const MySQLDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'meeting_room_db',
  entities: [RoomEntity, BookingEntity],
  migrations: [InitialMigration1700000000000],
  synchronize: false,
  logging: true,
});
