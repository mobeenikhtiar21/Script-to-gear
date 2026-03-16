import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import RentalHouseSidebar from './RentalHouseSidebar';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function RentalHouseLayout({ children }) {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchUser();
  }, []);
  
  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, { withCredentials: true });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
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
  
  return (
    <div className="min-h-screen bg-[#000000]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <RentalHouseSidebar user={user} onLogout={handleLogout} />
      </div>
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#050505] border-b border-[#2A2A2A] flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded" />
          <span className="text-white font-semibold text-sm uppercase tracking-wide">Script-to-Gear</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-white p-2 hover:bg-[#0A0A0A] rounded"
          data-testid="mobile-menu-button"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      
      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/80" onClick={() => setSidebarOpen(false)} />
          <div className="absolute top-14 left-0 bottom-0 w-64">
            <RentalHouseSidebar user={user} onLogout={handleLogout} />
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen bg-[#000000]">
        <div className="pt-14 lg:pt-0">
          {children}
        </div>
      </div>
    </div>
  );
}