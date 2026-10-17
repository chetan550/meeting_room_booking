import { Booking } from '../entities/Booking.js';

export interface IBookingRepository {
  findById(id: number): Promise<Booking | null>;
  findByRoomAndDate(roomId?: number, dateString?: string): Promise<Booking[]>;
  findByOrganizerAndDate(organizerEmail: string, dateString: string): Promise<Booking[]>;
  findConfirmedOverlapping(roomId: number, startISO: string, endISO: string): Promise<Booking[]>;
  create(data: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking>;
  cancel(id: number): Promise<Booking>;
}
