import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, X, MessageSquare, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PinVoting } from './PinVoting';
import { PinChat } from './PinChat';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MapViewProps {
  item: any;
}

export const MapView = ({ item }: MapViewProps) => {
  const [currentFloor, setCurrentFloor] = useState(Number(item.floor) || 0);
  const [selectedPin, setSelectedPin] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const totalFloors = 3;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  useEffect(() => {
    setCurrentFloor(Number(item.floor) || 0);
  }, [item.id, item.floor]);

  const floorPlanImages = [
    '/floor-plans/floor-0.svg',
    '/floor-plans/floor-1.svg',
    '/floor-plans/floor-2.svg',
  ];

  const allPins = item.pins || [];

  const currentFloorPins = allPins
    .filter((pin: any) => {
      const pinFloor = pin.floor !== null && pin.floor !== undefined 
        ? Number(pin.floor) 
        : Number(item.floor);
      return pinFloor === currentFloor;
    })
    .map((pin: any) => {
      const globalIndex = allPins.findIndex((p: any) => p.id === pin.id) + 1;
      return {
        ...pin,
        pinNumber: globalIndex,
        totalPins: allPins.length,
        displayFloor: pin.floor !== null && pin.floor !== undefined ? pin.floor : item.floor
      };
    });

  const pinsByFloor = allPins.reduce((acc: any, pin: any) => {
    const floor = pin.floor !== null && pin.floor !== undefined 
      ? Number(pin.floor) 
      : Number(item.floor);
    
    if (!isNaN(floor)) {
      acc[floor] = (acc[floor] || 0) + 1;
    }
    return acc;
  }, {});

  const handleFloorChange = (newFloor: number) => {
    if (newFloor >= 0 && newFloor < totalFloors) {
      setCurrentFloor(newFloor);
    }
  };

  const handlePinClick = (pin: any) => {
    setSelectedPin(pin);
  };

  const isOwner = currentUserId === item.reporter_id;

  const handleStatusUpdate = async (status: 'matched' | 'returned') => {
    const { error } = await supabase
      .from('lost_items')
      .update({ status })
      .eq('id', item.id);
    
    if (!error) {
      toast.success(
        status === 'returned' 
          ? '🎉 Item marked as found!' 
          : 'Item marked as in progress'
      );
      // Real-time subscription in LostFound.tsx will handle the update
      // No need to reload the page
    } else {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="flex-1 relative bg-gray-100">
      {/* Map Container - TOP ALIGNED */}
      <div className="absolute inset-0 p-6">
        <div className="relative w-full max-w-6xl mx-auto bg-white rounded-lg shadow-lg border border-gray-200" style={{ height: '500px' }}>
          
          {/* Floor Plan with Pins */}
          <div className="relative w-full h-full">
            <img
              src={floorPlanImages[currentFloor]}
              alt={`Floor ${currentFloor} Plan`}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />

            {/* Pin Overlay */}
            <div className="absolute inset-0">
              {currentFloorPins.map((pin: any, idx: number) => {
                const tickVotes = pin.votes?.filter((v: any) => v.vote_type === 'tick').length || 0;
                const crossVotes = pin.votes?.filter((v: any) => v.vote_type === 'cross').length || 0;
                const totalVotes = tickVotes + crossVotes;
                const confidence = totalVotes > 0 ? (tickVotes / totalVotes) * 100 : 0;

                return (
                  <div
                    key={`${pin.id || idx}`}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
                    style={{
                      left: `${pin.lat}%`,
                      top: `${pin.lng}%`,
                    }}
                    onClick={() => handlePinClick(pin)}
                  >
                    <div className="relative group">
                      <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xl hover:scale-110 transition-transform border-4 border-white ${
                          confidence >= 70 ? 'bg-green-500' : 
                          confidence >= 40 ? 'bg-blue-500' : 
                          totalVotes === 0 ? 'bg-blue-500' :
                          'bg-gray-500'
                        }`}
                      >
                        {pin.pinNumber}
                      </div>
                      
                      {totalVotes > 0 && (
                        <div className="absolute -top-1 -right-1 bg-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold border-2 shadow">
                          {tickVotes}
                        </div>
                      )}

                      <div className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white p-3 rounded-lg shadow-xl whitespace-nowrap z-20 border min-w-[200px]">
                        <p className="font-bold text-sm mb-1">{item.title}</p>
                        <p className="text-xs text-gray-600 mb-2">
                          Location {pin.pinNumber} of {pin.totalPins} • Floor {pin.displayFloor}
                        </p>
                        <div className="flex gap-2 text-xs mb-2">
                          <Badge variant="outline" className="text-xs">
                            👍 {tickVotes}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            👎 {crossVotes}
                          </Badge>
                        </div>
                        <p className="text-xs text-blue-600 font-semibold">Click to vote & discuss</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Multi-Floor Summary */}
          {Object.keys(pinsByFloor).length > 1 && (
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-4 py-3 rounded-lg shadow-lg border border-gray-200 z-20">
              <p className="text-xs font-semibold mb-2">📍 Locations Across Floors</p>
              <div className="space-y-1">
                {Object.entries(pinsByFloor)
                  .sort((a, b) => Number(a[0]) - Number(b[0]))
                  .map(([floor, count]: [string, any]) => (
                    <div 
                      key={floor} 
                      className={`flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors ${
                        currentFloor === Number(floor) ? 'text-blue-600 font-bold bg-blue-50' : 'text-gray-600'
                      }`}
                      onClick={() => setCurrentFloor(Number(floor))}
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        currentFloor === Number(floor) ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'
                      }`}></div>
                      <span>Floor {floor}: {count} pin{count > 1 ? 's' : ''}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* No Pins Message */}
          {currentFloorPins.length === 0 && allPins.length > 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-50 border-2 border-blue-400 rounded-lg p-6 text-center shadow-xl z-30 max-w-md">
              <p className="font-semibold text-blue-800 mb-2">📍 No pins on Floor {currentFloor}</p>
              <p className="text-sm text-blue-700 mb-3">
                This item has {allPins.length} location{allPins.length > 1 ? 's' : ''} on other floors
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {Object.keys(pinsByFloor).map((floor) => (
                  <Button
                    key={floor}
                    onClick={() => setCurrentFloor(Number(floor))}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs"
                    size="sm"
                  >
                    Floor {floor} ({pinsByFloor[floor]} pins)
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Floor Selector */}
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/95 backdrop-blur rounded-lg shadow-lg p-2 flex flex-col gap-2 z-20 border border-gray-200">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleFloorChange(currentFloor + 1)}
              disabled={currentFloor >= totalFloors - 1}
              className="h-8 w-8"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>

            <div className="text-center font-bold py-2 px-2 text-sm">
              Floor {currentFloor}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => handleFloorChange(currentFloor - 1)}
              disabled={currentFloor <= 0}
              className="h-8 w-8"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>

          {/* Floor Info */}
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur px-4 py-3 rounded-lg shadow-lg border border-gray-200">
            <p className="text-sm font-semibold">CSE Building - Floor {currentFloor}</p>
            <p className="text-xs text-gray-600">
              {currentFloorPins.length} pin{currentFloorPins.length !== 1 ? 's' : ''} on this floor
              {allPins.length > currentFloorPins.length && ` • ${allPins.length} total`}
            </p>
          </div>

          {/* Legend */}
          {currentFloorPins.length > 0 && (
            <div className="absolute top-4 right-20 bg-white/95 backdrop-blur px-4 py-3 rounded-lg shadow-lg border border-gray-200">
              <p className="text-xs font-semibold mb-2">Pin Colors</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span>Verified (&gt;70%)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span>Suggested</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                  <span>Low confidence</span>
                </div>
              </div>
            </div>
          )}

          {/* Floating Action Buttons - For Item Owner */}
          {item.status === 'open' && isOwner && (
            <div className="absolute bottom-4 right-4 flex gap-3 z-30">
              <Button
                onClick={() => handleStatusUpdate('matched')}
                variant="outline"
                className="bg-white shadow-lg hover:shadow-xl transition-all"
                size="sm"
              >
                🔄 In Progress
              </Button>

              <Button
                onClick={() => handleStatusUpdate('returned')}
                className="bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all"
                size="sm"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Found
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Pin Details Dialog */}
      <Dialog open={!!selectedPin} onOpenChange={() => setSelectedPin(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-8">
              <span>Location {selectedPin?.pinNumber} - {item.title}</span>
            </DialogTitle>
          </DialogHeader>

          {selectedPin && (
            <div className="space-y-4">
              <div className="border-b pb-4">
                <p className="text-sm font-semibold mb-3">Is this location accurate?</p>
                <PinVoting 
                  pinId={selectedPin.id} 
                  votes={selectedPin.votes || []}
                  userId={currentUserId}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Help others by voting on the accuracy of this location
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4" />
                  <p className="text-sm font-semibold">Discussion</p>
                </div>
                <PinChat pinId={selectedPin.id} userId={currentUserId} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
