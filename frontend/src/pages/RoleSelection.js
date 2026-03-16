import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function RoleSelection() {
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!role) {
      toast.error('Please select a role');
      return;
    }
    
    if (role === 'rental_house' && !companyName) {
      toast.error('Company name is required for rental houses');
      return;
    }
    
    setLoading(true);
    
    try {
      await axios.post(
        `${API_URL}/api/auth/select-role`,
        { role, phone, company_name: companyName },
        { withCredentials: true }
      );
      
      toast.success('Role selected successfully!');
      
      if (role === 'filmmaker') {
        navigate('/filmmaker/dashboard');
      } else {
        navigate('/rental-house/dashboard');
      }
    } catch (error) {
      console.error('Role selection error:', error);
      toast.error('Failed to select role');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#1A1A1A] border-[#333333]" data-testid="role-selection-card">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Select Your Role</CardTitle>
          <CardDescription className="text-[#A1A1A1]">
            Choose how you'll use Script-to-Gear
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setRole('filmmaker')}
                className={`w-full p-6 rounded-lg border-2 text-left transition-all ${
                  role === 'filmmaker'
                    ? 'border-[#0066FF] bg-[#0066FF]/10'
                    : 'border-[#333333] bg-[#0F0F0F] hover:border-[#444444]'
                }`}
                data-testid="role-filmmaker-button"
              >
                <div className="text-lg font-semibold text-white mb-1">Filmmaker</div>
                <div className="text-sm text-[#A1A1A1]">
                  Find and rent professional cinema equipment
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setRole('rental_house')}
                className={`w-full p-6 rounded-lg border-2 text-left transition-all ${
                  role === 'rental_house'
                    ? 'border-[#0066FF] bg-[#0066FF]/10'
                    : 'border-[#333333] bg-[#0F0F0F] hover:border-[#444444]'
                }`}
                data-testid="role-rental-house-button"
              >
                <div className="text-lg font-semibold text-white mb-1">Rental House</div>
                <div className="text-sm text-[#A1A1A1]">
                  List your gear and receive quote requests
                </div>
              </button>
            </div>
            
            {role && (
              <>
                <div>
                  <Label htmlFor="phone" className="text-[#A1A1A1] mb-1.5 block">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="bg-[#0F0F0F] border-[#333333] text-white"
                    data-testid="phone-input"
                  />
                </div>
                
                {role === 'rental_house' && (
                  <div>
                    <Label htmlFor="company" className="text-[#A1A1A1] mb-1.5 block">
                      Company Name *
                    </Label>
                    <Input
                      id="company"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Your rental company name"
                      required
                      className="bg-[#0F0F0F] border-[#333333] text-white"
                      data-testid="company-name-input"
                    />
                  </div>
                )}
              </>
            )}
            
            <Button
              type="submit"
              disabled={!role || loading}
              className="w-full bg-[#0066FF] hover:bg-[#0052CC] text-white shadow-[0_0_15px_rgba(0,102,255,0.3)]"
              data-testid="submit-role-button"
            >
              {loading ? 'Saving...' : 'Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}