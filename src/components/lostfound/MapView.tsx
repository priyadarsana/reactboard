import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, X, MessageSquare, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PinVoting } from './PinVoting';
import { PinChat } from './PinChat';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Import floor plan SVGs
import floor0Svg from '/floor-plans/floor-0.svg?url';
import floor1Svg from '/floor-plans/floor-1.svg?url';
import floor2Svg from '/floor-plans/floor-2.svg?url';

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

  // Use imported SVGs instead of hardcoded paths
  const floorPlanImages = [floor0Svg, floor1Svg, floor2Svg];

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
    } else {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="flex-1 relative bg-gray-100">
      {/* Map Container - Mobile Responsive */}
      <div className="absolute inset-0 p-2 md:p-6">
        <div 
          className="relative w-full max-w-6xl mx-auto bg-white rounded-lg shadow-lg border border-gray-200 overflow-auto" 
          style={{ 
            height: 'auto',
            minHeight: '300px',
            maxHeight: '500px',
            touchAction: 'pan-x pan-y pinch-zoom'
          }}
        >
          
          {/* Floor Plan with Pins */}
          <div className="relative w-full h-full min-h-[300px]">
            <img
              src={floorPlanImages[currentFloor]}
              alt={`Floor ${currentFloor} Plan`}
              className="w-full h-full object-contain"
              style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
              onError={(e) => {
                console.error('Failed to load floor plan:', floorPlanImages[currentFloor]);
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />

            {/* Pin Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {currentFloorPins.map((pin: any, idx: number) => {
                const tickVotes = pin.votes?.filter((v: any) => v.vote_type === 'tick').length || 0;
                const crossVotes = pin.votes?.filter((v: any) => v.vote_type === 'cross').length || 0;
                const totalVotes = tickVotes + crossVotes;
                const confidence = totalVotes > 0 ? (tickVotes / totalVotes) * 100 : 0;

                return (
                  <div
                    key={`${pin.id || idx}`}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto z-10"
                    style={{
                      left: `${pin.lat}%`,
                      top: `${pin.lng}%`,
                    }}
                    onClick={() => handlePinClick(pin)}
                  >
                    <div className="relative group">
                      <div 
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm shadow-xl hover:scale-110 transition-transform border-2 md:border-4 border-white ${
                          confidence >= 70 ? 'bg-green-500' : 
                          confidence >= 40 ? 'bg-blue-500' : 
                          totalVotes === 0 ? 'bg-blue-500' :
                          'bg-gray-500'
                        }`}
                      >
                        {pin.pinNumber}
                      </div>
                      
                      {totalVotes > 0 && (
                        <div className="absolute -top-1 -right-1 bg-white rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-xs font-bold border-2 shadow">
                          {tickVotes}
                        </div>
                      )}

                      {/* Mobile: Show info on tap, Desktop: Show on hover */}
                      <div className="hidden md:group-hover:block absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white p-3 rounded-lg shadow-xl whitespace-nowrap z-20 border min-w-[200px]">
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

          {/* Multi-Floor Summary - Mobile Responsive */}
          {Object.keys(pinsByFloor).length > 1 && (
            <div className="absolute top-2 left-2 md:top-4 md:left-4 bg-white/95 backdrop-blur px-2 py-2 md:px-4 md:py-3 rounded-lg shadow-lg border border-gray-200 z-20 text-xs md:text-sm max-w-[150px] md:max-w-none">
              <p className="font-semibold mb-2">📍 Locations</p>
              <div className="space-y-1">
                {Object.entries(pinsByFloor)
                  .sort((a, b) => Number(a[0]) - Number(b[0]))
                  .map(([floor, count]: [string, any]) => (
                    <div 
                      key={floor} 
                      className={`flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors ${
                        currentFloor === Number(floor) ? 'text-blue-600 font-bold bg-blue-50' : 'text-gray-600'
                      }`}
                      onClick={() => setCurrentFloor(Number(floor))}
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        currentFloor === Number(floor) ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'
                      }`}></div>
                      <span className="text-xs">Floor {floor}: {count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* No Pins Message */}
          {currentFloorPins.length === 0 && allPins.length > 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-50 border-2 border-blue-400 rounded-lg p-4 md:p-6 text-center shadow-xl z-30 max-w-xs md:max-w-md">
              <p className="font-semibold text-blue-800 text-sm md:text-base mb-2">📍 No pins on Floor {currentFloor}</p>
              <p className="text-xs md:text-sm text-blue-700 mb-3">
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
                    Floor {floor} ({pinsByFloor[floor]})
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Floor Selector - Mobile Friendly */}
          <div className="absolute right-2 top-1/2 md:right-4 transform -translate-y-1/2 bg-white/95 backdrop-blur rounded-lg shadow-lg p-1 md:p-2 flex flex-col gap-1 md:gap-2 z-20 border border-gray-200">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleFloorChange(currentFloor + 1)}
              disabled={currentFloor >= totalFloors - 1}
              className="h-7 w-7 md:h-8 md:w-8"
            >
              <ChevronUp className="w-3 h-3 md:w-4 md:h-4" />
            </Button>

            <div className="text-center font-bold py-1 px-1 md:py-2 md:px-2 text-xs md:text-sm">
              {currentFloor}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => handleFloorChange(currentFloor - 1)}
              disabled={currentFloor <= 0}
              className="h-7 w-7 md:h-8 md:w-8"
            >
              <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
          </div>

          {/* Floor Info - Mobile Responsive */}
          <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 bg-white/95 backdrop-blur px-2 py-2 md:px-4 md:py-3 rounded-lg shadow-lg border border-gray-200">
            <p className="text-xs md:text-sm font-semibold">Floor {currentFloor}</p>
            <p className="text-xs text-gray-600">
              {currentFloorPins.length} pin{currentFloorPins.length !== 1 ? 's' : ''}
              {allPins.length > currentFloorPins.length && ` • ${allPins.length} total`}
            </p>
          </div>

          {/* Legend - Hide on mobile, show on desktop */}
          {currentFloorPins.length > 0 && (
            <div className="hidden md:block absolute top-4 right-20 bg-white/95 backdrop-blur px-4 py-3 rounded-lg shadow-lg border border-gray-200">
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

          {/* Floating Action Buttons - Mobile Responsive */}
          {item.status === 'open' && isOwner && (
            <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 flex flex-col md:flex-row gap-2 md:gap-3 z-30">
              <Button
                onClick={() => handleStatusUpdate('matched')}
                variant="outline"
                className="bg-white shadow-lg hover:shadow-xl transition-all text-xs md:text-sm"
                size="sm"
              >
                🔄 <span className="hidden md:inline ml-1">In Progress</span>
              </Button>

              <Button
                onClick={() => handleStatusUpdate('returned')}
                className="bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all text-xs md:text-sm"
                size="sm"
              >
                <CheckCircle className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                <span className="hidden md:inline">Found</span>
                <span className="md:hidden">✓</span>
              </Button>
            </div>
          )}

          {/* Mobile Touch Instruction */}
          <div className="md:hidden absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1 rounded-full">
            Pinch to zoom • Tap pins for details
          </div>
        </div>
      </div>

      {/* Pin Details Dialog */}
      <Dialog open={!!selectedPin} onOpenChange={() => setSelectedPin(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-8 text-sm md:text-base">
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
