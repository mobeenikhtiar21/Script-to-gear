import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RentalHouseLayout from '@/components/RentalHouseLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function PaymentsSuccess() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Automatically redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate('/rental-house/payments');
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [navigate]);
  
  return (
    <RentalHouseLayout>
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="bg-[#0F0F0F] border-[#2A2A2A] max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Stripe Connected!</h2>
            <p className="text-[#A1A1A1] mb-6">
              Your Stripe account has been connected successfully. You can now receive payments from filmmakers.
            </p>
            <Button
              onClick={() => navigate('/rental-house/payments')}
              className="bg-[#0066FF] hover:bg-[#0052CC] text-white w-full"
              data-testid="view-status-button"
            >
              View Payment Status
            </Button>
          </CardContent>
        </Card>
      </div>
    </RentalHouseLayout>
  );
}