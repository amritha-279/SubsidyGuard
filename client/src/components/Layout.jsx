import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, ShoppingCart, ShieldAlert, Users, LogOut,
  FileText, Bell, ClipboardList, Settings, BarChart2,
  MapPin, UserCheck, AlertTriangle, CheckSquare, ChevronDown, ChevronUp, Menu, X
} from 'lucide-react';

const OFFICER_NAV = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Transactions', path: '/admin/transactions', icon: FileText },
  { name: 'Transaction Approvals', path: '/admin/transaction-approvals', icon: CheckSquare },
  { name: 'Retailer Registrations', path: '/admin/approvals', icon: ShieldAlert },
  { name: 'Fraud Alerts', path: '/admin/fraud-alerts', icon: AlertTriangle },
  { name: 'Cluster Alerts', path: '/clusters', icon: Users },
  { name: 'Retailer Management', path: '/admin/retailers', icon: ShieldAlert },
  { name: 'Farmer Management', path: '/admin/farmers', icon: UserCheck },
  { name: 'Village Monitoring', path: '/admin/villages', icon: MapPin },
  { name: 'Analytics', path: '/admin/analytics', icon: BarChart2 },
  { name: 'Reports', path: '/admin/reports', icon: FileText },
  { name: 'Notifications', path: '/admin/notifications', icon: Bell },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
];

const RETAILER_NAV = [
  { name: 'POS Terminal', path: '/pos', icon: ShoppingCart },
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const userStr = localStorage.getItem('subsidy_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isOfficer = user?.role === 'OFFICER';
  const navItems = isOfficer ? OFFICER_NAV : RETAILER_NAV;

  const handleLogout = () => {
    localStorage.removeItem('subsidy_user');
    localStorage.removeItem('subsidy_token');
    navigate('/login');
  };

  const closeMobile = () => setMobileOpen(false);

  const SidebarContent = ({ mobile = false }) => (
    <aside className={`
      ${ mobile
        ? 'fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-white border-r border-gray-200 shadow-xl'
        : `${collapsed ? 'w-16' : 'w-64'} hidden md:flex flex-col bg-white border-r border-gray-200 shadow-sm transition-all duration-200 flex-shrink-0`
      }
    `}>
      <div className="p-4 flex items-center gap-3 border-b border-gray-100">
        <ShieldAlert className={`w-7 h-7 flex-shrink-0 ${isOfficer ? 'text-blue-600' : 'text-green-600'}`} />
        {(!collapsed || mobile) && <h1 className="text-lg font-bold text-gray-900 tracking-tight truncate">SubsidyGuard</h1>}
        {mobile
          ? <button onClick={closeMobile} className="ml-auto text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          : <button onClick={() => setCollapsed(!collapsed)} className="ml-auto text-gray-400 hover:text-gray-600">
              {collapsed ? <ChevronDown className="w-4 h-4 rotate-[-90deg]" /> : <ChevronUp className="w-4 h-4 rotate-[-90deg]" />}
            </button>
        }
      </div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const activeColor = isOfficer ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700';
          const iconColor = isOfficer ? 'text-blue-600' : 'text-green-600';
          return (
            <Link key={item.path} to={item.path} title={(!mobile && collapsed) ? item.name : ''}
              onClick={mobile ? closeMobile : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${isActive ? activeColor : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? iconColor : 'text-gray-400'}`} />
              {(!collapsed || mobile) && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-gray-100">
        {(!collapsed || mobile) && (
          <div className={`${isOfficer ? 'bg-blue-50 text-blue-800' : 'bg-green-50 text-green-800'} p-3 rounded-lg text-xs mb-2`}>
            <p className="font-semibold">{isOfficer ? 'Officer Active' : 'Retailer Active'}</p>
            <p className="opacity-70 truncate">{user?.name}</p>
          </div>
        )}
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium">
          <LogOut className="w-4 h-4" />
          {(!collapsed || mobile) && 'Sign Out'}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={closeMobile} />}

      {/* Mobile sidebar */}
      {mobileOpen && <SidebarContent mobile />}

      {/* Desktop sidebar */}
      <SidebarContent />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="text-gray-600 hover:text-gray-900">
            <Menu className="w-6 h-6" />
          </button>
          <ShieldAlert className={`w-5 h-5 ${isOfficer ? 'text-blue-600' : 'text-green-600'}`} />
          <span className="font-bold text-gray-900 text-sm">SubsidyGuard</span>
        </div>
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
