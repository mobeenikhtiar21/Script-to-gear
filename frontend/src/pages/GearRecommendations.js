import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import FilmmakerLayout from '@/components/FilmmakerLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Aperture, Mic, Sun, Sliders, CheckCircle, Minus, HelpCircle, ShoppingCart } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const categoryIcons = {
  camera: Camera,
  lens: Aperture,
  audio: Mic,
  lighting: Sun,
  support: Sliders
};

export default function GearRecommendations() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [gearItems, setGearItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedGear, setSelectedGear] = useState({});
  const [activeCategory, setActiveCategory] = useState('camera');
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    fetchData();
  }, [projectId]);
  
  const fetchData = async () => {
    try {
      const [projectRes, gearRes] = await Promise.all([
        axios.get(`${API_URL}/api/projects/${projectId}`, { withCredentials: true }),
        axios.get(`${API_URL}/api/gear`, { withCredentials: true })
      ]);
      
      setProject(projectRes.data);
      
      // Group gear by category
      const grouped = {};
      gearRes.data.forEach(item => {
        if (!grouped[item.category]) {
          grouped[item.category] = [];
        }
        grouped[item.category].push(item);
      });
      setGearItems(grouped);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load gear recommendations');
    } finally {
      setLoading(false);
    }
  };
  
  const getConfidenceScore = (gearItem, analysis) => {
    if (!analysis) return { level: 'estimated', label: 'Estimated', icon: HelpCircle, color: 'gray' };
    
    const category = gearItem.category;
    let score = 0;
    let maxScore = 0;
    
    // Camera matching
    if (category === 'camera') {
      maxScore = 3;
      // Low-light capability
      if (analysis.lighting_needs?.includes('low-light')) {
        const sensorSize = gearItem.specs?.sensor_size?.toLowerCase();
        if (sensorSize?.includes('full frame') || sensorSize?.includes('super 35')) {
          score += 2;
        }
      }
      // Movement requirements
      if (analysis.camera_movement?.includes('handheld')) {
        if (gearItem.specs?.weight && parseFloat(gearItem.specs.weight) < 5) {
          score += 1;
        }
      }
    }
    
    // Lens matching
    if (category === 'lens') {
      maxScore = 2;
      if (analysis.lighting_needs?.includes('low-light')) {
        const aperture = gearItem.specs?.aperture;
        if (aperture) {
          const fStop = parseFloat(aperture.replace('f/', '').replace('T', ''));
          if (fStop <= 2.8) score += 2;
          else if (fStop <= 4) score += 1;
        }
      }
    }
    
    // Audio matching
    if (category === 'audio') {
      maxScore = 2;
      if (analysis.audio_needs?.includes('dialogue-heavy')) {
        const model = gearItem.model?.toLowerCase();
        if (model?.includes('lav') || model?.includes('shotgun')) {
          score += 2;
        }
      }
    }
    
    // Lighting matching
    if (category === 'lighting') {
      maxScore = 2;
      if (analysis.lighting_needs?.includes('bright')) {
        if (gearItem.specs?.power && parseInt(gearItem.specs.power) > 1000) {
          score += 2;
        }
      }
    }
    
    // Calculate confidence level
    if (maxScore === 0) {
      return { level: 'estimated', label: 'Estimated', icon: HelpCircle, color: 'gray' };
    }
    
    const percentage = (score / maxScore) * 100;
    
    if (percentage >= 70) {
      return { level: 'high', label: 'High Match', icon: CheckCircle, color: 'green' };
    } else if (percentage >= 40) {
      return { level: 'medium', label: 'Medium Match', icon: Minus, color: 'yellow' };
    } else {
      return { level: 'estimated', label: 'Estimated', icon: HelpCircle, color: 'gray' };
    }
  };
  
  const toggleGearSelection = (gearItem) => {
    setSelectedGear(prev => {
      const key = gearItem.gear_id;
      if (prev[key]) {
        const { [key]: removed, ...rest } = prev;
        return rest;
      } else {
        return { ...prev, [key]: { ...gearItem, quantity: 1 } };
      }
    });
  };
  
  const getTotalCost = () => {
    return Object.values(selectedGear).reduce((sum, item) => sum + (item.daily_rate * item.quantity), 0);
  };
  
  const handleSaveProject = async () => {
    if (Object.keys(selectedGear).length === 0) {
      toast.error('Please select at least one gear item');
      return;
    }
    
    setSaving(true);
    try {
      // Save selected gear to project
      await Promise.all(
        Object.values(selectedGear).map(item =>
          axios.post(
            `${API_URL}/api/projects/${projectId}/gear`,
            { gear_item_id: item.gear_id, quantity: item.quantity },
            { withCredentials: true }
          )
        )
      );
      
      toast.success('Project saved successfully!');
      navigate(`/filmmaker/projects/${projectId}`);
    } catch (error) {
      console.error('Failed to save project:', error);
      toast.error('Failed to save project');
    } finally {
      setSaving(false);
    }
  };
  
  const handleGetQuote = async () => {
    if (Object.keys(selectedGear).length === 0) {
      toast.error('Please select at least one gear item');
      return;
    }
    
    // Save gear first, then navigate to rental house selection
    await handleSaveProject();
    navigate(`/filmmaker/projects/${projectId}/select-rental-house`);
  };
  
  if (loading) {
    return (
      <FilmmakerLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-[#800020]" data-testid="loading-spinner">Loading gear recommendations...</div>
        </div>
      </FilmmakerLayout>
    );
  }
  
  if (!project) {
    return (
      <FilmmakerLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-[#A1A1A1]">Project not found</div>
        </div>
      </FilmmakerLayout>
    );
  }
  
  const analysis = project.ai_analysis_result;
  const categories = ['camera', 'lens', 'audio', 'lighting', 'support'];
  
  // Count scene types for summary
  const sceneTypeCounts = {
    interior: analysis?.scene_types?.filter(t => t === 'interior').length || 0,
    exterior: analysis?.scene_types?.filter(t => t === 'exterior').length || 0,
    lowLight: analysis?.lighting_needs?.filter(n => n === 'low-light').length || 0
  };
  
  return (
    <FilmmakerLayout>
      <div className="p-8 max-w-7xl mx-auto pb-32">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Gear Recommendations</h1>
          <p className="text-[#A1A1A1]">AI-powered equipment matching based on your script analysis</p>
        </div>
        
        {/* Summary Card */}
        <Card className="bg-gradient-to-br from-[#800020]/10 to-[#800020]/5 border-[#800020]/30 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-white mb-4">
              <CheckCircle className="w-5 h-5 text-[#800020]" />
              <span className="font-semibold">Analysis Complete</span>
            </div>
            <div className="text-[#A1A1A1] text-sm">
              Detected: 
              {sceneTypeCounts.interior > 0 && <span className="ml-2 text-white font-medium">{sceneTypeCounts.interior} interior scene{sceneTypeCounts.interior !== 1 ? 's' : ''}</span>}
              {sceneTypeCounts.exterior > 0 && <span className="ml-2 text-white font-medium">{sceneTypeCounts.exterior} exterior scene{sceneTypeCounts.exterior !== 1 ? 's' : ''}</span>}
              {sceneTypeCounts.lowLight > 0 && <span className="ml-2 text-white font-medium">{sceneTypeCounts.lowLight} low-light requirement{sceneTypeCounts.lowLight !== 1 ? 's' : ''}</span>}
            </div>
          </CardContent>
        </Card>
        
        {/* Equipment Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="bg-[#0F0F0F] border border-[#2A2A2A] p-1 grid grid-cols-5 mb-6 sticky top-0 z-10">
            {categories.map(cat => {
              const Icon = categoryIcons[cat];
              const count = gearItems[cat]?.length || 0;
              return (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="data-[state=active]:bg-[#800020] data-[state=active]:text-white text-[#A1A1A1] capitalize"
                  data-testid={`tab-${cat}`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {cat} ({count})
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          {categories.map(category => (
            <TabsContent key={category} value={category} className="mt-0">
              {!gearItems[category] || gearItems[category].length === 0 ? (
                <Card className="bg-[#0F0F0F] border-[#2A2A2A]">
                  <CardContent className="py-16 text-center">
                    <p className="text-[#666666]">No {category} items available yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gearItems[category].map(item => {
                    const confidence = getConfidenceScore(item, analysis);
                    const ConfidenceIcon = confidence.icon;
                    const isSelected = !!selectedGear[item.gear_id];
                    
                    const confidenceColors = {
                      green: 'bg-green-900/30 text-green-400 border-green-900/50',
                      yellow: 'bg-yellow-900/30 text-yellow-400 border-yellow-900/50',
                      gray: 'bg-gray-800 text-gray-400 border-gray-700'
                    };
                    
                    return (
                      <Card
                        key={item.gear_id}
                        className={`bg-[#0F0F0F] border-[#2A2A2A] transition-all hover:border-[#800020]/50 ${
                          isSelected ? 'border-[#800020] shadow-[0_0_20px_rgba(128,0,32,0.2)]' : ''
                        }`}
                        data-testid={`gear-card-${item.gear_id}`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="text-xs text-[#666666] mb-1">{item.manufacturer}</div>
                              <CardTitle className="text-white text-base leading-tight">{item.model}</CardTitle>
                            </div>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleGearSelection(item)}
                              className="border-[#333333] data-[state=checked]:bg-[#800020] data-[state=checked]:border-[#800020]"
                              data-testid={`checkbox-${item.gear_id}`}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border flex items-center gap-1 ${confidenceColors[confidence.color]}`}>
                              <ConfidenceIcon className="w-3 h-3" />
                              {confidence.label}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {/* Key Specs */}
                          <div className="space-y-1 mb-4 text-xs">
                            {category === 'camera' && item.specs?.sensor_size && (
                              <div className="text-[#A1A1A1]">
                                <span className="text-[#666666]">Sensor:</span> {item.specs.sensor_size}
                              </div>
                            )}
                            {category === 'lens' && item.specs?.aperture && (
                              <div className="text-[#A1A1A1]">
                                <span className="text-[#666666]">Aperture:</span> {item.specs.aperture}
                              </div>
                            )}
                            {category === 'lens' && item.specs?.focal_length && (
                              <div className="text-[#A1A1A1]">
                                <span className="text-[#666666]">Focal Length:</span> {item.specs.focal_length}
                              </div>
                            )}
                            {item.specs?.weight && (
                              <div className="text-[#A1A1A1]">
                                <span className="text-[#666666]">Weight:</span> {item.specs.weight}
                              </div>
                            )}
                          </div>
                          
                          {/* Daily Rate */}
                          <div className="text-2xl font-bold text-[#800020]">
                            ${item.daily_rate.toFixed(2)}<span className="text-sm text-[#666666]">/day</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
      
      {/* Bottom Bar */}
      {Object.keys(selectedGear).length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0F0F0F] border-t border-[#2A2A2A] lg:ml-64" data-testid="bottom-bar">
          <div className="max-w-7xl mx-auto p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[#666666] text-sm mb-1">
                  {Object.keys(selectedGear).length} item{Object.keys(selectedGear).length !== 1 ? 's' : ''} selected
                </div>
                <div className="text-white text-2xl font-bold">
                  ${getTotalCost().toFixed(2)}<span className="text-sm text-[#666666]">/day</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSaveProject}
                  disabled={saving}
                  variant="outline"
                  className="bg-transparent border-[#333333] text-white hover:bg-[#1A1A1A]"
                  data-testid="save-project-button"
                >
                  Save Project
                </Button>
                <Button
                  onClick={handleGetQuote}
                  disabled={saving}
                  className="bg-[#800020] hover:bg-[#5C0A1F] text-white shadow-[0_0_20px_rgba(128,0,32,0.3)]"
                  data-testid="get-quote-button"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Get Quote
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </FilmmakerLayout>
  );
}