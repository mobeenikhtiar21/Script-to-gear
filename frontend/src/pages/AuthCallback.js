import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function AuthCallback() {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);
  
  useEffect(() => {
    // CRITICAL: Use ref to prevent double processing under StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    
    const processAuth = async () => {
      try {
        // Extract session_id from URL fragment
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const sessionId = params.get('session_id');
        
        if (!sessionId) {
          toast.error('No session ID found');
          navigate('/');
          return;
        }
        
        // Exchange session_id for user data
        const response = await axios.post(
          `${API_URL}/api/auth/session`,
          { session_id: sessionId },
          { withCredentials: true }
        );
        
        const { user, session_token } = response.data;
        
        // Set cookie (backend handles httpOnly cookie)
        // Navigate based on role
        if (!user.role) {
          // Need to select role
          navigate('/select-role', { state: { user }, replace: true });
        } else if (user.role === 'filmmaker') {
          navigate('/filmmaker/dashboard', { state: { user }, replace: true });
        } else if (user.role === 'rental_house') {
          navigate('/rental-house/dashboard', { state: { user }, replace: true });
        }
      } catch (error) {
        console.error('Auth error:', error);
        toast.error('Authentication failed');
        navigate('/');
      }
    };
    
    processAuth();
  }, [navigate]);
  
  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center">
      <div className="text-[#0066FF] text-lg" data-testid="auth-processing">Processing authentication...</div>
    </div>
  );
}