import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import FilmmakerLayout from '@/components/FilmmakerLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Clock, FileText } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function FilmmakerDashboard() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      const [userRes, projectsRes] = await Promise.all([
        axios.get(`${API_URL}/api/auth/me`, { withCredentials: true }),
        axios.get(`${API_URL}/api/projects`, { withCredentials: true })
      ]);
      
      setUser(userRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
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
  
  return (
    <FilmmakerLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.name?.split(' ')[0] || 'Filmmaker'}</h1>
          <p className="text-[#A1A1A1]">Analyze your scripts and discover the perfect gear for your production</p>
        </div>
        
        {/* New Analysis Card */}
        <Card 
          className="bg-gradient-to-br from-[#0066FF]/10 to-[#0066FF]/5 border-[#0066FF]/30 mb-8 cursor-pointer hover:border-[#0066FF]/50 transition-all group"
          onClick={() => navigate('/filmmaker/create-project')}
          data-testid="new-analysis-card"
        >
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#0066FF] rounded-lg flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(0,102,255,0.4)] transition-all">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">+ New Analysis</h3>
                  <p className="text-[#A1A1A1]">Analyze your script and get AI-powered gear recommendations</p>
                </div>
              </div>
              <Button
                className="bg-[#0066FF] hover:bg-[#0052CC] text-white shadow-[0_0_15px_rgba(0,102,255,0.3)]"
                data-testid="new-analysis-button"
              >
                Start Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Projects */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Recent Projects</h2>
            {projects.length > 0 && (
              <Button
                variant="ghost"
                onClick={() => navigate('/filmmaker/projects')}
                className="text-[#0066FF] hover:text-[#0052CC] hover:bg-[#0066FF]/10"
              >
                View All
              </Button>
            )}
          </div>
          
          {projects.length === 0 ? (
            <Card className="bg-[#0F0F0F] border-[#2A2A2A]" data-testid="no-projects-card">
              <CardContent className="py-16 text-center">
                <FileText className="w-16 h-16 text-[#333333] mx-auto mb-4" />
                <h3 className="text-white text-lg font-semibold mb-2">No projects yet</h3>
                <p className="text-[#666666] mb-6">Start by analyzing your first script</p>
                <Button
                  onClick={() => navigate('/filmmaker/create-project')}
                  className="bg-[#0066FF] hover:bg-[#0052CC] text-white"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create First Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {projects.slice(0, 5).map((project) => {
                const scriptPreview = project.script_text.substring(0, 50);
                const hasAnalysis = project.ai_analysis_result && !project.ai_analysis_result.error;
                
                return (
                  <Card
                    key={project.project_id}
                    className="bg-[#0F0F0F] border-[#2A2A2A] hover:border-[#0066FF]/50 transition-all group"
                    data-testid={`project-${project.project_id}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="text-white font-mono text-sm truncate">
                              {scriptPreview}...
                            </div>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border flex-shrink-0 ${
                              hasAnalysis
                                ? 'bg-green-900/30 text-green-400 border-green-900/50'
                                : 'bg-gray-800 text-gray-400 border-gray-700'
                            }`}>
                              {hasAnalysis ? 'Analyzed' : 'Draft'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-[#666666] text-sm">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(project.created_at).toLocaleDateString()}</span>
                            </div>
                            {hasAnalysis && project.ai_analysis_result.gear_recommendations && (
                              <div className="flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                <span>{project.ai_analysis_result.gear_recommendations.length} recommendations</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => navigate(`/filmmaker/projects/${project.project_id}`)}
                          variant="ghost"
                          size="sm"
                          className="text-[#0066FF] hover:bg-[#0066FF]/10 group-hover:bg-[#0066FF]/10"
                          data-testid={`view-project-${project.project_id}`}
                        >
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </FilmmakerLayout>
  );
}