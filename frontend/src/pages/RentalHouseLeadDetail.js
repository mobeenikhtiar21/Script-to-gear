import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import RentalHouseLayout from '@/components/RentalHouseLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, X, Plus, Save, User, FileText, Package } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function RentalHouseLeadDetail() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [project, setProject] = useState(null);
  const [filmmaker, setFilmmaker] = useState(null);
  const [projectGear, setProjectGear] = useState([]);
  const [quoteItems, setQuoteItems] = useState([]);
  const [quoteMessage, setQuoteMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  
  useEffect(() => {
    fetchData();
  }, [leadId]);
  
  const fetchData = async () => {
    try {
      const leadRes = await axios.get(`${API_URL}/api/leads/${leadId}`, { withCredentials: true });
      setLead(leadRes.data);
      
      // Fetch project details
      const projectRes = await axios.get(
        `${API_URL}/api/projects/${leadRes.data.project_id}`,
        { withCredentials: true }
      );
      setProject(projectRes.data);
      
      // Fetch filmmaker details
      const filmmakerRes = await axios.get(
        `${API_URL}/api/users/${leadRes.data.filmmaker_id}`,
        { withCredentials: true }
      );
      setFilmmaker(filmmakerRes.data);
      
      // Fetch project gear
      const gearRes = await axios.get(
        `${API_URL}/api/projects/${leadRes.data.project_id}/gear`,
        { withCredentials: true }
      );
      setProjectGear(gearRes.data);
      
      // Initialize quote items from existing quote or project gear
      if (leadRes.data.quote_details?.items) {
        setQuoteItems(leadRes.data.quote_details.items);
        setQuoteMessage(leadRes.data.quote_details.message || '');
      } else {
        // Create initial quote from project gear
        const initialItems = gearRes.data.map(pg => ({
          gear_id: pg.gear.gear_id,
          manufacturer: pg.gear.manufacturer,
          model: pg.gear.model,
          quantity: pg.quantity,
          rate: pg.gear.daily_rate,
          subtotal: pg.quantity * pg.gear.daily_rate
        }));
        setQuoteItems(initialItems);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load lead details');
    } finally {
      setLoading(false);
    }
  };
  
  const updateQuoteItem = (index, field, value) => {
    const newItems = [...quoteItems];
    newItems[index][field] = field === 'quantity' || field === 'rate' ? parseFloat(value) || 0 : value;
    newItems[index].subtotal = newItems[index].quantity * newItems[index].rate;
    setQuoteItems(newItems);
  };
  
  const removeQuoteItem = (index) => {
    setQuoteItems(quoteItems.filter((_, i) => i !== index));
  };
  
  const calculateTotal = () => {
    return quoteItems.reduce((sum, item) => sum + item.subtotal, 0);
  };
  
  const handleSaveChanges = async () => {
    if (quoteItems.length === 0) {
      toast.error('Please add at least one item to the quote');
      return;
    }
    
    setSaving(true);
    try {
      const quoteDetails = {
        items: quoteItems,
        total_amount: calculateTotal(),
        message: quoteMessage,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      };
      
      await axios.put(
        `${API_URL}/api/leads/${leadId}/quote`,
        { quote_details: quoteDetails, status: lead.status },
        { withCredentials: true }
      );
      
      toast.success('Quote saved successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to save quote:', error);
      toast.error('Failed to save quote');
    } finally {
      setSaving(false);
    }
  };
  
  const handleSendQuote = async () => {
    if (quoteItems.length === 0) {
      toast.error('Please add at least one item to the quote');
      return;
    }
    
    if (!confirm('Send this quote to the filmmaker?')) return;
    
    setSending(true);
    try {
      const quoteDetails = {
        items: quoteItems,
        total_amount: calculateTotal(),
        message: quoteMessage,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        sent_at: new Date().toISOString()
      };
      
      await axios.put(
        `${API_URL}/api/leads/${leadId}/quote`,
        { quote_details: quoteDetails, status: 'quoted' },
        { withCredentials: true }
      );
      
      toast.success('Quote sent successfully!');
      navigate('/rental-house/leads');
    } catch (error) {
      console.error('Failed to send quote:', error);
      toast.error('Failed to send quote');
    } finally {
      setSending(false);
    }
  };
  
  const handleDecline = async () => {
    if (!confirm('Are you sure you want to decline this lead?')) return;
    
    try {
      await axios.put(
        `${API_URL}/api/leads/${leadId}/quote`,
        { quote_details: null, status: 'declined' },
        { withCredentials: true }
      );
      
      toast.success('Lead declined');
      navigate('/rental-house/leads');
    } catch (error) {
      console.error('Failed to decline lead:', error);
      toast.error('Failed to decline lead');
    }
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
  
  if (!lead || !project) {
    return (
      <RentalHouseLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-[#A1A1A1]">Lead not found</div>
        </div>
      </RentalHouseLayout>
    );
  }
  
  const statusColors = {
    new: 'bg-blue-900/30 text-blue-400 border-blue-900/50',
    quoted: 'bg-yellow-900/30 text-yellow-400 border-yellow-900/50',
    accepted: 'bg-green-900/30 text-green-400 border-green-900/50',
    declined: 'bg-red-900/30 text-red-400 border-red-900/50'
  };
  
  const analysis = project.ai_analysis_result;
  
  return (
    <RentalHouseLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/rental-house/leads')}
            className="text-[#A1A1A1] hover:text-white mb-4"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leads
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Lead #{leadId}</h1>
              <p className="text-[#A1A1A1]">
                Received {new Date(lead.created_at).toLocaleDateString()}
              </p>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${statusColors[lead.status]}`}>
              {lead.status}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Project Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1: Project Info */}
            <Card className="bg-[#0F0F0F] border-[#2A2A2A]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-[#800020]" />
                  Filmmaker Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs text-[#666666] mb-1">Name</div>
                  <div className="text-white">{filmmaker?.name || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-[#666666] mb-1">Email</div>
                  <div className="text-[#A1A1A1]">{filmmaker?.email || 'N/A'}</div>
                </div>
                {filmmaker?.phone && (
                  <div>
                    <div className="text-xs text-[#666666] mb-1">Phone</div>
                    <div className="text-[#A1A1A1]">{filmmaker.phone}</div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Section 2: AI Analysis Summary */}
            {analysis && (
              <Card className="bg-[#0F0F0F] border-[#2A2A2A]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#800020]" />
                    Project Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis.scene_types && analysis.scene_types.length > 0 && (
                    <div>
                      <div className="text-xs text-[#666666] mb-2">Scene Types</div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.scene_types.map((type, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-900/30 text-blue-400 border border-blue-900/50 rounded text-xs">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysis.lighting_needs && analysis.lighting_needs.length > 0 && (
                    <div>
                      <div className="text-xs text-[#666666] mb-2">Lighting Needs</div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.lighting_needs.map((need, idx) => (
                          <span key={idx} className="px-2 py-1 bg-yellow-900/30 text-yellow-400 border border-yellow-900/50 rounded text-xs">
                            {need}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysis.audio_needs && analysis.audio_needs.length > 0 && (
                    <div>
                      <div className="text-xs text-[#666666] mb-2">Audio Needs</div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.audio_needs.map((need, idx) => (
                          <span key={idx} className="px-2 py-1 bg-green-900/30 text-green-400 border border-green-900/50 rounded text-xs">
                            {need}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Section 3: Quote Builder */}
            <Card className="bg-[#0F0F0F] border-[#2A2A2A]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#800020]" />
                    Quote Items
                  </CardTitle>
                  <Button
                    onClick={handleSaveChanges}
                    disabled={saving}
                    variant="ghost"
                    size="sm"
                    className="text-[#800020] hover:bg-[#800020]/10"
                    data-testid="save-changes-button"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quoteItems.map((item, index) => (
                    <div
                      key={index}
                      className="bg-[#121212] border border-[#333333] rounded-lg p-4"
                      data-testid={`quote-item-${index}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="text-white font-medium">{item.manufacturer} {item.model}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuoteItem(index)}
                          className="text-[#EF4444] hover:text-[#DC2626] hover:bg-red-900/20"
                          data-testid={`remove-item-${index}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label htmlFor={`qty-${index}`} className="text-xs text-[#666666] mb-1 block">
                            Quantity
                          </Label>
                          <Input
                            id={`qty-${index}`}
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuoteItem(index, 'quantity', e.target.value)}
                            className="bg-[#0F0F0F] border-[#333333] text-white h-8"
                            data-testid={`quantity-${index}`}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`rate-${index}`} className="text-xs text-[#666666] mb-1 block">
                            Daily Rate ($)
                          </Label>
                          <Input
                            id={`rate-${index}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) => updateQuoteItem(index, 'rate', e.target.value)}
                            className="bg-[#0F0F0F] border-[#333333] text-white h-8"
                            data-testid={`rate-${index}`}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-[#666666] mb-1 block">Subtotal</Label>
                          <div className="text-[#800020] font-semibold text-lg">
                            ${item.subtotal.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column - Quote Preview & Actions */}
          <div className="space-y-6">
            {/* Quote Preview */}
            <Card className="bg-gradient-to-br from-[#800020]/10 to-[#800020]/5 border-[#800020]/30">
              <CardHeader>
                <CardTitle className="text-white">Quote Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {quoteItems.length === 0 ? (
                  <div className="text-center py-8 text-[#666666]">
                    No items in quote
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {quoteItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-[#A1A1A1]">
                            {item.quantity}x {item.manufacturer} {item.model}
                          </span>
                          <span className="text-white">${item.subtotal.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t border-[#333333] pt-4 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-semibold text-lg">Total</span>
                        <span className="text-[#800020] font-bold text-2xl">
                          ${calculateTotal().toFixed(2)}
                          <span className="text-sm text-[#666666]">/day</span>
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* Message to Filmmaker */}
            <Card className="bg-[#0F0F0F] border-[#2A2A2A]">
              <CardHeader>
                <CardTitle className="text-white text-sm">Message (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={quoteMessage}
                  onChange={(e) => setQuoteMessage(e.target.value)}
                  placeholder="Add notes or special terms for the filmmaker..."
                  className="bg-[#121212] border-[#333333] text-white min-h-[120px]"
                  data-testid="quote-message"
                />
              </CardContent>
            </Card>
            
            {/* Actions */}
            <Card className="bg-[#0F0F0F] border-[#2A2A2A]">
              <CardContent className="p-4 space-y-3">
                {lead.status === 'new' || lead.status === 'quoted' ? (
                  <>
                    <Button
                      onClick={handleSendQuote}
                      disabled={sending || quoteItems.length === 0}
                      className="w-full bg-[#800020] hover:bg-[#5C0A1F] text-white shadow-[0_0_15px_rgba(128,0,32,0.3)]"
                      data-testid="send-quote-button"
                    >
                      {sending ? (
                        'Sending...'
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          {lead.status === 'quoted' ? 'Update Quote' : 'Send Quote'}
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleDecline}
                      variant="outline"
                      className="w-full bg-transparent border-[#333333] text-[#EF4444] hover:bg-red-900/20"
                      data-testid="decline-button"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Decline Lead
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-4 text-[#666666] text-sm">
                    This lead has been {lead.status}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RentalHouseLayout>
  );
}
