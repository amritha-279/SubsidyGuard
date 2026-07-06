import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import POSPage from './pages/POSPage';
import AdminDashboard from './pages/AdminDashboard';
import ClustersPage from './pages/ClustersPage';

// Simple Route Protection Wrapper
const PrivateRoute = ({ children, allowedRoles }) => {
  const userStr = localStorage.getItem('subsidy_user');
  
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to their default dashboard if unauthorized for this route
      return <Navigate to={user.role === 'RETAILER' ? '/pos' : '/admin'} replace />;
    }
    return children;
  } catch (e) {
    localStorage.removeItem('subsidy_user');
    return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Retailer Routes */}
        <Route path="/pos" element={
          <PrivateRoute allowedRoles={['RETAILER']}>
            <Layout>
              <POSPage />
            </Layout>
          </PrivateRoute>
        } />

        {/* Protected Officer Routes */}
        <Route path="/admin" element={
          <PrivateRoute allowedRoles={['OFFICER']}>
            <Layout>
              <AdminDashboard />
            </Layout>
          </PrivateRoute>
        } />
        
        <Route path="/clusters" element={
          <PrivateRoute allowedRoles={['OFFICER']}>
            <Layout>
              <ClustersPage />
            </Layout>
          </PrivateRoute>
        } />

        {/* Redirect root based on login status */}
        <Route path="/" element={<Navigate to="/pos" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
