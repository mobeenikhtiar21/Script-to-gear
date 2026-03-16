import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import FilmmakerLayout from '@/components/FilmmakerLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Sparkles, Loader2, Upload, Info } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function CreateProject() {
  const [scriptText, setScriptText] = useState('');
  const [includeAudio, setIncludeAudio] = useState(true);
  const [includeLighting, setIncludeLighting] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const navigate = useNavigate();
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'application/pdf') {
        toast.info('PDF parsing not yet implemented. Please paste text instead.');
      } else if (file.type.startsWith('text/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setScriptText(event.target.result);
          toast.success('Script loaded successfully');
        };
        reader.readAsText(file);
      } else {
        toast.error('Please upload a PDF or text file');
      }
    }
  };
  
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
      
      toast.success('Analysis complete!');
      navigate(`/filmmaker/projects/${response.data.project_id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to analyze script');
    } finally {
      setAnalyzing(false);
    }
  };
  
  return (
    <FilmmakerLayout>
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">New Script Analysis</h1>
          <p className="text-[#A1A1A1]">Paste your script or scene description for AI-powered gear recommendations</p>
        </div>
        
        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Script Input Card */}
          <Card className="bg-[#0F0F0F] border-[#2A2A2A]">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#800020]" />
                Script Input
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Textarea
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  placeholder="Paste your script or scene description here...\n\nExample:\nEXT. MOODY NIGHT EXTERIOR - ABANDONED WAREHOUSE\n\nThe rain-soaked streets glisten under flickering streetlights. Deep shadows require low-light capable cameras...\n\nINT. DIALOGUE-HEAVY INTERVIEW - DAY\n\nTwo characters in intimate conversation. Professional audio critical for clean dialogue capture..."
                  className="bg-[#121212] border-[#333333] text-white min-h-[400px] font-mono text-sm focus:border-[#800020] transition-colors"
                  required
                  data-testid="script-textarea"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  id="file-upload"
                  accept=".txt,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  data-testid="file-input"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('file-upload').click()}
                  className="bg-transparent border-[#333333] text-[#A1A1A1] hover:border-[#800020] hover:text-[#800020] hover:bg-[#800020]/5"
                  data-testid="upload-button"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Script File
                </Button>
                <span className="text-xs text-[#666666]">Supports .txt and .pdf files</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Analysis Options Card */}
          <Card className="bg-[#0F0F0F] border-[#2A2A2A]">
            <CardHeader>
              <CardTitle className="text-white text-lg">Analysis Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-[#121212] border border-[#2A2A2A] rounded-lg">
                <div className="flex items-start gap-3">
                  <div>
                    <Label htmlFor="audio-switch" className="text-white font-medium cursor-pointer">
                      Include audio recommendations?
                    </Label>
                    <p className="text-sm text-[#666666] mt-1">Microphones, recorders, and audio accessories</p>
                  </div>
                </div>
                <Switch
                  id="audio-switch"
                  checked={includeAudio}
                  onCheckedChange={setIncludeAudio}
                  className="data-[state=checked]:bg-[#800020]"
                  data-testid="audio-toggle"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-[#121212] border border-[#2A2A2A] rounded-lg">
                <div className="flex items-start gap-3">
                  <div>
                    <Label htmlFor="lighting-switch" className="text-white font-medium cursor-pointer">
                      Include lighting recommendations?
                    </Label>
                    <p className="text-sm text-[#666666] mt-1">Lights, modifiers, and grip equipment</p>
                  </div>
                </div>
                <Switch
                  id="lighting-switch"
                  checked={includeLighting}
                  onCheckedChange={setIncludeLighting}
                  className="data-[state=checked]:bg-[#800020]"
                  data-testid="lighting-toggle"
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Info Card */}
          <Card className="bg-[#800020]/5 border-[#800020]/20">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-[#800020] flex-shrink-0 mt-0.5" />
                <div className="text-sm text-[#A1A1A1]">
                  <span className="text-white font-medium">Tip:</span> Include scene descriptions like "moody night exterior" or "dialogue-heavy interview" for more accurate AI recommendations.
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Submit Button */}
          <div className="flex items-center gap-4 pt-4">
            <Button
              type="submit"
              disabled={analyzing || !scriptText.trim()}
              className="bg-[#800020] hover:bg-[#5C0A1F] text-white px-8 py-6 text-lg shadow-[0_0_20px_rgba(128,0,32,0.3)] hover:shadow-[0_0_30px_rgba(128,0,32,0.5)] transition-all"
              data-testid="analyze-button"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing Script...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Analyze with AI
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/filmmaker/dashboard')}
              className="text-[#A1A1A1] hover:text-white hover:bg-[#1A1A1A]"
              data-testid="cancel-button"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </FilmmakerLayout>
  );
}