import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import RentalHouseLayout from '@/components/RentalHouseLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, CreditCard, Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function PaymentsSetup() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    checkStatus();
  }, []);
  
  const checkStatus = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/stripe/connect/status`,
        { withCredentials: true }
      );
      setStatus(response.data);
    } catch (error) {
      console.error('Failed to check Stripe status:', error);
      toast.error('Failed to load payment status');
    } finally {
      setLoading(false);
    }
  };
  
  const handleConnect = async () => {
    setConnecting(true);
    
    try {
      const origin = window.location.origin;
      const response = await axios.post(
        `${API_URL}/api/stripe/connect/onboard`,
        {
          return_url: `${origin}/rental-house/payments/success`,
          refresh_url: `${origin}/rental-house/payments`
        },
        { withCredentials: true }
      );
      
      // Redirect to Stripe onboarding
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Failed to connect Stripe:', error);
      toast.error('Failed to connect Stripe');
      setConnecting(false);
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
  
  return (
    <RentalHouseLayout>
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Payment Setup</h1>
          <p className="text-[#A1A1A1]">Connect Stripe to receive payments from filmmakers</p>
        </div>
        
        {/* Status Card */}
        {status?.onboarding_complete ? (
          <Card className="bg-gradient-to-br from-green-900/30 to-green-900/10 border-green-900/50">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white text-xl font-semibold mb-2">Stripe Connected</h3>
                  <p className="text-green-300 mb-4">
                    Your Stripe account is connected and ready to receive payments.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-[#A1A1A1]">Charges enabled</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-[#A1A1A1]">Details submitted</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-[#A1A1A1]">Account ID: {status.account_id}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-[#0F0F0F] border-[#2A2A2A]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-[#800020]" />
                Connect Stripe Account
              </CardTitle>
              <CardDescription className="text-[#A1A1A1]">
                Set up Stripe to accept payments and receive automatic payouts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {status?.connected && !status.onboarding_complete && (
                <div className="bg-yellow-900/20 border border-yellow-900/50 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-300">
                    Your Stripe onboarding is incomplete. Please complete the setup to receive payments.
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <h4 className="text-white font-semibold">What you'll need:</h4>
                <ul className="space-y-2 text-[#A1A1A1] text-sm">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-[#800020] rounded-full mt-1.5 flex-shrink-0" />
                    <span>Business information and tax ID</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-[#800020] rounded-full mt-1.5 flex-shrink-0" />
                    <span>Bank account details for payouts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-[#800020] rounded-full mt-1.5 flex-shrink-0" />
                    <span>ID verification (driver's license or passport)</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-white font-semibold">Platform fees:</h4>
                <div className="bg-[#121212] border border-[#333333] rounded-lg p-4">
                  <div className="text-[#A1A1A1] text-sm mb-2">
                    Script-to-Gear charges a 10% platform fee on all transactions.
                  </div>
                  <div className="text-[#666666] text-xs">
                    Example: $1,000 booking → You receive $900 (after 10% platform fee)
                  </div>
                </div>
              </div>
              
              <Button
                onClick={handleConnect}
                disabled={connecting}
                className="w-full bg-[#800020] hover:bg-[#5C0A1F] text-white py-6 text-lg shadow-[0_0_20px_rgba(128,0,32,0.3)]"
                data-testid="connect-stripe-button"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    {status?.connected ? 'Complete Stripe Setup' : 'Connect Stripe Account'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card className="bg-[#0F0F0F] border-[#2A2A2A]">
            <CardHeader>
              <CardTitle className="text-white text-lg">Secure Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#A1A1A1] text-sm">
                All payments are processed securely through Stripe. We never store credit card information.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-[#0F0F0F] border-[#2A2A2A]">
            <CardHeader>
              <CardTitle className="text-white text-lg">Automatic Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#A1A1A1] text-sm">
                Funds are automatically transferred to your bank account based on your Stripe payout schedule.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </RentalHouseLayout>
  );
}