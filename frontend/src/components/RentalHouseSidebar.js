import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, FileText, Settings, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="w-64 h-screen bg-[#050505] border-r border-[#2A2A2A] flex flex-col fixed left-0 top-0" data-testid="rental-house-sidebar">
      {/* Logo Section */}
      <div className="p-4 border-b border-[#2A2A2A]">
        <button 
          onClick={() => navigate('/rental-house/dashboard')}
          className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity"
        >
          <img 
            src="/logo.png" 
            alt="Script-to-Gear" 
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div className="text-left">
            <div className="text-white font-semibold text-sm tracking-wide uppercase">Script-to-Gear</div>
            <div className="text-[#666666] text-xs font-mono">Rental House</div>
          </div>
        </button>
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
              className={`w-full px-6 py-3 flex items-center gap-3 transition-all ${
                active
                  ? 'bg-[#0066FF]/10 border-r-2 border-[#0066FF] text-[#0066FF]'
                  : 'text-[#808080] hover:bg-[#0A0A0A] hover:text-white border-r-2 border-transparent'
              }`}
              data-testid={item.testId}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      {/* User Section */}
      <div className="p-4 border-t border-[#2A2A2A]">
        <button
          onClick={() => navigate('/profile')}
          className="w-full mb-3 flex items-center gap-3 p-2 rounded hover:bg-[#0A0A0A] transition-colors"
          data-testid="sidebar-profile"
        >
          {user?.picture ? (
            <img src={user.picture} alt={user?.name} className="w-8 h-8 rounded-full border border-[#2A2A2A]" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#0066FF]/20 flex items-center justify-center border border-[#2A2A2A]">
              <User className="w-4 h-4 text-[#0066FF]" />
            </div>
          )}
          <div className="text-left flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{user?.company_name || user?.name}</div>
            <div className="text-[#666666] text-xs truncate font-mono">{user?.email}</div>
          </div>
        </button>
        <Button
          onClick={onLogout}
          variant="ghost"
          className="w-full justify-start text-[#666666] hover:text-white hover:bg-[#0A0A0A] px-3 text-sm"
          data-testid="sidebar-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}