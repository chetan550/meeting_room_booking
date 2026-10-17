import { Room, Booking, ApiErrorResponse, TestSummary } from '../types';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorData: ApiErrorResponse | null = null;
    try {
      errorData = await res.json();
    } catch {
      // ignore JSON parse failure
    }

    if (errorData?.error) {
      throw new ApiError(
        res.status,
        errorData.error.code,
        errorData.error.message,
        errorData.error.details
      );
    }
    throw new ApiError(res.status, 'REQUEST_FAILED', `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  async getRooms(): Promise<Room[]> {
    const res = await fetch('/api/rooms');
    return handleResponse<Room[]>(res);
  },

  async getBookings(date: string, roomId?: number): Promise<Booking[]> {
    const params = new URLSearchParams({ date });
    if (roomId !== undefined) {
      params.append('roomId', String(roomId));
    }
    const res = await fetch(`/api/bookings?${params.toString()}`);
    return handleResponse<Booking[]>(res);
  },

  async createBooking(payload: {
    roomId: number;
    title: string;
    organizerEmail: string;
    attendees: number;
    start: string;
    end: string;
  }): Promise<Booking> {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<Booking>(res);
  },

  async cancelBooking(id: number): Promise<Booking> {
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<Booking>(res);
  },

  async getAvailability(params: {
    date: string;
    start: string;
    end: string;
    minCapacity?: number;
  }): Promise<Room[]> {
    const query = new URLSearchParams({
      date: params.date,
      start: params.start,
      end: params.end,
    });
    if (params.minCapacity) {
      query.append('minCapacity', String(params.minCapacity));
    }
    const res = await fetch(`/api/availability?${query.toString()}`);
    return handleResponse<Room[]>(res);
  },

  async runTests(): Promise<TestSummary> {
    const res = await fetch('/api/tests/run');
    return handleResponse<TestSummary>(res);
  },
};
