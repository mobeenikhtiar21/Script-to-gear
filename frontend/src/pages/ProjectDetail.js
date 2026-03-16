import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Sparkles, Package, CheckCircle2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ProjectDetail() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchProject();
  }, [projectId]);
  
  const fetchProject = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/projects/${projectId}`,
        { withCredentials: true }
      );
      setProject(response.data);
    } catch (error) {
      console.error('Failed to fetch project:', error);
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-[#0066FF]" data-testid="loading-spinner">Loading...</div>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-[#A1A1A1]">Project not found</div>
      </div>
    );
  }
  
  const analysis = project.ai_analysis_result;
  const hasError = analysis?.error;
  
  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Header */}
      <div className="bg-[#1A1A1A] border-b border-[#333333]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/filmmaker/dashboard')}
            className="text-[#A1A1A1] hover:text-white mb-2"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-white">Project Analysis</h1>
          <p className="text-[#A1A1A1] mt-2">
            {new Date(project.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Script */}
        <Card className="bg-[#1A1A1A] border-[#333333]">
          <CardHeader>
            <CardTitle className="text-white">Script</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-[#0F0F0F] border border-[#333333] rounded-lg p-4 font-mono text-sm text-[#A1A1A1] whitespace-pre-wrap max-h-96 overflow-y-auto">
              {project.script_text}
            </div>
          </CardContent>
        </Card>
        
        {hasError ? (
          <Card className="bg-[#1A1A1A] border-[#333333]">
            <CardContent className="py-12 text-center">
              <p className="text-[#EF4444] mb-2">AI Analysis Failed</p>
              <p className="text-[#A1A1A1] text-sm">{analysis.message}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Scene Analysis */}
            {analysis?.scene_analysis && analysis.scene_analysis.length > 0 && (
              <Card className="bg-[#1A1A1A] border-[#333333]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#0066FF]" />
                    Scene Analysis
                  </CardTitle>
                  <CardDescription className="text-[#A1A1A1]">
                    AI-identified scene types and requirements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysis.scene_analysis.map((scene, idx) => (
                      <div
                        key={idx}
                        className="bg-[#0F0F0F] border border-[#333333] rounded-lg p-4"
                        data-testid={`scene-${idx}`}
                      >
                        <div className="font-semibold text-white mb-2">{scene.scene_type}</div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-[#666666]">Lighting: </span>
                            <span className="text-[#A1A1A1]">{scene.lighting_conditions}</span>
                          </div>
                          <div>
                            <span className="text-[#666666]">Setting: </span>
                            <span className="text-[#A1A1A1]">{scene.setting}</span>
                          </div>
                        </div>
                        {scene.technical_requirements && (
                          <div className="mt-2 text-sm text-[#A1A1A1]">
                            {scene.technical_requirements}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Gear Recommendations */}
            {analysis?.gear_recommendations && analysis.gear_recommendations.length > 0 && (
              <Card className="bg-[#1A1A1A] border-[#333333]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#0066FF]" />
                    Recommended Gear
                  </CardTitle>
                  <CardDescription className="text-[#A1A1A1]">
                    AI-generated equipment list based on your script
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.gear_recommendations.map((gear, idx) => {
                      const categoryColors = {
                        camera: 'bg-blue-900/30 text-blue-400 border-blue-900/50',
                        lens: 'bg-purple-900/30 text-purple-400 border-purple-900/50',
                        audio: 'bg-green-900/30 text-green-400 border-green-900/50',
                        lighting: 'bg-yellow-900/30 text-yellow-400 border-yellow-900/50',
                        support: 'bg-orange-900/30 text-orange-400 border-orange-900/50'
                      };
                      
                      return (
                        <div
                          key={idx}
                          className="bg-[#0F0F0F] border border-[#333333] rounded-lg p-4"
                          data-testid={`gear-recommendation-${idx}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${categoryColors[gear.category] || 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                                  {gear.category}
                                </span>
                                <span className="text-white font-medium">{gear.item}</span>
                              </div>
                              <p className="text-sm text-[#A1A1A1]">{gear.rationale}</p>
                            </div>
                            <div className="ml-4 text-right">
                              <div className="text-[#0066FF] font-semibold">Qty: {gear.quantity}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Production Notes */}
            {analysis?.production_notes && (
              <Card className="bg-[#1A1A1A] border-[#333333]">
                <CardHeader>
                  <CardTitle className="text-white">Production Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[#A1A1A1]">{analysis.production_notes}</p>
                </CardContent>
              </Card>
            )}
            
            {/* Next Steps */}
            <Card className="bg-gradient-to-br from-[#0066FF]/10 to-[#0066FF]/5 border-[#0066FF]/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#0066FF]" />
                  Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#0066FF] text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <div className="text-white font-medium mb-1">Browse Available Gear</div>
                    <p className="text-sm text-[#A1A1A1]">Search rental house inventory to find gear matching your requirements</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#0066FF] text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <div className="text-white font-medium mb-1">Build Your Package</div>
                    <p className="text-sm text-[#A1A1A1]">Add items to your project package with desired quantities</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#0066FF] text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <div className="text-white font-medium mb-1">Request Quotes</div>
                    <p className="text-sm text-[#A1A1A1]">Select rental houses and request custom quotes</p>
                  </div>
                </div>
                
                <Button
                  onClick={() => navigate('/filmmaker/browse-gear')}
                  className="bg-[#0066FF] hover:bg-[#0052CC] text-white mt-4 w-full"
                  data-testid="browse-gear-cta"
                >
                  Browse Gear Inventory
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
