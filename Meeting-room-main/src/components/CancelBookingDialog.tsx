import { useState } from 'react';
import { Booking, Room } from '../types';
import { api, ApiError } from '../services/api';
import { AlertTriangle, X, Check, AlertCircle } from 'lucide-react';

interface CancelBookingDialogProps {
  booking: Booking | null;
  room?: Room;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CancelBookingDialog({
  booking,
  room,
  isOpen,
  onClose,
  onSuccess,
}: CancelBookingDialogProps) {
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !booking) return null;

  const formatUTC = (iso: string) => {
    const d = new Date(iso);
    return `${d.toISOString().substring(0, 10)} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`;
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    setError(null);
    try {
      await api.cancelBooking(booking.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(`[${err.code}] ${err.message}`);
      } else {
        setError(err.message || 'Failed to cancel booking');
      }
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Cancel Booking</h3>
              <p className="text-xs text-slate-500">This action will release the slot.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4 space-y-3">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2 font-mono">
            <div>
              <span className="text-slate-500">Room: </span>
              <span className="font-semibold text-slate-800 font-sans">
                {room?.name || `Room #${booking.roomId}`}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Title: </span>
              <span className="text-slate-800 font-sans font-medium">{booking.title}</span>
            </div>
            <div>
              <span className="text-slate-500">Organizer: </span>
              <span className="text-slate-800 font-sans">{booking.organizerEmail}</span>
            </div>
            <div>
              <span className="text-slate-500">Time: </span>
              <span className="text-slate-800 tabular-nums">
                {formatUTC(booking.start)} – {formatUTC(booking.end)}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Note: Per business rule <span className="font-semibold text-slate-700">R8</span>, bookings that have already started cannot be cancelled.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Keep Booking
          </button>
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
          </button>
        </div>
      </div>
    </div>
  );
}
