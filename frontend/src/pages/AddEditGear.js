import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import RentalHouseLayout from '@/components/RentalHouseLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const categoryFields = {
  camera: [
    { name: 'mount_type', label: 'Mount Type', placeholder: 'e.g., EF, PL, E-mount' },
    { name: 'sensor_size', label: 'Sensor Size', placeholder: 'e.g., Full Frame, Super 35' }
  ],
  lens: [
    { name: 'mount_type', label: 'Mount Type', placeholder: 'e.g., EF, PL, E-mount' },
    { name: 'focal_length', label: 'Focal Length', placeholder: 'e.g., 24-70mm, 50mm' },
    { name: 'aperture', label: 'Aperture', placeholder: 'e.g., f/2.8, T1.5' }
  ],
  audio: [
    { name: 'input_types', label: 'Input Types', placeholder: 'e.g., XLR, 3.5mm' },
    { name: 'wireless', label: 'Wireless Capability', placeholder: 'e.g., Yes, No' }
  ],
  lighting: [
    { name: 'output', label: 'Output', placeholder: 'e.g., 1000W, 2000W' },
    { name: 'color_temp', label: 'Color Temperature Range', placeholder: 'e.g., 3200K-5600K' }
  ],
  support: [
    { name: 'weight_capacity', label: 'Weight Capacity', placeholder: 'e.g., 15kg, 30lbs' }
  ]
};

