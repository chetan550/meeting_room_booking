import { useState, useEffect } from 'react';
import { Room } from '../types';
import { api, ApiError } from '../services/api';
import { X, Calendar, Clock, Users, Mail, Type, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  rooms: Room[];
  initialRoomId?: number;
  initialDate?: string;
  initialStart?: string;
}

export function CreateBookingModal({
  isOpen,
  onClose,
  onSuccess,
  rooms,
  initialRoomId,
  initialDate,
  initialStart,
}: CreateBookingModalProps) {
  const [roomId, setRoomId] = useState<number>(initialRoomId || (rooms[0]?.id ?? 1));
  const [title, setTitle] = useState<string>('Sprint Planning');
  const [organizerEmail, setOrganizerEmail] = useState<string>('sam@example.com');
  const [attendees, setAttendees] = useState<number>(4);

  const defaultDate = initialDate || new Date().toISOString().substring(0, 10);
  const [date, setDate] = useState<string>(defaultDate);
  const [startTime, setStartTime] = useState<string>(initialStart || '10:00');
  const [endTime, setEndTime] = useState<string>('11:00');

  const [clientErrors, setClientErrors] = useState<string[]>([]);
  const [serverError, setServerError] = useState<{ code: string; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialRoomId) setRoomId(initialRoomId);
    if (initialDate) setDate(initialDate);
    if (initialStart) {
      setStartTime(initialStart);
      // Auto-compute 1 hour duration
      const [h, m] = initialStart.split(':').map(Number);
      const endH = Math.min(20, h + 1);
      setEndTime(`${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }, [initialRoomId, initialDate, initialStart]);

  if (!isOpen) return null;

  const selectedRoom = rooms.find((r) => r.id === roomId) || rooms[0];

  const validateClient = (): boolean => {
    const errors: string[] = [];
    const trimmedTitle = title.trim();
    if (!trimmedTitle || trimmedTitle.length > 100) {
      errors.push('Title must be between 1 and 100 characters.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(organizerEmail.trim())) {
      errors.push('Please enter a valid organizer email address.');
    }

    if (!attendees || attendees < 1) {
      errors.push('Attendees must be at least 1.');
    } else if (selectedRoom && attendees > selectedRoom.capacity) {
      errors.push(
        `Attendees (${attendees}) exceeds ${selectedRoom.name} capacity (${selectedRoom.capacity}). (Rule R6)`
      );
    }

    if (!startTime || !endTime) {
      errors.push('Start time and end time are required.');
    } else {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);

      if (sm % 15 !== 0 || em % 15 !== 0) {
        errors.push('Start and end times must fall on 15-minute boundaries (:00, :15, :30, :45). (Rule R2)');
      }

      const startMinutes = sh * 60 + sm;
      const endMinutes = eh * 60 + em;
      const duration = endMinutes - startMinutes;

      if (duration <= 0) {
        errors.push('End time must be strictly after start time. (Rule R1)');
      } else if (duration < 15 || duration > 240) {
        errors.push(`Booking duration must be between 15 minutes and 4 hours (current: ${duration} mins). (Rule R3)`);
      }

      if (sh < 8 || eh > 20 || (eh === 20 && em > 0)) {
        errors.push('Booking must be within business hours, 08:00 to 20:00 UTC. (Rule R4)');
      }

      const candidateStart = new Date(`${date}T${startTime}:00.000Z`);
      if (candidateStart.getTime() < Date.now()) {
        errors.push('Booking cannot start in the past. (Rule R5)');
      }
    }

    setClientErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateClient()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const startISO = `${date}T${startTime}:00.000Z`;
      const endISO = `${date}T${endTime}:00.000Z`;

      await api.createBooking({
        roomId,
        title: title.trim(),
        organizerEmail: organizerEmail.trim(),
        attendees,
        start: startISO,
        end: endISO,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setServerError({ code: err.code, message: err.message });
      } else {
        setServerError({ code: 'UNKNOWN_ERROR', message: err.message || 'An unexpected error occurred.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Book Meeting Room</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Times are strictly in UTC · 08:00 to 20:00 UTC business hours
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {serverError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-rose-900">
                  {serverError.code}
                </div>
                <div className="mt-0.5">{serverError.message}</div>
              </div>
            </div>
          )}

          {clientErrors.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Please correct the following:
              </div>
              <ul className="list-disc pl-5 space-y-0.5">
                {clientErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Meeting Room
            </label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} · Floor {room.floor} · Max {room.capacity} attendees
                  {room.amenities.length > 0 ? ` (${room.amenities.join(', ')})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Meeting Title
            </label>
            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                placeholder="e.g. Quarterly Architecture Sync"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <span className="absolute right-2.5 top-2.5 text-[10px] text-slate-400 font-mono">
                {title.trim().length}/100
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Organizer Email
              </label>
              <input
                type="email"
                value={organizerEmail}
                onChange={(e) => setOrganizerEmail(e.target.value)}
                placeholder="organizer@example.com"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Attendees (Max {selectedRoom?.capacity || 20})
              </label>
              <input
                type="number"
                min={1}
                max={selectedRoom?.capacity || 20}
                value={attendees}
                onChange={(e) => setAttendees(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date (UTC)
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Time (UTC)
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              >
                {generate15MinSlots(8, 19).map((slot) => (
                  <option key={slot} value={slot}>
                    {slot} UTC
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                End Time (UTC)
              </label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              >
                {generate15MinSlots(8, 20).map((slot) => (
                  <option key={slot} value={slot}>
                    {slot} UTC
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Confirm Booking</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function generate15MinSlots(startHour: number, endHour: number): string[] {
  const slots: string[] = [];
  for (let h = startHour; h <= endHour; h++) {
    for (const m of [0, 15, 30, 45]) {
      if (h === 20 && m > 0) break;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
}
