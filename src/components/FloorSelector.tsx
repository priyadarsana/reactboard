import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloorSelectorProps {
  currentFloor: number;
  totalFloors: number;
  onFloorChange: (floor: number) => void;
}

export const FloorSelector = ({ currentFloor, totalFloors, onFloorChange }: FloorSelectorProps) => {
  return (
    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-lg shadow-lg p-2 flex flex-col gap-2 z-10">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onFloorChange(Math.min(currentFloor + 1, totalFloors - 1))}
        disabled={currentFloor >= totalFloors - 1}
      >
        <ChevronUp className="w-4 h-4" />
      </Button>
      
      <div className="text-center font-bold py-2">
        Floor {currentFloor}
      </div>
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => onFloorChange(Math.max(currentFloor - 1, 0))}
        disabled={currentFloor <= 0}
      >
        <ChevronDown className="w-4 h-4" />
      </Button>
    </div>
  );
};
