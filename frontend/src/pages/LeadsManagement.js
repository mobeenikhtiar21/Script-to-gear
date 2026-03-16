import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import RentalHouseLayout from '@/components/RentalHouseLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Filter } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function LeadsManagement() {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchLeads();
  }, []);
  
  useEffect(() => {
    filterLeads();
  }, [leads, statusFilter]);
  
  const fetchLeads = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/leads`, { withCredentials: true });
      // Sort by newest first
      const sorted = response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setLeads(sorted);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };
  
  const filterLeads = () => {
    if (statusFilter === 'all') {
      setFilteredLeads(leads);
    } else {
      setFilteredLeads(leads.filter(lead => lead.status === statusFilter));
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
  
  const statusColors = {
    new: 'bg-blue-900/30 text-blue-400 border-blue-900/50',
    quoted: 'bg-yellow-900/30 text-yellow-400 border-yellow-900/50',
    accepted: 'bg-green-900/30 text-green-400 border-green-900/50',
    declined: 'bg-red-900/30 text-red-400 border-red-900/50'
  };
  
  const statusCounts = {
    all: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    quoted: leads.filter(l => l.status === 'quoted').length,
    accepted: leads.filter(l => l.status === 'accepted').length,
    declined: leads.filter(l => l.status === 'declined').length
  };
  
  return (
    <RentalHouseLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Lead Management</h1>
          <p className="text-[#A1A1A1]">Review and respond to quote requests</p>
        </div>
        
        {/* Filters */}
        <Card className="bg-[#0F0F0F] border-[#2A2A2A] mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#666666]" />
                <span className="text-[#666666] text-sm">Filter by status:</span>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 bg-[#121212] border-[#333333] text-white" data-testid="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#333333]">
                  <SelectItem value="all" className="text-white">All ({statusCounts.all})</SelectItem>
                  <SelectItem value="new" className="text-white">New ({statusCounts.new})</SelectItem>
                  <SelectItem value="quoted" className="text-white">Quoted ({statusCounts.quoted})</SelectItem>
                  <SelectItem value="accepted" className="text-white">Accepted ({statusCounts.accepted})</SelectItem>
                  <SelectItem value="declined" className="text-white">Declined ({statusCounts.declined})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        {/* Leads List */}
        {filteredLeads.length === 0 ? (
          <Card className="bg-[#0F0F0F] border-[#2A2A2A]" data-testid="no-leads">
            <CardContent className="py-16 text-center">
              <FileText className="w-16 h-16 text-[#333333] mx-auto mb-4" />
              <h3 className="text-white text-lg font-semibold mb-2">No leads found</h3>
              <p className="text-[#666666]">
                {statusFilter !== 'all' 
                  ? `No ${statusFilter} leads at the moment`
                  : 'No quote requests yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredLeads.map((lead) => (
              <Card
                key={lead.lead_id}
                className="bg-[#0F0F0F] border-[#2A2A2A] hover:border-[#800020]/50 cursor-pointer transition-all group"
                onClick={() => navigate(`/rental-house/leads/${lead.lead_id}`)}
                data-testid={`lead-${lead.lead_id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-semibold text-lg">Lead #{lead.lead_id}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[lead.status]}`}>
                          {lead.status}
                        </span>
                      </div>
                      <div className="text-sm text-[#666666] mb-1">
                        Project ID: {lead.project_id}
                      </div>
                      <div className="text-sm text-[#666666]">
                        Received: {new Date(lead.created_at).toLocaleDateString()} at {new Date(lead.created_at).toLocaleTimeString()}
                      </div>
                      {lead.quote_details && (
                        <div className="text-sm text-[#800020] mt-2">
                          Quote Total: ${lead.quote_details.total_amount?.toFixed(2) || '0.00'}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#800020] hover:bg-[#800020]/10 group-hover:bg-[#800020]/10"
                      data-testid={`view-${lead.lead_id}`}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RentalHouseLayout>
  );
}