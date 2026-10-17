import { DataSource } from 'typeorm';
import { TypeORMRoomRepository } from '../infrastructure/repositories/TypeORMRoomRepository.js';
import { TypeORMBookingRepository } from '../infrastructure/repositories/TypeORMBookingRepository.js';
import { CreateBookingUseCase } from '../application/use-cases/CreateBookingUseCase.js';
import { AppError } from '../domain/errors/DomainErrors.js';
import { TestResult } from './booking-rules.test.js';

export async function runConcurrencyTests(dataSource: DataSource): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const roomRepo = new TypeORMRoomRepository(dataSource);
  const bookingRepo = new TypeORMBookingRepository(dataSource);
  const createBookingUseCase = new CreateBookingUseCase(roomRepo, bookingRepo);

  const startMs = performance.now();
  const testName = 'Concurrency Race: 2 simultaneous conflicting bookings for same room';

  try {
    // Generate a unique future date with random day offset to ensure complete idempotency
    const randomDays = Math.floor(Math.random() * 5000) + 100;
    const futureDate = new Date(Date.now() + randomDays * 24 * 60 * 60 * 1000);
    futureDate.setUTCHours(14, 0, 0, 0);

    const startISO = futureDate.toISOString();
    const endDate = new Date(futureDate.getTime() + 60 * 60 * 1000); // 1 hour later
    const endISO = endDate.toISOString();

    const requestA = {
      roomId: 1, // Room Atlas
      title: 'Sprint Planning Concurrent A',
      organizerEmail: `alice_${Date.now()}@example.com`,
      attendees: 3,
      start: startISO,
      end: endISO,
    };

    const requestB = {
      roomId: 1, // Room Atlas (same room and same time window)
      title: 'Sprint Planning Concurrent B',
      organizerEmail: `bob_${Date.now()}@example.com`,
      attendees: 4,
      start: startISO,
      end: endISO,
    };

    // Fire both requests concurrently in parallel
    const [resultA, resultB] = await Promise.allSettled([
      createBookingUseCase.execute(requestA),
      createBookingUseCase.execute(requestB),
    ]);

    const successes = [resultA, resultB].filter((r) => r.status === 'fulfilled');
    const failures = [resultA, resultB].filter((r) => r.status === 'rejected');

    // Clean up successful booking if any so tests remain idempotent
    if (successes.length > 0) {
      const created = (successes[0] as PromiseFulfilledResult<any>).value;
      if (created?.id) {
        await bookingRepo.cancel(created.id);
      }
    }

    if (successes.length !== 1 || failures.length !== 1) {
      throw new Error(
        `Race condition failure! Expected exactly 1 success and 1 failure, but got ${successes.length} successes and ${failures.length} failures.`
      );
    }

    const failedReason = (failures[0] as PromiseRejectedResult).reason;
    if (
      !(failedReason instanceof AppError) ||
      failedReason.statusCode !== 409 ||
      failedReason.code !== 'BOOKING_CONFLICT'
    ) {
      throw new Error(
        `Expected rejected request to fail with 409 BOOKING_CONFLICT, but failed with: ${failedReason?.message}`
      );
    }

    results.push({
      suite: 'Concurrency Tests (Section 5.4 & 7)',
      name: `${testName} -> Exactly 1 succeeded (201) and 1 rejected (409 Conflict)`,
      passed: true,
      durationMs: Math.round(performance.now() - startMs),
    });
  } catch (err: any) {
    results.push({
      suite: 'Concurrency Tests (Section 5.4 & 7)',
      name: testName,
      passed: false,
      error: err.message || String(err),
      durationMs: Math.round(performance.now() - startMs),
    });
  }

  return results;
}
