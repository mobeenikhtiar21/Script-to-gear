import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <Card className="bg-[#1A1A1A] border-[#333333] max-w-md w-full">
        <CardHeader>
          <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <CardTitle className="text-white text-center text-2xl">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-[#A1A1A1] mb-6">
            Your payment has been processed successfully. The rental house will be notified.
          </p>
          <Button
            onClick={() => navigate('/filmmaker/dashboard')}
            className="bg-[#800020] hover:bg-[#5C0A1F] w-full"
            data-testid="return-dashboard-button"
          >
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}