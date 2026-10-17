import { DataSource } from 'typeorm';
import { TypeORMRoomRepository } from '../infrastructure/repositories/TypeORMRoomRepository.js';
import { TypeORMBookingRepository } from '../infrastructure/repositories/TypeORMBookingRepository.js';
import { GetRoomsUseCase } from '../application/use-cases/GetRoomsUseCase.js';
import { CreateBookingUseCase } from '../application/use-cases/CreateBookingUseCase.js';
import { CancelBookingUseCase } from '../application/use-cases/CancelBookingUseCase.js';
import { GetAvailabilityUseCase } from '../application/use-cases/GetAvailabilityUseCase.js';
import { AppError } from '../domain/errors/DomainErrors.js';
import { TestResult } from './booking-rules.test.js';

export async function runApiIntegrationTests(dataSource: DataSource): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const roomRepo = new TypeORMRoomRepository(dataSource);
  const bookingRepo = new TypeORMBookingRepository(dataSource);

  const getRoomsUseCase = new GetRoomsUseCase(roomRepo);
  const createBookingUseCase = new CreateBookingUseCase(roomRepo, bookingRepo);
  const cancelBookingUseCase = new CancelBookingUseCase(bookingRepo);
  const getAvailabilityUseCase = new GetAvailabilityUseCase(roomRepo);

  async function test(name: string, fn: () => Promise<void>) {
    const start = performance.now();
    try {
      await fn();
      results.push({
        suite: 'API & Integration Tests',
        name,
        passed: true,
        durationMs: Math.round(performance.now() - start),
      });
    } catch (err: any) {
      results.push({
        suite: 'API & Integration Tests',
        name,
        passed: false,
        error: err.message || String(err),
        durationMs: Math.round(performance.now() - start),
      });
    }
  }

  await test('GET /api/rooms: retrieves initial seed of 5 rooms', async () => {
    const rooms = await getRoomsUseCase.execute();
    if (rooms.length !== 5) {
      throw new Error(`Expected 5 seeded rooms, found: ${rooms.length}`);
    }
    const names = rooms.map((r) => r.name);
    if (!names.includes('Atlas') || !names.includes('Delta') || !names.includes('Ember')) {
      throw new Error(`Missing expected room names: ${names.join(', ')}`);
    }
  });

  const testSlotStart = '2030-06-15T10:00:00.000Z';
  const testSlotEnd = '2030-06-15T11:00:00.000Z';
  let createdBookingId = 0;

  await test('POST /api/bookings: successfully creates confirmed booking (201)', async () => {
    const booking = await createBookingUseCase.execute({
      roomId: 1, // Atlas
      title: 'Quarterly Review',
      organizerEmail: 'architect@company.com',
      attendees: 4,
      start: testSlotStart,
      end: testSlotEnd,
    });

    if (!booking.id || booking.status !== 'confirmed') {
      throw new Error('Booking was not properly created as confirmed.');
    }
    createdBookingId = booking.id;
  });

  await test('POST /api/bookings: conflicting slot throws 409 BOOKING_CONFLICT with details', async () => {
    let thrown = false;
    try {
      await createBookingUseCase.execute({
        roomId: 1, // Atlas (same room)
        title: 'Conflicting Sync',
        organizerEmail: 'other@company.com',
        attendees: 2,
        start: '2030-06-15T10:30:00.000Z', // Overlaps 10:00-11:00
        end: '2030-06-15T11:30:00.000Z',
      });
    } catch (err: any) {
      thrown = true;
      if (
        !(err instanceof AppError) ||
        err.statusCode !== 409 ||
        err.code !== 'BOOKING_CONFLICT'
      ) {
        throw new Error(`Expected 409 BOOKING_CONFLICT, received: ${err.message}`);
      }
      if (!err.details?.conflictingBookingId) {
        throw new Error('Expected conflictingBookingId in error details.');
      }
    }
    if (!thrown) throw new Error('Expected conflicting booking to be rejected');
  });

  await test('DELETE /api/bookings/:id: successfully cancels future booking (200)', async () => {
    const cancelled = await cancelBookingUseCase.execute(createdBookingId);
    if (cancelled.status !== 'cancelled') {
      throw new Error('Booking status was not updated to cancelled.');
    }
  });

  await test('GET /api/availability: filters by capacity and orders by smallest sufficient capacity', async () => {
    const available = await getAvailabilityUseCase.execute({
      date: '2030-06-15',
      start: '14:00',
      end: '15:00',
      minCapacity: 5,
    });

    if (available.length === 0) {
      throw new Error('Expected available rooms for requested window');
    }

    // Verify all returned rooms have capacity >= 5
    for (const r of available) {
      if (r.capacity < 5) {
        throw new Error(`Room ${r.name} has capacity ${r.capacity} < 5`);
      }
    }

    // Verify sorted by capacity ascending (smallest sufficient capacity first)
    for (let i = 1; i < available.length; i++) {
      if (available[i].capacity < available[i - 1].capacity) {
        throw new Error('Available rooms are not sorted in ascending order of capacity');
      }
    }
  });

  return results;
}
