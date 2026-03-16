import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import RentalHouseLayout from '@/components/RentalHouseLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, FileText, TrendingUp, Plus } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function RentalHouseDashboard() {
  const [stats, setStats] = useState({ gearCount: 0, newLeads: 0, pendingQuotes: 0 });
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      const [gearRes, leadsRes] = await Promise.all([
        axios.get(`${API_URL}/api/gear`, { withCredentials: true }),
        axios.get(`${API_URL}/api/leads`, { withCredentials: true })
      ]);
      
      setStats({
        gearCount: gearRes.data.length,
        newLeads: leadsRes.data.filter(l => l.status === 'new').length,
        pendingQuotes: leadsRes.data.filter(l => l.status === 'quoted').length
      });
      
      setRecentLeads(leadsRes.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <RentalHouseLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-[#0066FF]" data-testid="loading-spinner">Loading...</div>
        </div>
      </RentalHouseLayout>
    );
  }
  
  const statusColors = {
    new: 'bg-blue-900/30 text-blue-400 border-blue-900/50',
    quoted: 'bg-yellow-900/30 text-yellow-400 border-yellow-900/50',
    accepted: 'bg-green-900/30 text-green-400 border-green-900/50',
    declined: 'bg-red-900/30 text-red-400 border-red-900/50'
  };
  
  return (
    <RentalHouseLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-[#A1A1A1]">Manage your inventory and quote requests</p>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[#0F0F0F] border-[#2A2A2A] hover:border-[#0066FF]/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[#666666] text-sm">New Leads</div>
                <div className="w-10 h-10 bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-1">{stats.newLeads}</div>
              <div className="text-xs text-[#666666]">Awaiting your response</div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#0F0F0F] border-[#2A2A2A] hover:border-[#0066FF]/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[#666666] text-sm">Pending Quotes</div>
                <div className="w-10 h-10 bg-yellow-900/30 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-yellow-400" />
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-1">{stats.pendingQuotes}</div>
              <div className="text-xs text-[#666666]">Sent to filmmakers</div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#0F0F0F] border-[#2A2A2A] hover:border-[#0066FF]/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[#666666] text-sm">Total Gear Items</div>
                <div className="w-10 h-10 bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-green-400" />
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-1">{stats.gearCount}</div>
              <div className="text-xs text-[#666666]">In your inventory</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => navigate('/rental-house/inventory')}
              className="bg-[#0066FF] hover:bg-[#0052CC] text-white p-6 h-auto justify-start shadow-[0_0_15px_rgba(0,102,255,0.3)]"
              data-testid="manage-inventory-button"
            >
              <Plus className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Manage Inventory</div>
                <div className="text-xs opacity-80">Add or update gear items</div>
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
                <div className="font-semibold">View Lead Requests</div>
                <div className="text-xs opacity-80">{stats.newLeads} new</div>
              </div>
            </Button>
          </div>
        </div>
        
        {/* Recent Leads */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Recent Leads</h2>
            <Button
              variant="ghost"
              onClick={() => navigate('/rental-house/leads')}
              className="text-[#0066FF] hover:text-[#0052CC] hover:bg-[#0066FF]/10"
            >
              View All
            </Button>
          </div>
          
          {recentLeads.length === 0 ? (
            <Card className="bg-[#0F0F0F] border-[#2A2A2A]" data-testid="no-leads">
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-[#333333] mx-auto mb-4" />
                <p className="text-[#666666]">No quote requests yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentLeads.map((lead) => (
                <Card
                  key={lead.lead_id}
                  className="bg-[#0F0F0F] border-[#2A2A2A] hover:border-[#0066FF]/50 cursor-pointer transition-all"
                  onClick={() => navigate(`/rental-house/leads/${lead.lead_id}`)}
                  data-testid={`lead-${lead.lead_id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-white font-medium mb-1">Lead #{lead.lead_id}</div>
                        <div className="text-sm text-[#666666]">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[lead.status]}`}>
                        {lead.status}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </RentalHouseLayout>
  );
}