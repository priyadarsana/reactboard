import { useState } from 'react';
import { MapPin, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AddPinModeProps {
  itemId: string;
  userId: string | null;
  onComplete: () => void;
}

export const AddPinMode = ({ itemId, userId, onComplete }: AddPinModeProps) => {
  const [isActive, setIsActive] = useState(false);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isActive || !userId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPendingPin({ x, y });
  };

  const confirmPin = async () => {
    if (!pendingPin || !userId) return;

    try {
      const { error } = await supabase.from('pins').insert({
        item_id: itemId,
        lat: pendingPin.x,
        lng: pendingPin.y,
        created_by: userId
      });

      if (error) throw error;

      toast.success('Location added! Others can now vote on it.');
      setPendingPin(null);
      setIsActive(false);
      onComplete();
    } catch (error) {
      toast.error('Failed to add location');
    }
  };

  return (
    <>
      {/* Add Pin Button */}
      <Button
        onClick={() => setIsActive(!isActive)}
        className={`absolute top-4 right-4 z-20 ${isActive ? 'bg-red-500 hover:bg-red-600' : ''}`}
        size="sm"
      >
        <MapPin className="w-4 h-4 mr-2" />
        {isActive ? 'Cancel' : 'Suggest Location'}
      </Button>

      {/* Instruction Banner */}
      {isActive && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-blue-50 border-2 border-blue-400 rounded-lg px-4 py-2 z-20 shadow-lg">
          <p className="text-sm font-semibold text-blue-800">
            Click on the map where you think the item might be
          </p>
        </div>
      )}

      {/* Click Overlay */}
      {isActive && (
        <div
          className="absolute inset-0 z-10 cursor-crosshair"
          onClick={handleMapClick}
        />
      )}

      {/* Pending Pin Marker */}
      {pendingPin && (
        <>
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30"
            style={{ left: `${pendingPin.x}%`, top: `${pendingPin.y}%` }}
          >
            <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-white animate-pulse">
              ?
            </div>
          </div>

          {/* Confirm Dialog */}
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl p-4 z-30 border-2">
            <p className="text-sm font-semibold mb-3">Add this location?</p>
            <div className="flex gap-2">
              <Button onClick={confirmPin} size="sm" className="bg-green-500 hover:bg-green-600">
                <Check className="w-4 h-4 mr-1" />
                Confirm
              </Button>
              <Button onClick={() => setPendingPin(null)} size="sm" variant="outline">
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
};
