import { useState } from 'react';
import { FloorSelector } from './FloorSelector';
import { MapPin } from 'lucide-react';

interface MapPin {
  id: string;
  x: number; // percentage position (0-100)
  y: number; // percentage position (0-100)
  floor: number;
  title: string;
  description: string;
}

interface IndoorMapProps {
  items: any[];
}

export const IndoorMap = ({ items }: IndoorMapProps) => {
  const [currentFloor, setCurrentFloor] = useState(0);
  const totalFloors = 3;

  const floorPlanImages = [
    '/floor-plans/floor-0.svg',
    '/floor-plans/floor-1.svg',
    '/floor-plans/floor-2.svg',
  ];

  // Filter items for current floor
  const currentFloorItems = items.filter(item => item.floor === currentFloor);

  return (
    <div className="relative w-full h-[600px] bg-gray-100 rounded-lg overflow-hidden">
      {/* Floor Plan Image */}
      <img
        src={floorPlanImages[currentFloor]}
        alt={`Floor ${currentFloor} Plan`}
        className="w-full h-full object-contain"
      />

      {/* Pins on the floor plan */}
      <div className="absolute inset-0">
        {currentFloorItems.map((item) => (
          <div
            key={item.id}
            className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer group"
            style={{
              left: `${item.map_x}%`,
              top: `${item.map_y}%`,
            }}
          >
            <MapPin className="w-6 h-6 text-red-500 drop-shadow-lg hover:scale-125 transition-transform" />
            
            {/* Tooltip on hover */}
            <div className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded shadow-lg whitespace-nowrap z-20">
              <p className="font-bold text-sm">{item.title}</p>
              <p className="text-xs text-gray-600">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Floor Selector */}
      <FloorSelector
        currentFloor={currentFloor}
        totalFloors={totalFloors}
        onFloorChange={setCurrentFloor}
      />

      {/* Floor Label */}
      <div className="absolute bottom-4 left-4 bg-white px-4 py-2 rounded shadow-lg">
        <p className="text-sm font-semibold">CSE Building - Floor {currentFloor}</p>
        <p className="text-xs text-gray-600">{currentFloorItems.length} items</p>
      </div>
    </div>
  );
};
