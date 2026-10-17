import { Room } from '../types';
import { Users, MapPin, Monitor, Video, Presentation, Sparkles } from 'lucide-react';

interface RoomCatalogProps {
  rooms: Room[];
  onBookRoom: (roomId: number) => void;
}

export function RoomCatalog({ rooms, onBookRoom }: RoomCatalogProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-base font-semibold text-slate-900">Office Meeting Rooms</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Standard seeded office facilities available for booking during UTC business hours (08:00 - 20:00 UTC).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-slate-900">{room.name}</h4>
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Floor {room.floor}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600 mt-2 font-medium">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Up to {room.capacity} attendees</span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Amenities
                </div>
                {room.amenities.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {room.amenities.map((item, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">None</span>
                )}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100">
              <button
                onClick={() => onBookRoom(room.id)}
                className="w-full px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-center"
              >
                Book {room.name}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
