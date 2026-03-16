import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Film, Package, FileText, Plus } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function RentalHouseDashboard() {
  const [user, setUser] = useState(null);
  const [gear, setGear] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      const [userRes, gearRes, leadsRes] = await Promise.all([
        axios.get(`${API_URL}/api/auth/me`, { withCredentials: true }),
        axios.get(`${API_URL}/api/gear`, { withCredentials: true }),
        axios.get(`${API_URL}/api/leads`, { withCredentials: true })
      ]);
      
      setUser(userRes.data);
      setGear(gearRes.data);
      setLeads(leadsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-[#0066FF]" data-testid="loading-spinner">Loading...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Header */}
      <div className="bg-[#1A1A1A] border-b border-[#333333]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Film className="w-8 h-8 text-[#0066FF]" />
              <div>
                <h1 className="text-2xl font-bold text-white">Script-to-Gear</h1>
                <p className="text-sm text-[#A1A1A1]">Rental House Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium text-white">{user?.company_name || user?.name}</div>
                <div className="text-xs text-[#A1A1A1]">{user?.email}</div>
              </div>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-[#A1A1A1] hover:text-white"
                data-testid="logout-button"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[#1A1A1A] border-[#333333]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#A1A1A1]">Total Gear</p>
                  <p className="text-3xl font-bold text-white mt-1">{gear.length}</p>
                </div>
                <Package className="w-8 h-8 text-[#0066FF]" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1A1A1A] border-[#333333]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#A1A1A1]">Quote Requests</p>
                  <p className="text-3xl font-bold text-white mt-1">{leads.length}</p>
                </div>
                <FileText className="w-8 h-8 text-[#0066FF]" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1A1A1A] border-[#333333]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#A1A1A1]">Active Quotes</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {leads.filter(l => l.status === 'quoted').length}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-[#22C55E]" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => navigate('/rental-house/gear')}
              className="bg-[#0066FF] hover:bg-[#0052CC] text-white p-6 h-auto justify-start shadow-[0_0_15px_rgba(0,102,255,0.3)]"
              data-testid="manage-gear-button"
            >
              <Plus className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Manage Gear Inventory</div>
                <div className="text-xs opacity-80">Add, edit, or remove gear</div>
              </div>
            </Button>
            
            <Button
              onClick={() => navigate('/rental-house/leads')}
              variant="secondary"
              className="bg-[#222222] hover:bg-[#333333] text-white p-6 h-auto justify-start border border-[#444444]"
              data-testid="view-leads-button"
            >
              <FileText className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">View Quote Requests</div>
                <div className="text-xs opacity-80">{leads.filter(l => l.status === 'new').length} new</div>
              </div>
            </Button>
          </div>
        </div>
        
        {/* Recent Gear */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Recent Gear</h2>
            <Button
              variant="ghost"
              onClick={() => navigate('/rental-house/gear')}
              className="text-[#0066FF] hover:text-[#0052CC]"
            >
              View All
            </Button>
          </div>
          
          {gear.length === 0 ? (
            <Card className="bg-[#1A1A1A] border-[#333333]" data-testid="no-gear-card">
              <CardContent className="py-12 text-center">
                <Package className="w-12 h-12 text-[#666666] mx-auto mb-4" />
                <p className="text-[#A1A1A1] mb-4">No gear added yet</p>
                <Button
                  onClick={() => navigate('/rental-house/gear')}
                  className="bg-[#0066FF] hover:bg-[#0052CC]"
                >
                  Add Your First Gear Item
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gear.slice(0, 6).map((item) => (
                <Card key={item.gear_id} className="bg-[#1A1A1A] border-[#333333]" data-testid={`gear-${item.gear_id}`}>
                  <CardHeader>
                    <CardTitle className="text-white text-lg">
                      {item.manufacturer} {item.model}
                    </CardTitle>
                    <div className="text-sm text-[#A1A1A1]">{item.category}</div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#0066FF]">
                      ${item.daily_rate}/day
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}