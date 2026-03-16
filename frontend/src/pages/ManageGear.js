import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function ManageGear() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-[#121212]">
      <div className="bg-[#1A1A1A] border-b border-[#333333]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/rental-house/dashboard')}
            className="text-[#A1A1A1] hover:text-white mb-2"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-white">Manage Gear Inventory</h1>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-[#1A1A1A] border-[#333333]">
          <CardHeader>
            <CardTitle className="text-white">Gear Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[#A1A1A1]">Gear management interface coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}