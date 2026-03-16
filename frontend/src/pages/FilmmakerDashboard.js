import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Film, Plus, FileText, Package } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function FilmmakerDashboard() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      const [userRes, projectsRes, leadsRes] = await Promise.all([
        axios.get(`${API_URL}/api/auth/me`, { withCredentials: true }),
        axios.get(`${API_URL}/api/projects`, { withCredentials: true }),
        axios.get(`${API_URL}/api/leads`, { withCredentials: true })
      ]);
      
      setUser(userRes.data);
      setProjects(projectsRes.data);
      setLeads(leadsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-[#0066FF]" data-testid="loading-spinner">Loading...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Header */}
      <div className="bg-[#1A1A1A] border-b border-[#333333]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Film className="w-8 h-8 text-[#0066FF]" />
              <div>
                <h1 className="text-2xl font-bold text-white">Script-to-Gear</h1>
                <p className="text-sm text-[#A1A1A1]">Filmmaker Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium text-white">{user?.name}</div>
                <div className="text-xs text-[#A1A1A1]">{user?.email}</div>
              </div>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-[#A1A1A1] hover:text-white"
                data-testid="logout-button"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => navigate('/filmmaker/create-project')}
              className="bg-[#0066FF] hover:bg-[#0052CC] text-white p-6 h-auto justify-start shadow-[0_0_15px_rgba(0,102,255,0.3)]"
              data-testid="create-project-button"
            >
              <Plus className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">New Project</div>
                <div className="text-xs opacity-80">Analyze script with AI</div>
              </div>
            </Button>
            
            <Button
              onClick={() => navigate('/filmmaker/browse-gear')}
              variant="secondary"
              className="bg-[#222222] hover:bg-[#333333] text-white p-6 h-auto justify-start border border-[#444444]"
              data-testid="browse-gear-button"
            >
              <Package className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Browse Gear</div>
                <div className="text-xs opacity-80">Explore rental inventory</div>
              </div>
            </Button>
            
            <Button
              onClick={() => navigate('/filmmaker/leads')}
              variant="secondary"
              className="bg-[#222222] hover:bg-[#333333] text-white p-6 h-auto justify-start border border-[#444444]"
              data-testid="view-quotes-button"
            >
              <FileText className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">My Quotes</div>
                <div className="text-xs opacity-80">{leads.length} active</div>
              </div>
            </Button>
          </div>
        </div>
        
        {/* Projects */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Recent Projects</h2>
            <Button
              variant="ghost"
              onClick={() => navigate('/filmmaker/create-project')}
              className="text-[#0066FF] hover:text-[#0052CC]"
            >
              View All
            </Button>
          </div>
          
          {projects.length === 0 ? (
            <Card className="bg-[#1A1A1A] border-[#333333]" data-testid="no-projects-card">
              <CardContent className="py-12 text-center">
                <Film className="w-12 h-12 text-[#666666] mx-auto mb-4" />
                <p className="text-[#A1A1A1] mb-4">No projects yet</p>
                <Button
                  onClick={() => navigate('/filmmaker/create-project')}
                  className="bg-[#0066FF] hover:bg-[#0052CC]"
                >
                  Create Your First Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.slice(0, 3).map((project) => (
                <Card
                  key={project.project_id}
                  className="bg-[#1A1A1A] border-[#333333] hover:border-[#0066FF]/50 transition-all cursor-pointer group"
                  onClick={() => navigate(`/filmmaker/projects/${project.project_id}`)}
                  data-testid={`project-card-${project.project_id}`}
                >
                  <CardHeader>
                    <CardTitle className="text-white text-lg line-clamp-2">
                      {project.script_text.substring(0, 50)}...
                    </CardTitle>
                    <CardDescription className="text-[#A1A1A1]">
                      {new Date(project.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {project.ai_analysis_result?.gear_recommendations && (
                      <div className="text-sm text-[#A1A1A1]">
                        {project.ai_analysis_result.gear_recommendations.length} gear recommendations
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        {/* Recent Quotes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Recent Quotes</h2>
            <Button
              variant="ghost"
              onClick={() => navigate('/filmmaker/leads')}
              className="text-[#0066FF] hover:text-[#0052CC]"
            >
              View All
            </Button>
          </div>
          
          {leads.length === 0 ? (
            <Card className="bg-[#1A1A1A] border-[#333333]" data-testid="no-leads-card">
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-[#666666] mx-auto mb-4" />
                <p className="text-[#A1A1A1]">No quotes yet. Create a project to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {leads.slice(0, 5).map((lead) => {
                const statusColors = {
                  new: 'bg-gray-800 text-gray-400 border-gray-700',
                  quoted: 'bg-yellow-900/30 text-yellow-400 border-yellow-900/50',
                  accepted: 'bg-green-900/30 text-green-400 border-green-900/50',
                  declined: 'bg-red-900/30 text-red-400 border-red-900/50'
                };
                
                return (
                  <div
                    key={lead.lead_id}
                    onClick={() => navigate(`/filmmaker/leads/${lead.lead_id}`)}
                    className="bg-[#1A1A1A] border border-[#333333] rounded-lg p-4 hover:border-[#0066FF]/50 transition-all cursor-pointer"
                    data-testid={`lead-item-${lead.lead_id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-white font-medium mb-1">Lead #{lead.lead_id}</div>
                        <div className="text-sm text-[#A1A1A1]">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[lead.status]}`}>
                        {lead.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}