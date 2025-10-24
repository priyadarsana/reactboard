import { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Plus, MapPin, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { ItemList } from '@/components/lostfound/ItemList';
import { MapView } from '@/components/lostfound/MapView';
import { ItemDetails } from '@/components/lostfound/ItemDetails';
import { ReportItemDialog } from '@/components/lostfound/ReportItemDialog';
import { useNavigate } from 'react-router-dom';

const LostFound = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);

  useEffect(() => {
    fetchItems();
    
    // Real-time subscription to track status changes
    const channel = supabase
      .channel('lost_items_changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'lost_items'
      }, () => {
        fetchItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (items.length > 0 && !selectedItemId) {
      setSelectedItemId(items[0].id);
    } else if (items.length === 0) {
      setSelectedItemId(null);
    } else if (selectedItemId && !items.find(item => item.id === selectedItemId)) {
      // If selected item was removed, select first item
      setSelectedItemId(items[0]?.id || null);
    }
  }, [items]);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('lost_items')
      .select(`
        *,
        pins(
          *,
          votes(vote_type)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      toast.error('Failed to load items');
      return;
    }

    console.log('Fetched items:', data);
    setItems(data || []);
  };

  // Only show active items
  const activeItems = items.filter(item => item.status === 'open');

  const selectedItem = items.find(item => item.id === selectedItemId);

  const handleReportSuccess = () => {
    setShowReportDialog(false);
    fetchItems();
    toast.success('Item reported successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              title="Back to Home"
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            {/* Title Section */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lost & Found</h1>
              <p className="text-sm text-gray-500">
                {activeItems.length} active {activeItems.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          
          <div>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowReportDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Report Item
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - FIXED LAYOUT */}
      <div className="flex h-[calc(100vh-180px)]">
        {/* Left Sidebar */}
        <div className="w-80 border-r border-gray-200 bg-white overflow-y-auto flex-shrink-0">
          <ItemList
            items={activeItems}
            selectedItemId={selectedItemId}
            onSelectItem={setSelectedItemId}
          />
        </div>

        {/* Right Side - Item Details + Map */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedItem ? (
            <>
              {/* Item Details - FIXED HEIGHT */}
              <div className="flex-shrink-0">
                <ItemDetails item={selectedItem} />
              </div>
              
              {/* Map View - TAKES REMAINING SPACE */}
              <div className="flex-1 relative overflow-y-auto">
                <MapView item={selectedItem} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-lg font-semibold mb-1">No item selected</p>
                <p className="text-sm">
                  {activeItems.length === 0 
                    ? '🎉 No active lost items! Everything has been found.'
                    : 'Select an item to view its location on the map'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Item Dialog */}
      <ReportItemDialog 
        open={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        onSuccess={handleReportSuccess}
      />
    </div>
  );
};

export default LostFound;
