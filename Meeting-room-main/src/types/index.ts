export interface Room {
  id: number;
  name: string;
  capacity: number;
  floor: number;
  amenities: string[];
}

export type BookingStatus = 'confirmed' | 'cancelled';

export interface Booking {
  id: number;
  roomId: number;
  title: string;
  organizerEmail: string;
  attendees: number;
  start: string;
  end: string;
  status: BookingStatus;
  createdAt: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface TestResultItem {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

export interface TestSummary {
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
  results: TestResultItem[];
}
