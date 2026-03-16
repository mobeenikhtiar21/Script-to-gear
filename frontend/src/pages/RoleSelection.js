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
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#0A0A0A] border-[#2A2A2A]" data-testid="role-selection-card">
        <CardHeader className="text-center pb-4">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src="/logo.png" 
              alt="Script-to-Gear" 
              className="w-20 h-20 rounded-xl"
            />
          </div>
          <CardTitle className="text-2xl text-white uppercase tracking-wide">Select Your Role</CardTitle>
          <CardDescription className="text-[#808080] font-mono text-sm">
            Choose how you'll use Script-to-Gear
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setRole('filmmaker')}
                className={`w-full p-6 border text-left transition-all ${
                  role === 'filmmaker'
                    ? 'border-[#800020] bg-[#800020]/10'
                    : 'border-[#2A2A2A] bg-[#050505] hover:border-[#404040]'
                }`}
                data-testid="role-filmmaker-button"
              >
                <div className="text-base font-semibold text-white mb-1 uppercase tracking-wide">Filmmaker</div>
                <div className="text-sm text-[#808080]">
                  Find and rent professional cinema equipment
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setRole('rental_house')}
                className={`w-full p-6 border text-left transition-all ${
                  role === 'rental_house'
                    ? 'border-[#800020] bg-[#800020]/10'
                    : 'border-[#2A2A2A] bg-[#050505] hover:border-[#404040]'
                }`}
                data-testid="role-rental-house-button"
              >
                <div className="text-base font-semibold text-white mb-1 uppercase tracking-wide">Rental House</div>
                <div className="text-sm text-[#808080]">
                  List your gear and receive quote requests
                </div>
              </button>
            </div>
            
            {role && (
              <>
                <div>
                  <Label htmlFor="phone" className="text-[#808080] mb-1.5 block text-sm">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="bg-[#050505] border-[#2A2A2A] text-white font-mono"
                    data-testid="phone-input"
                  />
                </div>
                
                {role === 'rental_house' && (
                  <div>
                    <Label htmlFor="company" className="text-[#808080] mb-1.5 block text-sm">
                      Company Name *
                    </Label>
                    <Input
                      id="company"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Your rental company name"
                      required
                      className="bg-[#050505] border-[#2A2A2A] text-white"
                      data-testid="company-name-input"
                    />
                  </div>
                )}
              </>
            )}
            
            <Button
              type="submit"
              disabled={!role || loading}
              className="w-full bg-[#800020] hover:bg-[#5C0A1F] text-white shadow-[0_0_15px_rgba(128,0,32,0.3)] rounded-sm font-medium"
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