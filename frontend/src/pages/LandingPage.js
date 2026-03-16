import { Button } from '@/components/ui/button';
import { Sparkles, Zap, Shield, ArrowRight, Lock } from 'lucide-react';

export default function LandingPage() {
  const handleSignIn = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/select-role';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };
  
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Hero Section - Login Focus */}
      <div className="relative overflow-hidden">
        {/* Technical grid background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-grid-pattern opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0A0A0A]" />
          {/* Subtle maroon accent glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#800020]/10 rounded-full blur-3xl" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            {/* Logo */}
            <div className="mb-6 flex justify-center">
              <img 
                src="/logo.png" 
                alt="Script-to-Gear" 
                className="w-28 h-28 md:w-36 md:h-36 rounded-2xl shadow-2xl border border-[#2A2A2A]"
                data-testid="landing-logo"
              />
            </div>
            
            {/* Badge */}
            <div className="mb-5 inline-flex items-center gap-2 px-4 py-2 bg-[#800020]/10 border border-[#800020]/30 rounded-sm">
              <Sparkles className="w-4 h-4 text-[#800020]" />
              <span className="text-sm text-[#800020] font-mono uppercase tracking-wider">AI-Powered Gear Matching</span>
            </div>
            
            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-none mb-4 uppercase">
              Script<span className="text-[#505050]">-to-</span>Gear
            </h1>
            
            {/* Subtitle */}
            <p className="text-base md:text-lg text-[#707070] max-w-xl mx-auto mb-8 leading-relaxed">
              Transform your script into a complete gear package. AI-powered marketplace connecting filmmakers with professional rental houses.
            </p>
            
            {/* Login Button */}
            <Button
              onClick={handleSignIn}
              size="lg"
              className="bg-[#800020] hover:bg-[#5C0A1F] text-white text-base px-10 py-6 shadow-[0_0_30px_rgba(128,0,32,0.4)] transition-all hover:shadow-[0_0_40px_rgba(128,0,32,0.6)] rounded-sm font-medium tracking-wide"
              data-testid="sign-in-button"
            >
              Sign In with Google
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            {/* Secured by Emergent */}
            <div className="mt-4 flex items-center justify-center gap-2 text-[#404040]">
              <Lock className="w-3 h-3" />
              <span className="text-xs font-mono uppercase tracking-wider">Secured by Emergent</span>
            </div>
            
            {/* Tech specs style text */}
            <div className="mt-10 flex justify-center gap-6 text-xs text-[#505050] font-mono uppercase tracking-wider">
              <span>Filmmakers</span>
              <span className="text-[#2A2A2A]">|</span>
              <span>Rental Houses</span>
              <span className="text-[#2A2A2A]">|</span>
              <span>AI Analysis</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-[#0F0F0F] border border-[#1A1A1A] p-8 hover:border-[#800020]/40 transition-all group">
            <div className="w-12 h-12 bg-[#800020]/10 border border-[#800020]/20 flex items-center justify-center mb-6 group-hover:bg-[#800020]/20 transition-colors">
              <Sparkles className="w-6 h-6 text-[#800020]" />
            </div>
            <h3 className="text-base font-semibold text-white mb-3 uppercase tracking-wide">AI Script Analysis</h3>
            <p className="text-[#606060] text-sm leading-relaxed">
              Paste your script and let AI analyze scenes to recommend the exact gear you need—from cameras to lighting.
            </p>
          </div>
          
          {/* Feature 2 */}
          <div className="bg-[#0F0F0F] border border-[#1A1A1A] p-8 hover:border-[#800020]/40 transition-all group">
            <div className="w-12 h-12 bg-[#800020]/10 border border-[#800020]/20 flex items-center justify-center mb-6 group-hover:bg-[#800020]/20 transition-colors">
              <Zap className="w-6 h-6 text-[#800020]" />
            </div>
            <h3 className="text-base font-semibold text-white mb-3 uppercase tracking-wide">Instant Quotes</h3>
            <p className="text-[#606060] text-sm leading-relaxed">
              Build your package, select a rental house, and get custom quotes with adjusted pricing and availability.
            </p>
          </div>
          
          {/* Feature 3 */}
          <div className="bg-[#0F0F0F] border border-[#1A1A1A] p-8 hover:border-[#800020]/40 transition-all group">
            <div className="w-12 h-12 bg-[#800020]/10 border border-[#800020]/20 flex items-center justify-center mb-6 group-hover:bg-[#800020]/20 transition-colors">
              <Shield className="w-6 h-6 text-[#800020]" />
            </div>
            <h3 className="text-base font-semibold text-white mb-3 uppercase tracking-wide">Secure Payments</h3>
            <p className="text-[#606060] text-sm leading-relaxed">
              Accept quotes and pay seamlessly through Stripe. Rental houses receive payouts with transparent platform fees.
            </p>
          </div>
        </div>
      </div>
      
      {/* Bottom CTA Section */}
      <div className="border-t border-[#1A1A1A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4 uppercase tracking-wide">
            Ready to transform your workflow?
          </h2>
          <p className="text-[#606060] mb-8 font-mono text-sm">
            Join filmmakers and rental houses using AI-powered gear matching
          </p>
          <Button
            onClick={handleSignIn}
            size="lg"
            className="bg-[#800020] hover:bg-[#5C0A1F] text-white px-8 py-6 shadow-[0_0_30px_rgba(128,0,32,0.4)] rounded-sm font-medium"
            data-testid="cta-sign-in-button"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
      
      {/* Footer */}
      <div className="border-t border-[#1A1A1A] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3">
            <img src="/logo.png" alt="Script-to-Gear" className="w-5 h-5 rounded" />
            <span className="text-[#404040] text-xs font-mono uppercase tracking-wider">Script-to-Gear © 2024</span>
          </div>
        </div>
      </div>
    </div>
  );
}
