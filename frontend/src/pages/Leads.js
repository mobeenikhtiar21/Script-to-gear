import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchLeads();
  }, []);
  
  const fetchLeads = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/leads`, { withCredentials: true });
      setLeads(response.data);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      toast.error('Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-[#0066FF]" data-testid="loading-spinner">Loading...</div>
      </div>
    );
  }
  
  const statusColors = {
    new: 'bg-gray-800 text-gray-400 border-gray-700',
    quoted: 'bg-yellow-900/30 text-yellow-400 border-yellow-900/50',
    accepted: 'bg-green-900/30 text-green-400 border-green-900/50',
    declined: 'bg-red-900/30 text-red-400 border-red-900/50'
  };
  
  return (
    <div className="min-h-screen bg-[#121212]">
      <div className="bg-[#1A1A1A] border-b border-[#333333]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-[#A1A1A1] hover:text-white mb-2"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-white">My Quotes</h1>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {leads.length === 0 ? (
          <Card className="bg-[#1A1A1A] border-[#333333]" data-testid="no-leads">
            <CardContent className="py-12 text-center">
              <p className="text-[#A1A1A1]">No quotes yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => (
              <Card
                key={lead.lead_id}
                className="bg-[#1A1A1A] border-[#333333] hover:border-[#0066FF]/50 cursor-pointer transition-all"
                onClick={() => navigate(`/filmmaker/leads/${lead.lead_id}`)}
                data-testid={`lead-${lead.lead_id}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Lead #{lead.lead_id}</CardTitle>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[lead.status]}`}>
                      {lead.status}
                    </span>
                  </div>
                  <div className="text-sm text-[#A1A1A1]">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}