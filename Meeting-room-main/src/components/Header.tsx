import { useEffect, useState } from 'react';
import { Calendar, Plus, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  activeTab: 'schedule' | 'availability' | 'rooms' | 'tests';
  setActiveTab: (tab: 'schedule' | 'availability' | 'rooms' | 'tests') => void;
  onOpenCreateModal: () => void;
}

export function Header({ activeTab, setActiveTab, onOpenCreateModal }: HeaderProps) {
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${hours}:${minutes}:${seconds} UTC`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-base font-semibold tracking-tight text-white whitespace-nowrap shrink-0">
              Meeting Room Booking System
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'schedule'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Day Schedule
            </button>
            <button
              onClick={() => setActiveTab('availability')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'availability'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Find Room
            </button>
            <button
              onClick={() => setActiveTab('rooms')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'rooms'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Rooms Directory
            </button>
            <button
              onClick={() => setActiveTab('tests')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'tests'
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Test Suite & Races
            </button>
          </nav>

          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono tabular-nums text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>{utcTime || '00:00:00 UTC'}</span>
            </div>
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors shadow-sm whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Book Room</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
