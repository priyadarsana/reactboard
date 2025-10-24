import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MapPin, Check, X, Trash2, ChevronUp, ChevronDown, Image as ImageIcon } from 'lucide-react';

interface PinLocation {
  x: number;
  y: number;
  floor: number;
  id: string;
}

interface ReportItemDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReportItemDialog = ({ open, onClose, onSuccess }: ReportItemDialogProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'electronics',
  });
  const [currentFloor, setCurrentFloor] = useState(0);
  const [pinLocations, setPinLocations] = useState<PinLocation[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const totalFloors = 3;
  const floorPlanImages = [
    '/floor-plans/floor-0.svg',
    '/floor-plans/floor-1.svg',
    '/floor-plans/floor-2.svg',
  ];

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setFormData({
        title: '',
        description: '',
        category: 'electronics',
      });
      setPinLocations([]);
      setCurrentFloor(0);
      setImageFile(null);
      setImagePreview(null);
    }
  }, [open]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('File must be an image');
      return;
    }

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('lost-items')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('lost-items')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
      return null;
    }
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newPin: PinLocation = {
      x,
      y,
      floor: currentFloor,
      id: Date.now().toString()
    };

    setPinLocations([...pinLocations, newPin]);
    toast.success(`Location added on Floor ${currentFloor}`);
  };

  const removePin = (pinId: string) => {
    setPinLocations(pinLocations.filter(pin => pin.id !== pinId));
    toast.info('Location removed');
  };

  const clearAllPins = () => {
    setPinLocations([]);
    toast.info('All locations cleared');
  };

  const handleFloorChange = (newFloor: number) => {
    if (newFloor >= 0 && newFloor < totalFloors) {
      setCurrentFloor(newFloor);
    }
  };

  const currentFloorPins = pinLocations.filter(pin => pin.floor === currentFloor);
  
  const pinsByFloor = pinLocations.reduce((acc, pin) => {
    acc[pin.floor] = (acc[pin.floor] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter an item title');
      return;
    }

    if (pinLocations.length === 0) {
      toast.error('Please add at least one location on the map');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        toast.error('Please log in to report an item');
        setIsSubmitting(false);
        return;
      }

      // Upload image if selected
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImage();
        if (imageFile && !imageUrl) {
          setIsSubmitting(false);
          return;
        }
      }

      // Determine primary floor
      const primaryFloor = Object.entries(pinsByFloor).reduce((a, b) => 
        b[1] > a[1] ? b : a
      )[0];

      // Insert new item with image_url
      const { data, error } = await (supabase
        .from('lost_items') as any)
        .insert([{
          reporter_id: userData.user.id,
          title: formData.title,
          description: formData.description || null,
          category: formData.category,
          floor: Number(primaryFloor),
          status: 'open',
          image_url: imageUrl, // Save image URL
        }])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      const itemId = data[0].id;

      // Insert all pins
      const pinsToInsert = pinLocations.map(pin => ({
        item_id: itemId,
        lat: pin.x,
        lng: pin.y,
        floor: pin.floor,
        created_by: userData.user.id,
      }));

      const { error: pinError } = await supabase
        .from('pins')
        .insert(pinsToInsert);

      if (pinError) {
        console.error('Pin error:', pinError);
        toast.warning('Item created but some location pins failed to save');
      } else {
        const floorCount = Object.keys(pinsByFloor).length;
        toast.success(
          `Item reported with ${pinLocations.length} location${pinLocations.length > 1 ? 's' : ''} ` +
          `across ${floorCount} floor${floorCount > 1 ? 's' : ''}!`
        );
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'electronics',
      });
      setPinLocations([]);
      setCurrentFloor(0);
      setImageFile(null);
      setImagePreview(null);

      onSuccess();
    } catch (error: any) {
      console.error('Error reporting item:', error);
      toast.error('Failed to report item: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      category: 'electronics',
    });
    setPinLocations([]);
    setCurrentFloor(0);
    setImageFile(null);
    setImagePreview(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Lost Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">Item Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g., Blue Water Bottle"
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Add details to help identify the item..."
                rows={3}
              />
            </div>

            {/* Image Upload */}
            <div className="col-span-2">
              <Label>Item Photo (Optional)</Label>
              <p className="text-xs text-gray-500 mb-2">
                Upload a photo to help others identify your item
              </p>
              <div className="mt-2">
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full max-w-xs h-40 object-cover rounded-lg border-2 border-gray-300"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <ImageIcon className="w-10 h-10 text-gray-400" />
                      <p className="text-sm text-gray-600 font-medium">
                        Click to upload photo
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG up to 5MB
                      </p>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-2">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="electronics">📱 Electronics</option>
                <option value="accessories">👜 Accessories</option>
                <option value="books">📚 Books</option>
                <option value="clothing">👕 Clothing</option>
                <option value="id_cards">🆔 ID Cards</option>
                <option value="other">📦 Other</option>
              </select>
            </div>
          </div>

          {/* Location Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Possible Locations (Multiple Floors) *
              </Label>
              {pinLocations.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearAllPins}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear All ({pinLocations.length})
                </Button>
              )}
            </div>
            
            <p className="text-xs text-gray-500 mb-2">
              Use floor arrows to switch between floors. Click on each floor map to mark possible locations.
            </p>

            {/* Pin Summary */}
            {Object.keys(pinsByFloor).length > 0 && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-semibold text-blue-800 mb-1">Locations Added:</p>
                <div className="flex gap-3 flex-wrap">
                  {Object.entries(pinsByFloor)
                    .sort((a, b) => Number(a[0]) - Number(b[0]))
                    .map(([floor, count]) => (
                      <div 
                        key={floor} 
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded cursor-pointer hover:bg-blue-100 transition-colors ${
                          currentFloor === Number(floor) ? 'bg-blue-200 font-bold' : ''
                        }`}
                        onClick={() => setCurrentFloor(Number(floor))}
                      >
                        <span className="font-semibold text-blue-700">Floor {floor}:</span>
                        <span className="text-blue-600">{count} location{count > 1 ? 's' : ''}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
              <div className="relative">
                {/* Floor Plan */}
                <div 
                  className="relative w-full h-96 cursor-crosshair bg-gray-100"
                  onClick={handleMapClick}
                >
                  <img
                    src={floorPlanImages[currentFloor]}
                    alt={`Floor ${currentFloor}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />

                  {/* Instruction Overlay */}
                  {currentFloorPins.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/5">
                      <div className="bg-white rounded-lg p-4 text-center shadow-lg">
                        <MapPin className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                        <p className="text-sm font-semibold text-gray-700">
                          Click to add locations on Floor {currentFloor}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Use arrows to switch floors →
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Pins */}
                  {currentFloorPins.map((pin) => {
                    const globalIndex = pinLocations.findIndex(p => p.id === pin.id) + 1;
                    return (
                      <div
                        key={pin.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 group"
                        style={{
                          left: `${pin.x}%`,
                          top: `${pin.y}%`,
                        }}
                      >
                        <div className="relative">
                          <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold shadow-xl border-4 border-white hover:scale-110 transition-transform">
                            {globalIndex}
                          </div>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removePin(pin.id);
                            }}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                          >
                            <X className="w-3 h-3 text-red-600" />
                          </button>
                          
                          <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-white px-2 py-1 rounded shadow-lg text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            Location {globalIndex} (Floor {pin.floor})
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Floor Selector */}
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-lg shadow-lg p-2 flex flex-col gap-2 z-20 border border-gray-200">
                  <Button
                    type="button"
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
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleFloorChange(currentFloor - 1)}
                    disabled={currentFloor <= 0}
                    className="h-8 w-8"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Status Bar */}
              <div className="bg-gray-100 px-4 py-2 border-t border-gray-200">
                {pinLocations.length > 0 ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-semibold">
                        {pinLocations.length} total location{pinLocations.length > 1 ? 's' : ''} • 
                        {currentFloorPins.length} on Floor {currentFloor}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Click map to add more
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center">
                    📍 Click on the map to add locations
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              type="submit" 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting || pinLocations.length === 0}
            >
              <MapPin className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Submitting...' : `Report Item with ${pinLocations.length || 0} Location${pinLocations.length !== 1 ? 's' : ''}`}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>

          {pinLocations.length === 0 && (
            <p className="text-xs text-center text-amber-600 bg-amber-50 py-2 rounded">
              ⚠️ Please add at least one location
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};
