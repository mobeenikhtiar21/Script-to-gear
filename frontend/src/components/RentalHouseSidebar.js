import { useNavigate, useLocation } from 'react-router-dom';
import { Film, LayoutDashboard, Package, FileText, Settings, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function RentalHouseSidebar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/rental-house/dashboard',
      testId: 'nav-dashboard'
    },
    {
      label: 'Leads',
      icon: FileText,
      path: '/rental-house/leads',
      testId: 'nav-leads'
    },
    {
      label: 'Inventory',
      icon: Package,
      path: '/rental-house/inventory',
      testId: 'nav-inventory'
    },
    {
      label: 'Payments',
      icon: Settings,
      path: '/rental-house/payments',
      testId: 'nav-payments'
    }
  ];
  
  const isActive = (path) => location.pathname === path;
  
  return (
    <div className="w-64 h-screen bg-[#0F0F0F] border-r border-[#2A2A2A] flex flex-col fixed left-0 top-0" data-testid="rental-house-sidebar">
      {/* Logo Section */}
      <div className="p-6 border-b border-[#2A2A2A]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0066FF] rounded flex items-center justify-center">
            <Film className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-white font-semibold text-lg leading-tight">Script-to-Gear</div>
            <div className="text-[#666666] text-xs">Rental House</div>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 py-4" data-testid="sidebar-navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full px-6 py-3 flex items-center gap-3 transition-colors ${
                active
                  ? 'bg-[#0066FF]/10 border-r-2 border-[#0066FF] text-[#0066FF]'
                  : 'text-[#A1A1A1] hover:bg-[#1A1A1A] hover:text-white'
              }`}
              data-testid={item.testId}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      {/* User Section */}
      <div className="p-6 border-t border-[#2A2A2A]">
        <button
          onClick={() => navigate('/profile')}
          className="w-full mb-4 flex items-center gap-3 p-2 rounded hover:bg-[#1A1A1A] transition-colors"
          data-testid="sidebar-profile"
        >
          {user?.picture ? (
            <img src={user.picture} alt={user?.name} className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#0066FF]/20 flex items-center justify-center">
              <User className="w-4 h-4 text-[#0066FF]" />
            </div>
          )}
          <div className="text-left flex-1">
            <div className="text-white text-sm font-medium truncate">{user?.company_name || user?.name}</div>
            <div className="text-[#666666] text-xs truncate">{user?.email}</div>
          </div>
        </button>
        <Button
          onClick={onLogout}
          variant="ghost"
          className="w-full justify-start text-[#A1A1A1] hover:text-white hover:bg-[#1A1A1A] px-3"
          data-testid="sidebar-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}