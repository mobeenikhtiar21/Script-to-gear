import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

export default function LandingPage() {
  const handleSignIn = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/select-role';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };
  
  return (
    <div className="min-h-screen bg-[#121212] flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Logo */}
        <div className="mb-8">
          <img 
            src="/logo.png" 
            alt="Script-to-Gear" 
            className="w-32 h-32 md:w-40 md:h-40 rounded-2xl"
            data-testid="landing-logo"
          />
        </div>
        
        {/* Badge */}
        <div className="mb-6 px-4 py-2 border border-[#800020]/30 bg-[#800020]/10">
          <span className="text-sm text-[#800020] font-medium tracking-widest uppercase">
            AI-Powered Gear Matching
          </span>
        </div>
        
        {/* Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6 uppercase text-center">
          Script-to-Gear
        </h1>
        
        {/* Tagline */}
        <p className="text-lg text-[#888888] max-w-2xl text-center mb-10 leading-relaxed">
          Transform your script into a complete gear package. AI-powered marketplace connecting filmmakers with professional rental houses.
        </p>
        
        {/* Sign In Button */}
        <Button
          onClick={handleSignIn}
          size="lg"
          className="bg-[#800020] hover:bg-[#5C0A1F] text-white text-base px-8 py-6 shadow-[0_0_30px_rgba(128,0,32,0.4)] transition-all hover:shadow-[0_0_40px_rgba(128,0,32,0.5)]"
          data-testid="sign-in-button"
        >
          Sign in with Google
        </Button>
        
        {/* Security Badge */}
        <div className="mt-6 flex items-center gap-2 text-[#555555]">
          <Lock className="w-3 h-3" />
          <span className="text-xs tracking-widest uppercase">Secured by Emergent</span>
        </div>
        
        {/* Footer Text */}
        <div className="mt-12 flex items-center gap-4 text-xs text-[#555555] tracking-widest uppercase">
          <span>Filmmakers</span>
          <span className="text-[#333333]">|</span>
          <span>Rental Houses</span>
          <span className="text-[#333333]">|</span>
          <span>AI Analysis</span>
        </div>
      </div>
    </div>
  );
}