export default function AddEditGear() {
  const { gearId } = useParams();
  const navigate = useNavigate();
  const isEdit = !!gearId;
  
  const [formData, setFormData] = useState({
    category: '',
    manufacturer: '',
    model: '',
    daily_rate: '',
    available: true,
    specs: {}
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  
  useEffect(() => {
    if (isEdit) {
      fetchGear();
    }
  }, [gearId]);
  
  const fetchGear = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/gear/${gearId}`, { withCredentials: true });
      setFormData({
        category: response.data.category,
        manufacturer: response.data.manufacturer,
        model: response.data.model,
        daily_rate: response.data.daily_rate.toString(),
        available: response.data.available,
        specs: response.data.specs || {}
      });
    } catch (error) {
      console.error('Failed to fetch gear:', error);
      toast.error('Failed to load gear');
    } finally {
      setLoading(false);
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.manufacturer) newErrors.manufacturer = 'Manufacturer is required';
    if (!formData.model) newErrors.model = 'Model is required';
    if (!formData.daily_rate || parseFloat(formData.daily_rate) <= 0) {
      newErrors.daily_rate = 'Valid daily rate is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors');
      return;
    }
    
    setSaving(true);
    
    try {
      const payload = {
        ...formData,
        daily_rate: parseFloat(formData.daily_rate)
      };
      
      if (isEdit) {
        await axios.put(`${API_URL}/api/gear/${gearId}`, payload, { withCredentials: true });
        toast.success('Gear updated successfully');
      } else {
        await axios.post(`${API_URL}/api/gear`, payload, { withCredentials: true });
        toast.success('Gear added successfully');
      }
      
      navigate('/rental-house/inventory');
    } catch (error) {
      console.error('Failed to save gear:', error);
      toast.error('Failed to save gear');
    } finally {
      setSaving(false);
    }
  };
  
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };
  
  const updateSpec = (specName, value) => {
    setFormData(prev => ({
      ...prev,
      specs: { ...prev.specs, [specName]: value }
    }));
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
          <Button
            variant="ghost"
            onClick={() => navigate('/rental-house/inventory')}
            className="text-[#A1A1A1] hover:text-white mb-4"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Inventory
          </Button>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isEdit ? 'Edit Gear' : 'Add New Gear'}
          </h1>
          <p className="text-[#A1A1A1]">Fill in the details below</p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="bg-[#0F0F0F] border-[#2A2A2A] mb-6">
            <CardHeader>
              <CardTitle className="text-white">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Category */}
              <div>
                <Label htmlFor="category" className="text-[#A1A1A1] mb-2 block">
                  Category *
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => updateField('category', value)}
                  disabled={isEdit}
                >
                  <SelectTrigger
                    className="bg-[#121212] border-[#333333] text-white"
                    data-testid="category-select"
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-[#333333]">
                    <SelectItem value="camera" className="text-white">Camera</SelectItem>
                    <SelectItem value="lens" className="text-white">Lens</SelectItem>
                    <SelectItem value="audio" className="text-white">Audio</SelectItem>
                    <SelectItem value="lighting" className="text-white">Lighting</SelectItem>
                    <SelectItem value="support" className="text-white">Support</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-[#EF4444] text-sm mt-1">{errors.category}</p>
                )}
              </div>
              
              {/* Manufacturer */}
              <div>
                <Label htmlFor="manufacturer" className="text-[#A1A1A1] mb-2 block">
                  Manufacturer *
                </Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => updateField('manufacturer', e.target.value)}
                  placeholder="e.g., ARRI, RED, Sony"
                  className="bg-[#121212] border-[#333333] text-white"
                  data-testid="manufacturer-input"
                />
                {errors.manufacturer && (
                  <p className="text-[#EF4444] text-sm mt-1">{errors.manufacturer}</p>
                )}
              </div>
              
              {/* Model */}
              <div>
                <Label htmlFor="model" className="text-[#A1A1A1] mb-2 block">
                  Model *
                </Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => updateField('model', e.target.value)}
                  placeholder="e.g., Alexa Mini LF, Komodo 6K"
                  className="bg-[#121212] border-[#333333] text-white"
                  data-testid="model-input"
                />
                {errors.model && (
                  <p className="text-[#EF4444] text-sm mt-1">{errors.model}</p>
                )}
              </div>
              
              {/* Daily Rate */}
              <div>
                <Label htmlFor="daily_rate" className="text-[#A1A1A1] mb-2 block">
                  Daily Rate ($) *
                </Label>
                <Input
                  id="daily_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.daily_rate}
                  onChange={(e) => updateField('daily_rate', e.target.value)}
                  placeholder="e.g., 150.00"
                  className="bg-[#121212] border-[#333333] text-white"
                  data-testid="daily-rate-input"
                />
                {errors.daily_rate && (
                  <p className="text-[#EF4444] text-sm mt-1">{errors.daily_rate}</p>
                )}
              </div>
              
              {/* Availability */}
              <div className="flex items-center gap-3">
                <Checkbox
                  id="available"
                  checked={formData.available}
                  onCheckedChange={(checked) => updateField('available', checked)}
                  className="border-[#333333] data-[state=checked]:bg-[#800020]"
                  data-testid="available-checkbox"
                />
                <Label htmlFor="available" className="text-[#A1A1A1] cursor-pointer">
                  Available for rental
                </Label>
              </div>
            </CardContent>
          </Card>
          
          {/* Category-Specific Fields */}
          {formData.category && categoryFields[formData.category] && (
            <Card className="bg-[#0F0F0F] border-[#2A2A2A] mb-6">
              <CardHeader>
                <CardTitle className="text-white capitalize">{formData.category} Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {categoryFields[formData.category].map((field) => (
                  <div key={field.name}>
                    <Label htmlFor={field.name} className="text-[#A1A1A1] mb-2 block">
                      {field.label}
                    </Label>
                    <Input
                      id={field.name}
                      value={formData.specs[field.name] || ''}
                      onChange={(e) => updateSpec(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      className="bg-[#121212] border-[#333333] text-white"
                      data-testid={`spec-${field.name}`}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          
          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#800020] hover:bg-[#5C0A1F] text-white shadow-[0_0_15px_rgba(128,0,32,0.3)]"
              data-testid="save-button"
            >
              {saving ? (
                'Saving...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEdit ? 'Update Gear' : 'Add Gear'}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/rental-house/inventory')}
              className="text-[#A1A1A1] hover:text-white"
              data-testid="cancel-button"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </RentalHouseLayout>
  );
}