import { useState, useEffect, useMemo } from 'react';
import { Room, Booking } from '../types';
import { api } from '../services/api';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  MapPin,
  RefreshCw,
  AlertCircle,
  Clock,
  Sparkles,
  Trash2,
} from 'lucide-react';

interface ScheduleViewProps {
  rooms: Room[];
  onBookRoom: (roomId?: number, preferredDate?: string, preferredStart?: string) => void;
  onRequestCancel: (booking: Booking) => void;
  refreshTrigger: number;
}

const BIZ_START_HOUR = 8;
const BIZ_END_HOUR = 20;
const TOTAL_MINUTES = (BIZ_END_HOUR - BIZ_START_HOUR) * 60;

export function ScheduleView({
  rooms,
  onBookRoom,
  onRequestCancel,
  refreshTrigger,
}: ScheduleViewProps) {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().substring(0, 10);
  });

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all');

  const loadDayBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getBookings(selectedDate);
      setBookings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDayBookings();
  }, [selectedDate, refreshTrigger]);

  const changeDay = (offsetDays: number) => {
    const current = new Date(`${selectedDate}T00:00:00.000Z`);
    current.setUTCDate(current.getUTCDate() + offsetDays);
    setSelectedDate(current.toISOString().substring(0, 10));
  };

  const setQuickDate = (type: 'today' | 'tomorrow') => {
    const d = new Date();
    if (type === 'tomorrow') {
      d.setUTCDate(d.getUTCDate() + 1);
    }
    setSelectedDate(d.toISOString().substring(0, 10));
  };

  const filteredRooms = useMemo(() => {
    if (selectedFloor === 'all') return rooms;
    return rooms.filter((r) => r.floor === selectedFloor);
  }, [rooms, selectedFloor]);

  const hoursList = useMemo(() => {
    const list: string[] = [];
    for (let h = BIZ_START_HOUR; h <= BIZ_END_HOUR; h++) {
      list.push(`${String(h).padStart(2, '0')}:00`);
    }
    return list;
  }, []);

  const getBookingLayout = (booking: Booking) => {
    const startDate = new Date(booking.start);
    const endDate = new Date(booking.end);

    const startMinutes = startDate.getUTCHours() * 60 + startDate.getUTCMinutes();
    const endMinutes = endDate.getUTCHours() * 60 + endDate.getUTCMinutes();

    const bizStartMinutes = BIZ_START_HOUR * 60;
    const offsetMinutes = Math.max(0, startMinutes - bizStartMinutes);
    const durationMinutes = Math.min(
      TOTAL_MINUTES - offsetMinutes,
      endMinutes - startMinutes
    );

    const leftPercent = (offsetMinutes / TOTAL_MINUTES) * 100;
    const widthPercent = (durationMinutes / TOTAL_MINUTES) * 100;

    return {
      left: `${leftPercent}%`,
      width: `${Math.max(widthPercent, 1.5)}%`,
    };
  };

  const formatTimeSlot = (isoString: string) => {
    const d = new Date(isoString);
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`;
  };

  const isPastBooking = (booking: Booking) => {
    return new Date(booking.start).getTime() <= Date.now();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeDay(-1)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Previous day"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 text-sm font-medium border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <span className="text-xs text-slate-500 font-medium">
                (UTC Calendar Date)
              </span>
            </div>

            <button
              onClick={() => changeDay(1)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Next day"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 ml-2">
              <button
                onClick={() => setQuickDate('today')}
                className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setQuickDate('tomorrow')}
                className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              >
                Tomorrow
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
              <span className="text-slate-500 px-2">Floor:</span>
              {(['all', 1, 2, 3] as const).map((floor) => (
                <button
                  key={floor}
                  onClick={() => setSelectedFloor(floor)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    selectedFloor === floor
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {floor === 'all' ? 'All' : `F${floor}`}
                </button>
              ))}
            </div>

            <button
              onClick={loadDayBookings}
              disabled={loading}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh schedule"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Unable to load schedule</div>
            <div className="text-rose-700 text-xs mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {/* Schedule Timeline Grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Timeline Header with Hours */}
        <div className="border-b border-slate-200 bg-slate-50/70 p-4">
          <div className="grid grid-cols-12 gap-2 text-xs font-mono text-slate-500 text-center">
            {hoursList.slice(0, 12).map((h, idx) => (
              <div key={idx} className="truncate">
                {h} <span className="text-[10px] text-slate-400">UTC</span>
              </div>
            ))}
          </div>
        </div>

        {/* Room Rows */}
        <div className="divide-y divide-slate-100">
          {filteredRooms.map((room) => {
            const roomBookings = bookings.filter((b) => b.roomId === room.id);

            return (
              <div
                key={room.id}
                className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col lg:flex-row lg:items-center gap-4"
              >
                {/* Room Info Block */}
                <div className="w-full lg:w-64 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 text-sm">
                      {room.name}
                    </span>
                    <button
                      onClick={() => onBookRoom(room.id, selectedDate)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      + Book Slot
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Capacity {room.capacity}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      Floor {room.floor}
                    </span>
                  </div>
                  {room.amenities.length > 0 && (
                    <div className="text-[11px] text-slate-400 mt-1 truncate">
                      {room.amenities.join(', ')}
                    </div>
                  )}
                </div>

                <div className="flex-1 relative h-16 bg-slate-100/60 rounded-lg border border-slate-200/80 overflow-hidden">
                  <div className="absolute inset-0 grid grid-cols-12 pointer-events-none divide-x divide-slate-200/60">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="h-full" />
                    ))}
                  </div>

                  {roomBookings.map((b) => {
                    const layout = getBookingLayout(b);
                    const past = isPastBooking(b);

                    return (
                      <div
                        key={b.id}
                        style={{ left: layout.left, width: layout.width }}
                        className={`group absolute top-1.5 bottom-1.5 rounded-md px-2 py-1 text-xs transition-all shadow-xs overflow-hidden flex flex-col justify-between cursor-pointer border ${
                          past
                            ? 'bg-slate-200/90 text-slate-700 border-slate-300'
                            : 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700'
                        }`}
                        title={`${b.title}\nOrganizer: ${b.organizerEmail}\n${formatTimeSlot(b.start)} – ${formatTimeSlot(b.end)}\nAttendees: ${b.attendees}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-medium truncate text-[11px]">
                            {b.title}
                          </span>
                          {!past && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRequestCancel(b);
                              }}
                              className="opacity-0 group-hover:opacity-100 hover:text-rose-200 transition-opacity p-0.5 rounded"
                              title="Cancel this booking"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <div className="text-[10px] opacity-90 truncate font-mono tabular-nums">
                          {formatTimeSlot(b.start).replace(' UTC', '')} -{' '}
                          {formatTimeSlot(b.end).replace(' UTC', '')}
                        </div>
                      </div>
                    );
                  })}

                  {roomBookings.length === 0 && (
                    <div
                      onClick={() => onBookRoom(room.id, selectedDate)}
                      className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 hover:text-blue-600 hover:bg-blue-50/30 cursor-pointer transition-colors"
                    >
                      <span>All slots free today (08:00 - 20:00 UTC) · Click to book</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-600 inline-block" />
              <span>Confirmed Booking</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-300 inline-block" />
              <span>Past / In Progress</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300 inline-block" />
              <span>Free Slot</span>
            </span>
          </div>
          <span className="font-mono text-slate-400">
            All times strictly in UTC · 15-minute slot precision
          </span>
        </div>
      </div>
    </div>
  );
}
