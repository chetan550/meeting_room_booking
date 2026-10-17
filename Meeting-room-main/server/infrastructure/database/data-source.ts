import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import path from 'path';
import { RoomEntity } from './entities/RoomEntity.js';
import { BookingEntity } from './entities/BookingEntity.js';
import { InitialMigration1700000000000 } from './migrations/1700000000000-InitialMigration.js';

const isMySQL = process.env.DB_TYPE === 'mysql';

export const AppDataSource = new DataSource(
  isMySQL
    ? {
        type: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'meeting_room_db',
        entities: [RoomEntity, BookingEntity],
        migrations: [InitialMigration1700000000000],
        synchronize: true,
        logging: false,
      }
    : {
        type: 'sqljs',
        location: path.resolve(process.cwd(), 'database.sqlite'),
        autoSave: true,
        entities: [RoomEntity, BookingEntity],
        synchronize: true,
        logging: false,
      }
);

let isInitialized = false;

export async function getDataSource(): Promise<DataSource> {
  if (!isInitialized) {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    isInitialized = true;
  }
  return AppDataSource;
}
