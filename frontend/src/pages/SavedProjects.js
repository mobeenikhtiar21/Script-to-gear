import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import FilmmakerLayout from '@/components/FilmmakerLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Sparkles, FileText } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function SavedProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchProjects();
  }, []);
  
  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/projects`, { withCredentials: true });
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <FilmmakerLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-[#800020]" data-testid="loading-spinner">Loading...</div>
        </div>
      </FilmmakerLayout>
    );
  }
  
  return (
    <FilmmakerLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Saved Projects</h1>
          <p className="text-[#A1A1A1]">All your script analyses and gear recommendations</p>
        </div>
        
        {projects.length === 0 ? (
          <Card className="bg-[#0F0F0F] border-[#2A2A2A]" data-testid="no-projects">
            <CardContent className="py-16 text-center">
              <FileText className="w-16 h-16 text-[#333333] mx-auto mb-4" />
              <h3 className="text-white text-lg font-semibold mb-2">No saved projects</h3>
              <p className="text-[#666666] mb-6">Start by creating your first project</p>
              <Button
                onClick={() => navigate('/filmmaker/create-project')}
                className="bg-[#800020] hover:bg-[#5C0A1F] text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {projects.map((project) => {
              const scriptPreview = project.script_text.substring(0, 100);
              const hasAnalysis = project.ai_analysis_result && !project.ai_analysis_result.error;
              
              return (
                <Card
                  key={project.project_id}
                  className="bg-[#0F0F0F] border-[#2A2A2A] hover:border-[#800020]/50 transition-all group cursor-pointer"
                  onClick={() => navigate(`/filmmaker/projects/${project.project_id}`)}
                  data-testid={`project-${project.project_id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border flex-shrink-0 ${
                            hasAnalysis
                              ? 'bg-green-900/30 text-green-400 border-green-900/50'
                              : 'bg-gray-800 text-gray-400 border-gray-700'
                          }`}>
                            {hasAnalysis ? 'Analyzed' : 'Draft'}
                          </span>
                          <div className="flex items-center gap-1 text-[#666666] text-sm">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(project.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="text-white font-mono text-sm mb-2 line-clamp-2">
                          {scriptPreview}...
                        </div>
                        {hasAnalysis && project.ai_analysis_result.gear_recommendations && (
                          <div className="flex items-center gap-1 text-[#666666] text-sm">
                            <Sparkles className="w-3 h-3 text-[#800020]" />
                            <span className="text-[#A1A1A1]">
                              {project.ai_analysis_result.gear_recommendations.length} gear recommendations
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#800020] hover:bg-[#800020]/10 group-hover:bg-[#800020]/10 flex-shrink-0"
                        data-testid={`view-${project.project_id}`}
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
    </FilmmakerLayout>
  );
}