import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import FilmmakerLayout from '@/components/FilmmakerLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Check, X, CreditCard, Clock, Building2, Package, FileText, AlertCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function LeadDetail() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [project, setProject] = useState(null);
  const [rentalHouse, setRentalHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
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
      
      // Fetch rental house details
      const rentalRes = await axios.get(
        `${API_URL}/api/users/${leadRes.data.supplier_id}`,
        { withCredentials: true }
      );
      setRentalHouse(rentalRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load quote details');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAcceptAndPay = async () => {
    setProcessing(true);
    try {
      // Create Stripe checkout session
      const response = await axios.post(
        `${API_URL}/api/stripe/checkout/create`,
        {
          lead_id: leadId,
          success_url: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/filmmaker/leads/${leadId}`
        },
        { withCredentials: true }
      );
      
      // Redirect to Stripe checkout
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Failed to create checkout:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to process payment';
      toast.error(errorMsg);
      setProcessing(false);
    }
  };
  
  const handleDecline = async () => {
    if (!window.confirm('Are you sure you want to decline this quote?')) return;
    
    setProcessing(true);
    try {
      await axios.put(
        `${API_URL}/api/leads/${leadId}/decline`,
        {},
        { withCredentials: true }
      );
      
      toast.success('Quote declined');
      navigate('/filmmaker/leads');
    } catch (error) {
      console.error('Failed to decline quote:', error);
      toast.error('Failed to decline quote');
      setProcessing(false);
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
  
  if (!lead) {
    return (
      <FilmmakerLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-[#A1A1A1]">Quote not found</div>
        </div>
      </FilmmakerLayout>
    );
  }
  
  const statusConfig = {
    new: { color: 'bg-gray-800 text-gray-400 border-gray-700', label: 'Pending Quote' },
    quoted: { color: 'bg-yellow-900/30 text-yellow-400 border-yellow-900/50', label: 'Quote Received' },
    accepted: { color: 'bg-green-900/30 text-green-400 border-green-900/50', label: 'Accepted' },
    declined: { color: 'bg-red-900/30 text-red-400 border-red-900/50', label: 'Declined' }
  };
  
  const quote = lead.quote_details;
  const status = statusConfig[lead.status] || statusConfig.new;
  
  return (
    <FilmmakerLayout>
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/filmmaker/leads')}
            className="text-[#A1A1A1] hover:text-white mb-4"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quotes
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Quote Details</h1>
              <p className="text-[#A1A1A1]">
                Requested {new Date(lead.created_at).toLocaleDateString()}
              </p>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${status.color}`} data-testid="quote-status">
              {status.label}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Quote Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Rental House Info */}
            <Card className="bg-[#0F0F0F] border-[#2A2A2A]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#0066FF]" />
                  Rental House
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs text-[#666666] mb-1">Company</div>
                  <div className="text-white text-lg font-medium">{rentalHouse?.company_name || rentalHouse?.name || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-[#666666] mb-1">Contact</div>
                  <div className="text-[#A1A1A1]">{rentalHouse?.email || 'N/A'}</div>
                </div>
                {rentalHouse?.phone && (
                  <div>
                    <div className="text-xs text-[#666666] mb-1">Phone</div>
                    <div className="text-[#A1A1A1]">{rentalHouse.phone}</div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Quote Items */}
            {lead.status === 'quoted' && quote ? (
              <Card className="bg-[#0F0F0F] border-[#2A2A2A]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#0066FF]" />
                    Equipment List
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {quote.items?.map((item, index) => (
                      <div
                        key={index}
                        className="bg-[#121212] border border-[#333333] rounded-lg p-4"
                        data-testid={`quote-item-${index}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-medium">
                              {item.manufacturer} {item.model}
                            </div>
                            <div className="text-sm text-[#666666] mt-1">
                              Quantity: {item.quantity} | Rate: ${item.rate?.toFixed(2)}/day
                            </div>
                          </div>
                          <div className="text-[#0066FF] font-semibold text-lg">
                            ${item.subtotal?.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Total */}
                    <div className="border-t border-[#333333] pt-4 mt-4 flex justify-between items-center">
                      <span className="text-white font-semibold text-lg">Total</span>
                      <span className="text-[#0066FF] font-bold text-2xl">
                        ${quote.total_amount?.toFixed(2)}
                        <span className="text-sm text-[#666666]">/day</span>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : lead.status === 'new' ? (
              <Card className="bg-[#0F0F0F] border-[#2A2A2A]">
                <CardContent className="py-12">
                  <div className="text-center">
                    <Clock className="w-12 h-12 text-[#666666] mx-auto mb-4" />
                    <h3 className="text-white text-lg font-medium mb-2">Waiting for Quote</h3>
                    <p className="text-[#A1A1A1] text-sm">
                      The rental house is reviewing your request and will send a quote soon.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}
            
            {/* Message from Rental House */}
            {quote?.message && (
              <Card className="bg-[#0F0F0F] border-[#2A2A2A]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#0066FF]" />
                    Message from Rental House
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-[#121212] border border-[#333333] rounded-lg p-4">
                    <p className="text-[#A1A1A1] whitespace-pre-wrap">{quote.message}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Quote Summary Card */}
            {lead.status === 'quoted' && quote && (
              <Card className="bg-gradient-to-br from-[#0066FF]/10 to-[#0066FF]/5 border-[#0066FF]/30">
                <CardHeader>
                  <CardTitle className="text-white">Quote Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-4">
                    <div className="text-[#666666] text-sm mb-2">Total Amount</div>
                    <div className="text-[#0066FF] font-bold text-4xl">
                      ${quote.total_amount?.toFixed(2)}
                    </div>
                    <div className="text-[#666666] text-sm mt-1">per day</div>
                  </div>
                  
                  {quote.valid_until && (
                    <div className="text-center border-t border-[#333333] pt-4">
                      <div className="text-xs text-[#666666]">Valid until</div>
                      <div className="text-[#A1A1A1] text-sm">
                        {new Date(quote.valid_until).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-[#666666] bg-[#121212] rounded p-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>10% platform fee included in total</span>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Action Buttons */}
            <Card className="bg-[#0F0F0F] border-[#2A2A2A]">
              <CardContent className="p-4 space-y-3">
                {lead.status === 'quoted' ? (
                  <>
                    <Button
                      onClick={handleAcceptAndPay}
                      disabled={processing}
                      className="w-full bg-[#0066FF] hover:bg-[#0052CC] text-white shadow-[0_0_15px_rgba(0,102,255,0.3)] h-12"
                      data-testid="accept-pay-button"
                    >
                      {processing ? (
                        'Processing...'
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Accept & Pay
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleDecline}
                      disabled={processing}
                      variant="outline"
                      className="w-full bg-transparent border-[#333333] text-[#EF4444] hover:bg-red-900/20"
                      data-testid="decline-button"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Decline Quote
                    </Button>
                  </>
                ) : lead.status === 'new' ? (
                  <div className="text-center py-4 text-[#666666] text-sm">
                    <Clock className="w-5 h-5 mx-auto mb-2" />
                    Awaiting quote from rental house
                  </div>
                ) : lead.status === 'accepted' ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Check className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="text-green-400 font-medium">Quote Accepted</div>
                    <div className="text-[#666666] text-sm mt-1">Payment completed</div>
                  </div>
                ) : lead.status === 'declined' ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                      <X className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="text-red-400 font-medium">Quote Declined</div>
                    <div className="text-[#666666] text-sm mt-1">This quote is no longer active</div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
            
            {/* Project Reference */}
            {project && (
              <Card className="bg-[#0F0F0F] border-[#2A2A2A]">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Project Reference</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="ghost"
                    onClick={() => navigate(`/filmmaker/projects/${project.project_id}`)}
                    className="w-full text-[#0066FF] hover:bg-[#0066FF]/10 justify-start"
                    data-testid="view-project-button"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Project Details
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </FilmmakerLayout>
  );
}
