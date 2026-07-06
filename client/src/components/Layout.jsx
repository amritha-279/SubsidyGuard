import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, ShieldAlert, Users, LogOut } from 'lucide-react';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get active user info
  const userStr = localStorage.getItem('subsidy_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isOfficer = user?.role === 'OFFICER';

  const handleLogout = () => {
    localStorage.removeItem('subsidy_user');
    navigate('/login');
  };

  const navItems = isOfficer ? [
    { name: 'Dashboard Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Cluster Alerts', path: '/clusters', icon: Users },
  ] : [
    { name: 'POS Terminal', path: '/pos', icon: ShoppingCart },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-6 flex items-center gap-3 border-b border-gray-100">
          <ShieldAlert className={`w-8 h-8 ${isOfficer ? 'text-blue-600' : 'text-green-600'}`} />
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Subsidy Guard</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const activeColor = isOfficer ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700';
            const iconColor = isOfficer ? 'text-blue-600' : 'text-green-600';
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                  isActive 
                    ? activeColor 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? iconColor : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className={`${isOfficer ? 'bg-blue-50 text-blue-800' : 'bg-green-50 text-green-800'} p-4 rounded-lg text-sm mb-3`}>
            <p className="font-semibold">{user?.role === 'OFFICER' ? 'Officer Active' : 'Retailer Active'}</p>
            <p className="opacity-80">ID: {user?.id} ({user?.name})</p>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
