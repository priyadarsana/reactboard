import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, ZoomIn, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ItemDetailsProps {
  item: any;
}

export const ItemDetails = ({ item }: ItemDetailsProps) => {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const pinCount = item.pins?.length || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'returned': return 'bg-green-100 text-green-800 border-green-300';
      case 'matched': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'returned': return '✅ Found & Returned';
      case 'matched': return '🔄 In Progress';
      default: return '🔍 Searching';
    }
  };

  return (
    <>
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-start gap-4">
          {/* Image Section - Clickable to open full view */}
          {item.image_url && (
            <div className="flex-shrink-0">
              <div 
                className="relative w-32 h-32 rounded-lg border-2 border-gray-200 shadow-sm overflow-hidden cursor-pointer group"
                onClick={() => setImageDialogOpen(true)}
              >
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {/* Zoom overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                  <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <p className="text-xs text-center text-gray-500 mt-1">Click to enlarge</p>
            </div>
          )}

          {/* Content Section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">{item.title}</h2>
                <p className="text-sm text-gray-600 mb-3">{item.description}</p>
              </div>
              
              <Badge className={`${getStatusColor(item.status)} border ml-2`}>
                {getStatusText(item.status)}
              </Badge>
            </div>
            
            <div className="flex gap-2 items-center flex-wrap">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                {item.category}
              </Badge>
              <Badge variant="outline">🏢 Floor {item.floor ?? 'Unknown'}</Badge>
              <Badge variant="outline">
                <MapPin className="w-3 h-3 mr-1" />
                {pinCount} suggested {pinCount === 1 ? 'location' : 'locations'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {new Date(item.created_at).toLocaleDateString()}
              </Badge>
            </div>

            {/* Status messages */}
            {item.status === 'returned' && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-semibold">
                  ✅ This item has been found and returned to its owner!
                </p>
              </div>
            )}

            {item.status === 'matched' && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-semibold">
                  🔄 Item is being returned to the owner
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Size Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-4xl w-full p-0">
          <div className="relative">
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full max-h-[80vh] object-contain bg-black"
            />
            <button
              onClick={() => setImageDialogOpen(false)}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-white font-bold text-lg">{item.title}</p>
              {item.description && (
                <p className="text-white/90 text-sm">{item.description}</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
