import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import RentalHouseLayout from '@/components/RentalHouseLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Package } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function InventoryManagement() {
  const [gear, setGear] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchGear();
  }, []);
  
  const fetchGear = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/gear`, { withCredentials: true });
      setGear(response.data);
    } catch (error) {
      console.error('Failed to fetch gear:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleAvailability = async (gearId, currentStatus) => {
    try {
      await axios.put(
        `${API_URL}/api/gear/${gearId}`,
        { available: !currentStatus },
        { withCredentials: true }
      );
      
      setGear(prev => prev.map(item =>
        item.gear_id === gearId ? { ...item, available: !currentStatus } : item
      ));
      
      toast.success('Availability updated');
    } catch (error) {
      console.error('Failed to update availability:', error);
      toast.error('Failed to update availability');
    }
  };
  
  const deleteGear = async (gearId) => {
    if (!confirm('Are you sure you want to delete this gear item?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/gear/${gearId}`, { withCredentials: true });
      setGear(prev => prev.filter(item => item.gear_id !== gearId));
      toast.success('Gear deleted successfully');
    } catch (error) {
      console.error('Failed to delete gear:', error);
      toast.error('Failed to delete gear');
    }
  };
  
  if (loading) {
    return (
      <RentalHouseLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-[#800020]" data-testid="loading-spinner">Loading...</div>
        </div>
      </RentalHouseLayout>
    );
  }
  
  return (
    <RentalHouseLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Inventory Management</h1>
            <p className="text-[#A1A1A1]">Manage your gear catalog</p>
          </div>
          <Button
            onClick={() => navigate('/rental-house/inventory/add')}
            className="bg-[#800020] hover:bg-[#5C0A1F] text-white shadow-[0_0_15px_rgba(128,0,32,0.3)]"
            data-testid="add-gear-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Gear
          </Button>
        </div>
        
        {gear.length === 0 ? (
          <Card className="bg-[#0F0F0F] border-[#2A2A2A]" data-testid="no-gear">
            <CardContent className="py-16 text-center">
              <Package className="w-16 h-16 text-[#333333] mx-auto mb-4" />
              <h3 className="text-white text-lg font-semibold mb-2">No gear added yet</h3>
              <p className="text-[#666666] mb-6">Start building your inventory</p>
              <Button
                onClick={() => navigate('/rental-house/inventory/add')}
                className="bg-[#800020] hover:bg-[#5C0A1F] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Gear
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-[#0F0F0F] border-[#2A2A2A]">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#2A2A2A] hover:bg-transparent">
                    <TableHead className="text-[#666666]">Manufacturer</TableHead>
                    <TableHead className="text-[#666666]">Model</TableHead>
                    <TableHead className="text-[#666666]">Category</TableHead>
                    <TableHead className="text-[#666666]">Daily Rate</TableHead>
                    <TableHead className="text-[#666666]">Available</TableHead>
                    <TableHead className="text-[#666666] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gear.map((item) => (
                    <TableRow
                      key={item.gear_id}
                      className="border-[#2A2A2A] hover:bg-[#1A1A1A] transition-colors"
                      data-testid={`gear-row-${item.gear_id}`}
                    >
                      <TableCell className="text-white font-medium">{item.manufacturer}</TableCell>
                      <TableCell className="text-[#A1A1A1]">{item.model}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-[#333333] text-[#A1A1A1] rounded text-xs capitalize">
                          {item.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-[#800020] font-semibold">${item.daily_rate}</TableCell>
                      <TableCell>
                        <Switch
                          checked={item.available}
                          onCheckedChange={() => toggleAvailability(item.gear_id, item.available)}
                          className="data-[state=checked]:bg-[#800020]"
                          data-testid={`availability-${item.gear_id}`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/rental-house/inventory/edit/${item.gear_id}`)}
                            className="text-[#A1A1A1] hover:text-white hover:bg-[#1A1A1A]"
                            data-testid={`edit-${item.gear_id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteGear(item.gear_id)}
                            className="text-[#EF4444] hover:text-[#DC2626] hover:bg-red-900/20"
                            data-testid={`delete-${item.gear_id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </RentalHouseLayout>
  );
}