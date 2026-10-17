import { EntitySchema } from 'typeorm';
import { Booking } from '../../../domain/entities/Booking.js';

export const BookingEntity = new EntitySchema<Booking>({
  name: 'Booking',
  tableName: 'bookings',
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    roomId: {
      type: Number,
    },
    title: {
      type: String,
      length: 100,
    },
    organizerEmail: {
      type: String,
      length: 255,
    },
    attendees: {
      type: Number,
    },
    start: {
      type: String,
      length: 35,
    },
    end: {
      type: String,
      length: 35,
    },
    status: {
      type: String,
      length: 20,
      default: 'confirmed',
    },
    createdAt: {
      type: String,
      length: 35,
    },
  },
  indices: [
    {
      name: 'IDX_BOOKING_ROOM_STATUS_START',
      columns: ['roomId', 'status', 'start'],
    },
    {
      name: 'IDX_BOOKING_ORGANIZER_DATE',
      columns: ['organizerEmail', 'status', 'start'],
    },
  ],
});
