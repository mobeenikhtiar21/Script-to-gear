import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User, Building2, Phone, Mail, Save, Camera } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    company_name: ''
  });
  const [hasChanges, setHasChanges] = useState(false);
  
  useEffect(() => {
    fetchUser();
  }, []);
  
  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, { withCredentials: true });
      setUser(response.data);
      setFormData({
        name: response.data.name || '',
        phone: response.data.phone || '',
        company_name: response.data.company_name || ''
      });
    } catch (error) {
      console.error('Failed to fetch user:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };
  
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    
    setSaving(true);
    try {
      const updateData = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || null
      };
      
      if (user.role === 'rental_house') {
        updateData.company_name = formData.company_name.trim() || null;
      }
      
      const response = await axios.put(
        `${API_URL}/api/users/profile`,
        updateData,
        { withCredentials: true }
      );
      
      setUser(response.data);
      setHasChanges(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };
  
  const handleBack = () => {
    if (user?.role === 'filmmaker') {
      navigate('/filmmaker/dashboard');
    } else if (user?.role === 'rental_house') {
      navigate('/rental-house/dashboard');
    } else {
      navigate(-1);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="text-[#0066FF] font-mono" data-testid="loading-spinner">Loading...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#000000]">
      {/* Header */}
      <div className="bg-[#050505] border-b border-[#2A2A2A]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-[#808080] hover:text-white mb-4"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-white uppercase tracking-wide">My Profile</h1>
          <p className="text-[#808080] mt-1 font-mono text-sm">Manage your account information</p>
        </div>
      </div>
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Profile Picture & Role */}
          <Card className="bg-[#0A0A0A] border-[#2A2A2A]">
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  {user?.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="w-20 h-20 rounded-lg object-cover border border-[#2A2A2A]"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-[#0066FF]/20 flex items-center justify-center border border-[#2A2A2A]">
                      <User className="w-8 h-8 text-[#0066FF]" />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{user?.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2.5 py-0.5 text-xs font-mono uppercase tracking-wider ${
                      user?.role === 'filmmaker' 
                        ? 'bg-blue-900/30 text-blue-400 border border-blue-900/50' 
                        : 'bg-purple-900/30 text-purple-400 border border-purple-900/50'
                    }`}>
                      {user?.role === 'filmmaker' ? 'Filmmaker' : 'Rental House'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Profile Form */}
          <Card className="bg-[#0A0A0A] border-[#2A2A2A]">
            <CardHeader>
              <CardTitle className="text-white uppercase tracking-wide text-base">Account Details</CardTitle>
              <CardDescription className="text-[#666666] font-mono text-sm">
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#808080] flex items-center gap-2 text-sm">
                  <User className="w-4 h-4" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Your full name"
                  className="bg-[#050505] border-[#2A2A2A] text-white focus:border-[#0066FF]"
                  data-testid="name-input"
                />
              </div>
              
              {/* Email (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#808080] flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-[#030303] border-[#1A1A1A] text-[#666666] cursor-not-allowed font-mono"
                  data-testid="email-input"
                />
                <p className="text-xs text-[#666666] font-mono">Email cannot be changed</p>
              </div>
              
              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[#808080] flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="bg-[#050505] border-[#2A2A2A] text-white focus:border-[#0066FF] font-mono"
                  data-testid="phone-input"
                />
              </div>
              
              {/* Company Name (Rental Houses Only) */}
              {user?.role === 'rental_house' && (
                <div className="space-y-2">
                  <Label htmlFor="company_name" className="text-[#808080] flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4" />
                    Company Name
                  </Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    placeholder="Your rental company name"
                    className="bg-[#050505] border-[#2A2A2A] text-white focus:border-[#0066FF]"
                    data-testid="company-name-input"
                  />
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={`${
                hasChanges 
                  ? 'bg-[#0066FF] hover:bg-[#0052CC] shadow-[0_0_15px_rgba(0,102,255,0.3)]' 
                  : 'bg-[#2A2A2A] cursor-not-allowed'
              } text-white px-6 rounded-sm font-medium`}
              data-testid="save-button"
            >
              {saving ? (
                'Saving...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
          
          {/* Account Info */}
          <Card className="bg-[#050505] border-[#2A2A2A]">
            <CardContent className="py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#666666]">Member since</span>
                <span className="text-[#808080] font-mono">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
