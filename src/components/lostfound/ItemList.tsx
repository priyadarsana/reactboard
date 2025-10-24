import { MapPin } from 'lucide-react';

interface ItemListProps {
  items: any[];
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
}

export const ItemList = ({ items, selectedItemId, onSelectItem }: ItemListProps) => {
  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">Items</h2>
        <p className="text-sm text-gray-500">Click an item to view its location</p>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const isSelected = selectedItemId === item.id;
          const pinCount = item.pins?.length || 0;

          return (
            <div
              key={item.id}
              onClick={() => onSelectItem(item.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm text-gray-900">{item.title}</h3>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <MapPin className="w-3 h-3" />
                  <span>{pinCount}</span>
                </div>
              </div>

              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                {item.description}
              </p>

              <div className="flex gap-2 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  {item.category}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  Floor {item.floor ?? '?'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
