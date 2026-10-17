import { useState } from 'react';
import { Room } from '../types';
import { api, ApiError } from '../services/api';
import { Search, Users, MapPin, CheckCircle, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

interface AvailabilitySearchProps {
  onSelectRoomToBook: (roomId: number, date: string, start: string) => void;
}

export function AvailabilitySearch({ onSelectRoomToBook }: AvailabilitySearchProps) {
  const [date, setDate] = useState<string>(() => new Date().toISOString().substring(0, 10));
  const [start, setStart] = useState<string>('14:00');
  const [end, setEnd] = useState<string>('15:00');
  const [minCapacity, setMinCapacity] = useState<number>(4);

  const [availableRooms, setAvailableRooms] = useState<Room[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const results = await api.getAvailability({
        date,
        start,
        end,
        minCapacity: minCapacity || undefined,
      });
      setAvailableRooms(results);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(`[${err.code}] ${err.message}`);
      } else {
        setError(err.message || 'Availability search failed');
      }
      setAvailableRooms(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900">Find an Available Room</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Searches rooms free for the entire window meeting your attendee requirements, ranked with best fit first.
          </p>
        </div>

        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
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
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            >
              {generateSlots(8, 19).map((s) => (
                <option key={s} value={s}>
                  {s} UTC
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              End Time (UTC)
            </label>
            <select
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            >
              {generateSlots(8, 20).map((s) => (
                <option key={s} value={s}>
                  {s} UTC
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Minimum Capacity
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={minCapacity}
              onChange={(e) => setMinCapacity(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center justify-center gap-1.5 h-[38px] disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{loading ? 'Searching...' : 'Search Rooms'}</span>
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Availability Search Error</div>
            <div className="text-rose-700 text-xs mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {availableRooms !== null && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-700">
              Matching Rooms Available ({availableRooms.length})
            </div>
            <span className="text-[11px] text-slate-500">
              Ordered by smallest sufficient capacity first (Section 5.5)
            </span>
          </div>

          {availableRooms.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No rooms are available for the requested time window and capacity.
              <div className="text-xs text-slate-400 mt-1">
                Try selecting a different time window or reducing the minimum capacity.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {availableRooms.map((room, idx) => (
                <div
                  key={room.id}
                  className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {room.name}
                      </span>
                      {idx === 0 && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Best Fit
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        Capacity {room.capacity}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        Floor {room.floor}
                      </span>
                      {room.amenities.length > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-slate-600">
                            {room.amenities.join(', ')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectRoomToBook(room.id, date, start)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-xs whitespace-nowrap self-start sm:self-auto"
                  >
                    <span>Book This Room</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function generateSlots(startHour: number, endHour: number): string[] {
  const slots: string[] = [];
  for (let h = startHour; h <= endHour; h++) {
    for (const m of [0, 15, 30, 45]) {
      if (h === 20 && m > 0) break;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
}
