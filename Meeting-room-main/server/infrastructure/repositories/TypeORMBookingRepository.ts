import { DataSource, Repository } from 'typeorm';
import { Booking } from '../../domain/entities/Booking.js';
import { IBookingRepository } from '../../domain/repositories/IBookingRepository.js';
import { BookingEntity } from '../database/entities/BookingEntity.js';

export class TypeORMBookingRepository implements IBookingRepository {
  private repo: Repository<Booking>;

  constructor(private dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(BookingEntity);
  }

  async findById(id: number): Promise<Booking | null> {
    return await this.repo.findOneBy({ id });
  }

  async findByRoomAndDate(roomId?: number, dateString?: string): Promise<Booking[]> {
    const qb = this.repo.createQueryBuilder('booking');

    qb.where('booking.status = :status', { status: 'confirmed' });

    if (roomId !== undefined && !isNaN(roomId)) {
      qb.andWhere('booking.roomId = :roomId', { roomId });
    }

    if (dateString) {
      const dayStart = `${dateString}T00:00:00.000Z`;
      const dayEnd = `${dateString}T23:59:59.999Z`;
      qb.andWhere(
        '(booking.start LIKE :datePrefix OR (booking.start >= :dayStart AND booking.start <= :dayEnd))',
        {
          datePrefix: `${dateString}%`,
          dayStart,
          dayEnd,
        }
      );
    }

    qb.orderBy('booking.start', 'ASC');
    return await qb.getMany();
  }

  async findByOrganizerAndDate(organizerEmail: string, dateString: string): Promise<Booking[]> {
    const qb = this.repo.createQueryBuilder('booking');

    qb.where('booking.organizerEmail = :organizerEmail', {
      organizerEmail: organizerEmail.toLowerCase(),
    })
      .andWhere('booking.status = :status', { status: 'confirmed' })
      .andWhere(
        '(booking.start LIKE :datePrefix OR (booking.start >= :dayStart AND booking.start <= :dayEnd))',
        {
          datePrefix: `${dateString}%`,
          dayStart: `${dateString}T00:00:00.000Z`,
          dayEnd: `${dateString}T23:59:59.999Z`,
        }
      );

    return await qb.getMany();
  }

  async findConfirmedOverlapping(roomId: number, startISO: string, endISO: string): Promise<Booking[]> {
    return await this.repo
      .createQueryBuilder('booking')
      .where('booking.roomId = :roomId', { roomId })
      .andWhere('booking.status = :status', { status: 'confirmed' })
      .andWhere('booking.start < :endISO', { endISO })
      .andWhere('booking.end > :startISO', { startISO })
      .orderBy('booking.start', 'ASC')
      .getMany();
  }

  async create(data: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> {
    const booking = this.repo.create({
      ...data,
      organizerEmail: data.organizerEmail.toLowerCase(),
      createdAt: new Date().toISOString(),
    });
    return await this.repo.save(booking);
  }

  async cancel(id: number): Promise<Booking> {
    const booking = await this.repo.findOneBy({ id });
    if (!booking) {
      throw new Error(`Booking with id ${id} not found.`);
    }
    booking.status = 'cancelled';
    return await this.repo.save(booking);
  }
}
