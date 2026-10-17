import { useState, useEffect } from 'react';
import { Room, Booking } from './types';
import { api } from './services/api';
import { Header } from './components/Header';
import { ScheduleView } from './components/ScheduleView';
import { CreateBookingModal } from './components/CreateBookingModal';
import { CancelBookingDialog } from './components/CancelBookingDialog';
import { AvailabilitySearch } from './components/AvailabilitySearch';
import { RoomCatalog } from './components/RoomCatalog';
import { TestRunnerPanel } from './components/TestRunnerPanel';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'availability' | 'rooms' | 'tests'>('schedule');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState<boolean>(true);
  const [roomError, setRoomError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [createInitialRoomId, setCreateInitialRoomId] = useState<number | undefined>();
  const [createInitialDate, setCreateInitialDate] = useState<string | undefined>();
  const [createInitialStart, setCreateInitialStart] = useState<string | undefined>();

  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [isCancelOpen, setIsCancelOpen] = useState<boolean>(false);

  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadRooms = async () => {
    try {
      setLoadingRooms(true);
      setRoomError(null);
      const data = await api.getRooms();
      setRooms(data);
    } catch (err: any) {
      setRoomError(err.message || 'Failed to load rooms');
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const handleOpenCreate = (roomId?: number, preferredDate?: string, preferredStart?: string) => {
    setCreateInitialRoomId(roomId);
    setCreateInitialDate(preferredDate);
    setCreateInitialStart(preferredStart);
    setIsCreateOpen(true);
  };

  const handleOpenCancel = (booking: Booking) => {
    setBookingToCancel(booking);
    setIsCancelOpen(true);
  };

  const handleBookingCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
    showToast('Booking successfully created!');
    if (activeTab !== 'schedule') {
      setActiveTab('schedule');
    }
  };

  const handleBookingCancelled = () => {
    setRefreshTrigger((prev) => prev + 1);
    showToast('Booking cancelled successfully.');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateModal={() => handleOpenCreate()}
      />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loadingRooms ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-slate-500 font-medium">Loading meeting rooms...</p>
          </div>
        ) : roomError ? (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-center max-w-md mx-auto my-12">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
            <h3 className="font-bold text-sm">Failed to connect to backend</h3>
            <p className="text-xs text-rose-700 mt-1">{roomError}</p>
            <button
              onClick={loadRooms}
              className="mt-4 px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-500"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'schedule' && (
              <ScheduleView
                rooms={rooms}
                onBookRoom={handleOpenCreate}
                onRequestCancel={handleOpenCancel}
                refreshTrigger={refreshTrigger}
              />
            )}

            {activeTab === 'availability' && (
              <AvailabilitySearch
                onSelectRoomToBook={(roomId, date, start) => {
                  handleOpenCreate(roomId, date, start);
                }}
              />
            )}

            {activeTab === 'rooms' && (
              <RoomCatalog
                rooms={rooms}
                onBookRoom={(roomId) => handleOpenCreate(roomId)}
              />
            )}

            {activeTab === 'tests' && <TestRunnerPanel />}
          </>
        )}
      </main>

      <CreateBookingModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleBookingCreated}
        rooms={rooms}
        initialRoomId={createInitialRoomId}
        initialDate={createInitialDate}
        initialStart={createInitialStart}
      />

      <CancelBookingDialog
        booking={bookingToCancel}
        room={rooms.find((r) => r.id === bookingToCancel?.roomId)}
        isOpen={isCancelOpen}
        onClose={() => {
          setIsCancelOpen(false);
          setBookingToCancel(null);
        }}
        onSuccess={handleBookingCancelled}
      />
    </div>
  );
}
