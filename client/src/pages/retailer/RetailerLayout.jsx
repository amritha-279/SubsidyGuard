import { useState, useEffect } from 'react';
import { NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, PlusCircle, FileText, Clock, Search,
  Package, Bell, User, HelpCircle, LogOut, ShieldAlert,
  ChevronDown, ChevronUp, Menu, X, BarChart2, AlertCircle, History
} from 'lucide-react';

const NAV = [
  { name: 'Dashboard',          path: '/retailer/dashboard',       icon: LayoutDashboard },
  { name: 'New Transaction',    path: '/retailer/new-transaction',  icon: PlusCircle },
  { name: 'Transaction History',path: '/retailer/transactions',     icon: FileText },
  { name: 'Pending Approvals',  path: '/retailer/pending',          icon: Clock },
  { name: 'Farmer Lookup',      path: '/retailer/farmer-lookup',    icon: Search },
  { name: 'Inventory',          path: '/retailer/inventory',        icon: Package },
  { name: 'Stock History',      path: '/retailer/inventory/history',icon: History },
  { name: 'Reports',            path: '/retailer/reports',          icon: BarChart2 },
  { name: 'Notifications',      path: '/retailer/notifications',    icon: Bell },
  { name: 'Profile',            path: '/retailer/profile',          icon: User },
  { name: 'Help & Support',     path: '/retailer/help',             icon: HelpCircle },
];

const PAGE_TITLES = {
  '/retailer/dashboard':       'Dashboard',
  '/retailer/new-transaction': 'New Transaction',
  '/retailer/transactions':    'Transaction History',
  '/retailer/pending':         'Pending Approvals',
  '/retailer/farmer-lookup':   'Farmer Lookup',
  '/retailer/inventory':       'Inventory Management',
  '/retailer/inventory/history':'Stock History',
  '/retailer/reports':         'Reports',
  '/retailer/notifications':   'Notifications',
  '/retailer/profile':         'My Profile',
  '/retailer/help':            'Help & Support',
};

export default function RetailerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dbUser, setDbUser] = useState(null);
  const pageTitle = PAGE_TITLES[location.pathname] || 'Retailer Portal';

  const storedUser = JSON.parse(localStorage.getItem('retailer_user') || '{}');
  const token = storedUser.token;

  // Always fetch fresh user data from DB
  useEffect(() => {
    if (!token) return;
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setDbUser(data);
        // keep localStorage in sync
        localStorage.setItem('retailer_user', JSON.stringify({ ...storedUser, ...data, token }));
      })
      .catch(() => {});
  }, []);

  const user = dbUser || storedUser;
  const isProfileIncomplete = user && (!user.shopName || !user.mobile || !user.district);
  const isOnProfilePage = location.pathname === '/retailer/profile';

  const handleLogout = () => {
    localStorage.removeItem('retailer_user');
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
        <ShieldAlert className="w-7 h-7 flex-shrink-0 text-green-600" />
        {(!collapsed || mobile) && <h1 className="text-lg font-bold text-gray-900 tracking-tight truncate">SubsidyGuard</h1>}
        {mobile
          ? <button onClick={closeMobile} className="ml-auto text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          : <button onClick={() => setCollapsed(!collapsed)} className="ml-auto text-gray-400 hover:text-gray-600">
              {collapsed ? <ChevronDown className="w-4 h-4 rotate-[-90deg]" /> : <ChevronUp className="w-4 h-4 rotate-[-90deg]" />}
            </button>
        }
      </div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ name, path, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <NavLink key={path} to={path} title={(!mobile && collapsed) ? name : ''}
              onClick={mobile ? closeMobile : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${
                isActive ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}>
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
              {(!collapsed || mobile) && <span className="truncate">{name}</span>}
            </NavLink>
          );
        })}
      </nav>
      <div className="p-3 border-t border-gray-100">
        {(!collapsed || mobile) && (
          <div className="bg-green-50 text-green-800 p-3 rounded-lg text-xs mb-2">
            <p className="font-semibold">Retailer Active</p>
            <p className="opacity-70 truncate">{user.shopName || user.name || user.email || 'Retailer'}</p>
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
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={closeMobile} />}
      {mobileOpen && <SidebarContent mobile />}
      <SidebarContent />

      <main className="flex-1 overflow-y-auto">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="text-gray-600 hover:text-gray-900">
            <Menu className="w-6 h-6" />
          </button>
          <ShieldAlert className="w-5 h-5 text-green-600" />
          <span className="font-bold text-gray-900 text-sm">{pageTitle}</span>
        </div>
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {isProfileIncomplete && !isOnProfilePage && (
            <div className="mb-4 flex items-center gap-3 bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-3 text-sm text-yellow-800">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-yellow-600" />
              <span>Your profile is incomplete. Please fill in your shop details.</span>
              <button onClick={() => navigate('/retailer/profile')} className="ml-auto text-xs font-semibold text-yellow-700 underline hover:text-yellow-900">Complete Profile →</button>
            </div>
          )}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
