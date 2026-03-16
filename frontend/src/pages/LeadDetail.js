import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

export default function LeadDetail() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-[#121212]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-[#1A1A1A] border-[#333333]">
          <CardHeader>
            <CardTitle className="text-white">Lead Detail</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[#A1A1A1] mb-4">Lead details coming soon...</p>
            <Button onClick={() => navigate(-1)} data-testid="back-button">Go Back</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}