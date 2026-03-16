import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import FilmmakerLayout from '@/components/FilmmakerLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Clock, Check, X, Building2, DollarSign } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [rentalHouses, setRentalHouses] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchLeads();
  }, []);
  
  const fetchLeads = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/leads`, { withCredentials: true });
      setLeads(response.data);
      
      // Fetch rental house details for each lead
      const uniqueSupplierIds = [...new Set(response.data.map(l => l.supplier_id))];
      const rentalHouseData = {};
      
      await Promise.all(
        uniqueSupplierIds.map(async (supplierId) => {
          try {
            const res = await axios.get(`${API_URL}/api/users/${supplierId}`, { withCredentials: true });
            rentalHouseData[supplierId] = res.data;
          } catch (e) {
            console.error(`Failed to fetch rental house ${supplierId}`);
          }
        })
      );
      
      setRentalHouses(rentalHouseData);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      toast.error('Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <FilmmakerLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-[#0066FF]" data-testid="loading-spinner">Loading...</div>
        </div>
      </FilmmakerLayout>
    );
  }
  
  const statusConfig = {
    new: { 
      color: 'bg-gray-800 text-gray-400 border-gray-700', 
      label: 'Pending',
      icon: Clock,
      description: 'Waiting for quote'
    },
    quoted: { 
      color: 'bg-yellow-900/30 text-yellow-400 border-yellow-900/50', 
      label: 'Quote Ready',
      icon: DollarSign,
      description: 'Review and accept'
    },
    accepted: { 
      color: 'bg-green-900/30 text-green-400 border-green-900/50', 
      label: 'Accepted',
      icon: Check,
      description: 'Payment complete'
    },
    declined: { 
      color: 'bg-red-900/30 text-red-400 border-red-900/50', 
      label: 'Declined',
      icon: X,
      description: 'Quote declined'
    }
  };
  
  // Sort leads: quoted first, then new, then accepted, then declined
  const sortedLeads = [...leads].sort((a, b) => {
    const order = { quoted: 0, new: 1, accepted: 2, declined: 3 };
    return (order[a.status] ?? 4) - (order[b.status] ?? 4);
  });
  
  const pendingCount = leads.filter(l => l.status === 'quoted').length;
  
  return (
    <FilmmakerLayout>
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Quotes</h1>
          <p className="text-[#A1A1A1]">
            Manage your quote requests and rental bookings
          </p>
          {pendingCount > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 bg-yellow-900/20 border border-yellow-900/50 text-yellow-400 px-4 py-2 rounded-full text-sm">
              <DollarSign className="w-4 h-4" />
              {pendingCount} quote{pendingCount > 1 ? 's' : ''} ready to review
            </div>
          )}
        </div>
        
        {/* Leads List */}
        {sortedLeads.length === 0 ? (
          <Card className="bg-[#1A1A1A] border-[#333333]" data-testid="no-leads">
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 text-[#666666] mx-auto mb-4" />
              <h3 className="text-white text-lg font-medium mb-2">No Quotes Yet</h3>
              <p className="text-[#A1A1A1] mb-6">
                Browse gear and request quotes from rental houses to get started
              </p>
              <Button
                onClick={() => navigate('/filmmaker/browse-gear')}
                className="bg-[#0066FF] hover:bg-[#0052CC]"
                data-testid="browse-gear-button"
              >
                Browse Gear
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedLeads.map((lead) => {
              const status = statusConfig[lead.status] || statusConfig.new;
              const StatusIcon = status.icon;
              const rentalHouse = rentalHouses[lead.supplier_id];
              const quote = lead.quote_details;
              
              return (
                <Card
                  key={lead.lead_id}
                  className={`bg-[#1A1A1A] border-[#333333] hover:border-[#0066FF]/50 cursor-pointer transition-all ${
                    lead.status === 'quoted' ? 'ring-1 ring-yellow-900/50' : ''
                  }`}
                  onClick={() => navigate(`/filmmaker/leads/${lead.lead_id}`)}
                  data-testid={`lead-${lead.lead_id}`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            lead.status === 'quoted' ? 'bg-yellow-900/30' :
                            lead.status === 'accepted' ? 'bg-green-900/30' :
                            lead.status === 'declined' ? 'bg-red-900/30' : 'bg-[#2A2A2A]'
                          }`}>
                            <StatusIcon className={`w-5 h-5 ${
                              lead.status === 'quoted' ? 'text-yellow-400' :
                              lead.status === 'accepted' ? 'text-green-400' :
                              lead.status === 'declined' ? 'text-red-400' : 'text-[#666666]'
                            }`} />
                          </div>
                          <div>
                            <div className="text-white font-medium">
                              {rentalHouse?.company_name || rentalHouse?.name || 'Rental House'}
                            </div>
                            <div className="text-sm text-[#666666]">{status.description}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-3 text-sm text-[#A1A1A1]">
                          <span>Requested {new Date(lead.created_at).toLocaleDateString()}</span>
                          {quote && lead.status === 'quoted' && (
                            <span className="text-[#0066FF] font-semibold">
                              ${quote.total_amount?.toFixed(2)}/day
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                          {status.label}
                        </span>
                        <ArrowRight className="w-5 h-5 text-[#666666]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </FilmmakerLayout>
  );
}
