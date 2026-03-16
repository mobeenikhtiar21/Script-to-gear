import { Button } from '@/components/ui/button';
import { Film, Sparkles, Zap, Shield } from 'lucide-react';

export default function LandingPage() {
  const handleSignIn = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/select-role';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };
  
  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1519800342810-b72ef13bbd46?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwzfHxjaW5lbWF0aWMlMjBmaWxtJTIwY2FtZXJhJTIwZ2VhciUyMGFycmklMjBhbGV4YSUyMHJlZCUyMGtvbW9kbyUyMGZpbG0lMjBzZXQlMjBiZWhpbmQlMjB0aGUlMjBzY2VuZXN8ZW58MHx8fHwxNzczNjg3MjM0fDA&ixlib=rb-4.1.0&q=85"
            alt="Cinema equipment"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#121212]" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-[#0066FF]/10 border border-[#0066FF]/30 rounded-full">
              <Sparkles className="w-4 h-4 text-[#0066FF]" />
              <span className="text-sm text-[#0066FF] font-medium">AI-Powered Gear Matching</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-none mb-6">
              Script-to-Gear
            </h1>
            
            <p className="text-xl md:text-2xl text-[#A1A1A1] max-w-3xl mx-auto mb-8">
              Transform your script into a complete gear package. AI-powered marketplace connecting filmmakers with professional rental houses.
            </p>
            
            <Button
              onClick={handleSignIn}
              size="lg"
              className="bg-[#0066FF] hover:bg-[#0052CC] text-white text-lg px-8 py-6 shadow-[0_0_30px_rgba(0,102,255,0.4)] transition-all hover:shadow-[0_0_40px_rgba(0,102,255,0.6)]"
              data-testid="sign-in-button"
            >
              <Film className="w-5 h-5 mr-2" />
              Sign in with Google
            </Button>
          </div>
        </div>
      </div>
      
      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-lg p-8 hover:border-[#0066FF]/50 transition-all group">
            <div className="w-12 h-12 bg-[#0066FF]/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-[#0066FF]/20 transition-colors">
              <Sparkles className="w-6 h-6 text-[#0066FF]" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">AI Script Analysis</h3>
            <p className="text-[#A1A1A1] leading-relaxed">
              Paste your script and let AI analyze scenes to recommend the exact gear you need—from cameras to lighting.
            </p>
          </div>
          
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-lg p-8 hover:border-[#0066FF]/50 transition-all group">
            <div className="w-12 h-12 bg-[#0066FF]/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-[#0066FF]/20 transition-colors">
              <Zap className="w-6 h-6 text-[#0066FF]" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Instant Quotes</h3>
            <p className="text-[#A1A1A1] leading-relaxed">
              Build your package, select a rental house, and get custom quotes with adjusted pricing and availability.
            </p>
          </div>
          
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-lg p-8 hover:border-[#0066FF]/50 transition-all group">
            <div className="w-12 h-12 bg-[#0066FF]/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-[#0066FF]/20 transition-colors">
              <Shield className="w-6 h-6 text-[#0066FF]" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Secure Payments</h3>
            <p className="text-[#A1A1A1] leading-relaxed">
              Accept quotes and pay seamlessly through Stripe. Rental houses receive payouts with transparent platform fees.
            </p>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-gradient-to-b from-transparent to-[#0066FF]/5 py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to transform your production workflow?
          </h2>
          <p className="text-lg text-[#A1A1A1] mb-8">
            Join filmmakers and rental houses using AI-powered gear matching
          </p>
          <Button
            onClick={handleSignIn}
            size="lg"
            className="bg-[#0066FF] hover:bg-[#0052CC] text-white px-8 py-6 shadow-[0_0_30px_rgba(0,102,255,0.4)]"
            data-testid="cta-sign-in-button"
          >
            Get Started Now
          </Button>
        </div>
      </div>
    </div>
  );
}
