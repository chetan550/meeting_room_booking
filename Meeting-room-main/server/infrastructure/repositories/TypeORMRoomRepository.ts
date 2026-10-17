import { DataSource, Repository } from 'typeorm';
import { Room } from '../../domain/entities/Room.js';
import { IRoomRepository } from '../../domain/repositories/IRoomRepository.js';
import { RoomEntity } from '../database/entities/RoomEntity.js';
import { BookingEntity } from '../database/entities/BookingEntity.js';

export class TypeORMRoomRepository implements IRoomRepository {
  private roomRepo: Repository<Room>;
  private bookingRepo: Repository<any>;

  constructor(private dataSource: DataSource) {
    this.roomRepo = this.dataSource.getRepository(RoomEntity);
    this.bookingRepo = this.dataSource.getRepository(BookingEntity);
  }

  async findAll(): Promise<Room[]> {
    return await this.roomRepo.find({
      order: {
        floor: 'ASC',
        name: 'ASC',
      },
    });
  }

  async findById(id: number): Promise<Room | null> {
    return await this.roomRepo.findOneBy({ id });
  }

  async findAvailable(
    startISO: string,
    endISO: string,
    minCapacity: number = 1
  ): Promise<Room[]> {
    const allRooms = await this.roomRepo.find({
      order: {
        capacity: 'ASC',
        name: 'ASC',
      },
    });

    const capacityEligibleRooms = allRooms.filter(
      (room) => room.capacity >= minCapacity
    );

    if (capacityEligibleRooms.length === 0) {
      return [];
    }

    const conflictingBookings = await this.bookingRepo
      .createQueryBuilder('booking')
      .where('booking.status = :status', { status: 'confirmed' })
      .andWhere('booking.start < :endISO', { endISO })
      .andWhere('booking.end > :startISO', { startISO })
      .getMany();

    const bookedRoomIds = new Set(conflictingBookings.map((b) => b.roomId));

    return capacityEligibleRooms.filter((room) => !bookedRoomIds.has(room.id));
  }
}
