export type ErrorCode =
  | 'INVALID_INPUT'
  | 'INVALID_TIME_RANGE'
  | 'INVALID_TIME_BOUNDARY'
  | 'INVALID_DURATION'
  | 'OUTSIDE_BUSINESS_HOURS'
  | 'BOOKING_IN_PAST'
  | 'CAPACITY_EXCEEDED'
  | 'BOOKING_CONFLICT'
  | 'BOOKING_ALREADY_STARTED'
  | 'ORGANIZER_LIMIT_EXCEEDED'
  | 'ROOM_NOT_FOUND'
  | 'BOOKING_NOT_FOUND';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(statusCode: number, code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toResponseJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details ? { details: this.details } : {})
      }
    };
  }
}
