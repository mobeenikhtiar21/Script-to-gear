import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSignIn = () => {
    setIsLoading(true);
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/select-role';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };
  
  return (
    <div className="min-h-screen bg-[#121212] relative overflow-hidden">
      {/* Background Pattern - Repeating Logo Watermark */}
      <div className="absolute inset-0 z-0 opacity-[0.03]">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url('/logo.png')`,
            backgroundSize: '120px 120px',
            backgroundRepeat: 'repeat',
            transform: 'rotate(-15deg) scale(1.5)',
            transformOrigin: 'center center'
          }}
        />
      </div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 z-1 bg-gradient-to-b from-[#121212] via-transparent to-[#121212]" />
      
      {/* Maroon Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#800020]/8 rounded-full blur-3xl z-0" />
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Login Card */}
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <img 
                src="/logo.png" 
                alt="Script-to-Gear" 
                className="w-24 h-24 rounded-xl shadow-2xl border border-[#2A2A2A]"
                data-testid="landing-logo"
              />
              {/* Glow effect behind logo */}
              <div className="absolute inset-0 bg-[#800020]/20 rounded-xl blur-xl -z-10" />
            </div>
          </div>
          
          {/* Title */}
          <h1 className="text-3xl font-bold text-white text-center mb-2 uppercase tracking-wider">
            Script<span className="text-[#505050]">-to-</span>Gear
          </h1>
          
          {/* Subtitle */}
          <p className="text-[#707070] text-center text-sm mb-8 font-mono">
            AI-Powered Film Equipment Marketplace
          </p>
          
          {/* Login Box */}
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-8">
            <h2 className="text-white text-lg font-medium text-center mb-2">
              Welcome Back
            </h2>
            <p className="text-[#606060] text-sm text-center mb-6">
              Sign in to access your dashboard
            </p>
            
            {/* Sign In Button */}
            <Button
              onClick={handleSignIn}
              disabled={isLoading}
              size="lg"
              className="w-full bg-[#800020] hover:bg-[#5C0A1F] text-white py-6 shadow-[0_0_25px_rgba(128,0,32,0.3)] transition-all hover:shadow-[0_0_35px_rgba(128,0,32,0.5)] rounded-md font-medium text-base"
              data-testid="sign-in-button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  Sign In with Google
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
            
            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-[#2A2A2A]" />
              <span className="text-[#404040] text-xs font-mono uppercase">or</span>
              <div className="flex-1 h-px bg-[#2A2A2A]" />
            </div>
            
            {/* New User Text */}
            <p className="text-[#606060] text-sm text-center">
              New to Script-to-Gear?{' '}
              <button 
                onClick={handleSignIn}
                className="text-[#800020] hover:text-[#9A1B3A] font-medium transition-colors"
              >
                Create an account
              </button>
            </p>
          </div>
          
          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 mt-6 text-[#404040]">
            <Lock className="w-3 h-3" />
            <span className="text-xs font-mono">Secured authentication</span>
          </div>
          
          {/* Role Icons */}
          <div className="flex justify-center gap-8 mt-8 text-xs text-[#505050] font-mono uppercase tracking-wider">
            <span>Filmmakers</span>
            <span className="text-[#2A2A2A]">•</span>
            <span>Rental Houses</span>
          </div>
        </div>
        
        {/* Features - Compact */}
        <div className="w-full max-w-3xl mt-16 grid grid-cols-3 gap-4">
          <div className="text-center p-4">
            <div className="w-10 h-10 bg-[#800020]/10 border border-[#800020]/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-[#800020]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-white text-sm font-medium mb-1">AI Analysis</h3>
            <p className="text-[#505050] text-xs">Script to gear list</p>
          </div>
          
          <div className="text-center p-4">
            <div className="w-10 h-10 bg-[#800020]/10 border border-[#800020]/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-[#800020]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-white text-sm font-medium mb-1">Instant Quotes</h3>
            <p className="text-[#505050] text-xs">Compare rentals</p>
          </div>
          
          <div className="text-center p-4">
            <div className="w-10 h-10 bg-[#800020]/10 border border-[#800020]/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-[#800020]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-white text-sm font-medium mb-1">Secure Pay</h3>
            <p className="text-[#505050] text-xs">Stripe powered</p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-[#1A1A1A] py-4 bg-[#121212]/80 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-3">
          <img src="/logo.png" alt="Script-to-Gear" className="w-4 h-4 rounded opacity-50" />
          <span className="text-[#404040] text-xs font-mono">© 2024 Script-to-Gear</span>
        </div>
      </div>
    </div>
  );
}
