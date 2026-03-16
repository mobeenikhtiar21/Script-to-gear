import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function BrowseGear() {
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
      toast.error('Failed to load gear');
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
  
  return (
    <div className="min-h-screen bg-[#121212]">
      <div className="bg-[#1A1A1A] border-b border-[#333333]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/filmmaker/dashboard')}
            className="text-[#A1A1A1] hover:text-white mb-2"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-white">Browse Gear</h1>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {gear.length === 0 ? (
          <Card className="bg-[#1A1A1A] border-[#333333]">
            <CardContent className="py-12 text-center">
              <p className="text-[#A1A1A1]">No gear available yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gear.map((item) => (
              <Card key={item.gear_id} className="bg-[#1A1A1A] border-[#333333]" data-testid={`gear-${item.gear_id}`}>
                <CardHeader>
                  <CardTitle className="text-white text-lg">
                    {item.manufacturer} {item.model}
                  </CardTitle>
                  <div className="text-sm text-[#A1A1A1]">{item.category}</div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#0066FF] mb-2">
                    ${item.daily_rate}/day
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}