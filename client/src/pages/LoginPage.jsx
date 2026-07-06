import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, User, Lock, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const [role, setRole] = useState('RETAILER');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e?.preventDefault();
    if (!username && !password && e) return; // Basic validation if not demo

    // Mock Login: Save role to local storage
    const user = {
      role: role,
      name: role === 'RETAILER' ? 'Kisan Seva Kendra' : 'Agri Officer Desk',
      id: role === 'RETAILER' ? 'RET001' : 'OFFICER-99'
    };
    
    localStorage.setItem('subsidy_user', JSON.stringify(user));
    
    // Route based on role
    if (role === 'RETAILER') {
      navigate('/pos');
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4 shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Subsidy Guard</h1>
          <p className="text-gray-500 mt-2">Secure Fertilizer Distribution Network</p>
        </div>

        {/* Card */}
        <div className="card shadow-xl border-t-4 border-t-green-500 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Role Toggle */}
            <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium">
              <button
                type="button"
                onClick={() => setRole('RETAILER')}
                className={`flex-1 py-2 rounded-md transition-all ${
                  role === 'RETAILER' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Retailer POS
              </button>
              <button
                type="button"
                onClick={() => setRole('OFFICER')}
                className={`flex-1 py-2 rounded-md transition-all ${
                  role === 'OFFICER' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Agri Officer
              </button>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="input-field pl-10"
                    placeholder="Enter ID"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    className="input-field pl-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-3">
              <button 
                type="submit" 
                className={`w-full btn py-3 text-white shadow-md hover:shadow-lg transition-all ${
                  role === 'RETAILER' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Login as {role === 'RETAILER' ? 'Retailer' : 'Officer'}
              </button>
            </div>

          </form>
        </div>
        
        <p className="text-center text-gray-400 text-xs mt-8">
          &copy; 2026 Subsidy Guard System
        </p>
      </div>
    </div>
  );
}
