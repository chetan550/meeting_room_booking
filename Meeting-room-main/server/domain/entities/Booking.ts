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

export interface CreateBookingDTO {
  roomId: number;
  title: string;
  organizerEmail: string;
  attendees: number;
  start: string;
  end: string;
}
