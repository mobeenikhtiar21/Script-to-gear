import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import FilmmakerLayout from '@/components/FilmmakerLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Package, CheckCircle2, AlertCircle, Camera, Sun, Mic, Video, Wrench } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ProjectDetail() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
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
  
  const handleRetry = async () => {
    setRetrying(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/projects/${projectId}/retry-analysis`,
        {},
        { withCredentials: true }
      );
      
      if (response.data.status === 'completed') {
        toast.success('Analysis completed successfully!');
        fetchProject();
      } else {
        toast.error('Analysis failed. Please try again.');
      }
    } catch (error) {
      console.error('Failed to retry analysis:', error);
      toast.error('Failed to retry analysis');
    } finally {
      setRetrying(false);
    }
  };
  
  if (loading) {
    return (
      <FilmmakerLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-[#0066FF]" data-testid="loading-spinner">Loading...</div>
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
  const hasError = analysis?.error;
  const canRetry = analysis?.can_retry || false;
  
  return (
    <FilmmakerLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Project Analysis</h1>
          <p className="text-[#A1A1A1]">
            Created {new Date(project.created_at).toLocaleDateString()}
          </p>
        </div>
        
        {/* Script */}
        <Card className="bg-[#0F0F0F] border-[#2A2A2A]">
          <CardHeader>
            <CardTitle className="text-white">Script</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-[#121212] border border-[#333333] rounded-lg p-4 font-mono text-sm text-[#A1A1A1] whitespace-pre-wrap max-h-96 overflow-y-auto">
              {project.script_text}
            </div>
          </CardContent>
        </Card>
        
        {hasError ? (
          <Card className="bg-[#0F0F0F] border-[#2A2A2A]">
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-[#EF4444] mx-auto mb-4" />
              <p className="text-[#EF4444] mb-2 font-semibold">AI Analysis Failed</p>
              <p className="text-[#A1A1A1] text-sm mb-6">{analysis.error_message || 'Please try again'}</p>
              {canRetry && (
                <Button
                  onClick={handleRetry}
                  disabled={retrying}
                  className="bg-[#0066FF] hover:bg-[#0052CC] text-white"
                  data-testid="retry-button"
                >
                  {retrying ? 'Retrying...' : 'Retry Analysis'}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Production Requirements */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Scene Types */}
              {analysis?.scene_types && analysis.scene_types.length > 0 && (
                <Card className="bg-[#0F0F0F] border-[#2A2A2A]">
                  <CardHeader>
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <Camera className="w-4 h-4 text-[#0066FF]" />
                      Scene Types
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysis.scene_types.map((type, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-900/30 text-blue-400 border border-blue-900/50 rounded text-xs"
                          data-testid={`scene-type-${idx}`}
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Lighting Needs */}
              {analysis?.lighting_needs && analysis.lighting_needs.length > 0 && (
                <Card className="bg-[#0F0F0F] border-[#2A2A2A]">
                  <CardHeader>
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <Sun className="w-4 h-4 text-[#0066FF]" />
                      Lighting Needs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysis.lighting_needs.map((need, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-yellow-900/30 text-yellow-400 border border-yellow-900/50 rounded text-xs"
                          data-testid={`lighting-${idx}`}
                        >
                          {need}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Audio Needs */}
              {analysis?.audio_needs && analysis.audio_needs.length > 0 && (
                <Card className="bg-[#0F0F0F] border-[#2A2A2A]">
                  <CardHeader>
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <Mic className="w-4 h-4 text-[#0066FF]" />
                      Audio Needs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysis.audio_needs.map((need, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-green-900/30 text-green-400 border border-green-900/50 rounded text-xs"
                          data-testid={`audio-${idx}`}
                        >
                          {need}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Camera Movement */}
              {analysis?.camera_movement && analysis.camera_movement.length > 0 && (
                <Card className="bg-[#0F0F0F] border-[#2A2A2A]">
                  <CardHeader>
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <Video className="w-4 h-4 text-[#0066FF]" />
                      Camera Movement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysis.camera_movement.map((move, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-purple-900/30 text-purple-400 border border-purple-900/50 rounded text-xs"
                          data-testid={`movement-${idx}`}
                        >
                          {move}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Special Requirements */}
              {analysis?.special_reqs && analysis.special_reqs.length > 0 && (
                <Card className="bg-[#0F0F0F] border-[#2A2A2A]">
                  <CardHeader>
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-[#0066FF]" />
                      Special Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysis.special_reqs.map((req, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-orange-900/30 text-orange-400 border border-orange-900/50 rounded text-xs"
                          data-testid={`special-${idx}`}
                        >
                          {req}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Gear Recommendations */}
            {analysis?.gear_recommendations && analysis.gear_recommendations.length > 0 && (
              <Card className="bg-[#0F0F0F] border-[#2A2A2A]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#0066FF]" />
                    Recommended Gear
                  </CardTitle>
                  <CardDescription className="text-[#666666]">
                    AI-generated equipment list based on your script analysis
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
                          className="bg-[#121212] border border-[#333333] rounded-lg p-4 hover:border-[#0066FF]/30 transition-colors"
                          data-testid={`gear-${idx}`}
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
                            <div className="ml-4 text-right flex-shrink-0">
                              <div className="text-[#0066FF] font-semibold text-sm">Qty: {gear.quantity}</div>
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
              <Card className="bg-[#0F0F0F] border-[#2A2A2A]">
                <CardHeader>
                  <CardTitle className="text-white">Production Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[#A1A1A1] leading-relaxed">{analysis.production_notes}</p>
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
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#0066FF] text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <div className="text-white font-medium mb-1">Browse Available Gear</div>
                    <p className="text-sm text-[#A1A1A1]">Search rental house inventory for gear matching your requirements</p>
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
                  onClick={() => navigate(`/filmmaker/projects/${projectId}/gear`)}
                  className="bg-[#0066FF] hover:bg-[#0052CC] text-white mt-4 w-full"
                  data-testid="browse-gear-cta"
                >
                  Browse Recommended Gear
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </FilmmakerLayout>
  );
}
