import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function CreateProject() {
  const [scriptText, setScriptText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!scriptText.trim()) {
      toast.error('Please enter your script');
      return;
    }
    
    setAnalyzing(true);
    
    try {
      const response = await axios.post(
        `${API_URL}/api/projects`,
        { script_text: scriptText },
        { withCredentials: true }
      );
      
      toast.success('Project created! AI analysis complete.');
      navigate(`/filmmaker/projects/${response.data.project_id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project');
    } finally {
      setAnalyzing(false);
    }
  };
  
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
          <h1 className="text-3xl font-bold text-white">Create New Project</h1>
          <p className="text-[#A1A1A1] mt-2">Paste your script and let AI recommend the perfect gear</p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-[#1A1A1A] border-[#333333]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#0066FF]" />
              Script Analysis
            </CardTitle>
            <CardDescription className="text-[#A1A1A1]">
              Our AI will analyze your script to identify scene types (day/night, indoor/outdoor, dialogue-heavy) and recommend specific camera, lens, audio, and lighting gear.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="script" className="text-[#A1A1A1] mb-2 block">
                  Script Text *
                </Label>
                <Textarea
                  id="script"
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  placeholder="EXT. MOODY NIGHT EXTERIOR - ABANDONED WAREHOUSE\n\nThe camera pans across a rain-soaked street. Shadows dance in the flickering streetlight. Low-light conditions require fast lenses...\n\nINT. DIALOGUE-HEAVY INTERVIEW - DAY\n\nTwo characters sit across from each other, intimate conversation. Professional audio is critical..."
                  className="bg-[#0F0F0F] border-[#333333] text-white min-h-[400px] font-mono text-sm"
                  required
                  data-testid="script-textarea"
                />
                <p className="text-xs text-[#666666] mt-2">
                  Tip: Include scene descriptions like "moody night exterior" or "dialogue-heavy interview" for better AI recommendations.
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <Button
                  type="submit"
                  disabled={analyzing || !scriptText.trim()}
                  className="bg-[#0066FF] hover:bg-[#0052CC] text-white shadow-[0_0_15px_rgba(0,102,255,0.3)]"
                  data-testid="analyze-button"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing Script...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyze & Create Project
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/filmmaker/dashboard')}
                  className="text-[#A1A1A1] hover:text-white"
                  data-testid="cancel-button"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Example Card */}
        <Card className="bg-[#1A1A1A] border-[#333333] mt-6">
          <CardHeader>
            <CardTitle className="text-white text-lg">Example Script Snippet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-[#0F0F0F] border border-[#333333] rounded-lg p-4 font-mono text-sm text-[#A1A1A1]">
              <div className="mb-2 text-white">EXT. MOODY NIGHT EXTERIOR - ABANDONED WAREHOUSE</div>
              <div className="mb-4">The rain-soaked streets glisten under flickering streetlights. Deep shadows require low-light capable cameras and fast lenses.</div>
              
              <div className="mb-2 text-white">INT. DIALOGUE-HEAVY INTERVIEW - DAY</div>
              <div>Two characters in close conversation. Lavalier mics and shotgun microphones are essential for clean dialogue capture.</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}