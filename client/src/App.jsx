import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';

// Retailer Module
import RetailerLayout from './pages/retailer/RetailerLayout';
import RetailerLogin from './pages/retailer/RetailerLogin';
import RetailerRegister from './pages/retailer/RetailerRegister';
import RetailerDashboard from './pages/retailer/RetailerDashboard';
import NewTransaction from './pages/retailer/NewTransaction';
import TransactionHistory from './pages/retailer/TransactionHistory';
import PendingApprovals from './pages/retailer/PendingApprovals';
import FarmerLookup from './pages/retailer/FarmerLookup';
import Inventory from './pages/retailer/Inventory';
import StockHistory from './pages/retailer/StockHistory';
import RetailerNotifications from './pages/retailer/RetailerNotifications';
import RetailerProfile from './pages/retailer/RetailerProfile';
import RetailerReports from './pages/retailer/RetailerReports';
import HelpSupport from './pages/retailer/HelpSupport';
import POSPage from './pages/POSPage';
import AdminDashboard from './pages/AdminDashboard';
import ClustersPage from './pages/ClustersPage';
import TransactionsPage from './pages/admin/TransactionsPage';
import TransactionApprovalsPage from './pages/admin/TransactionApprovalsPage';
import ApprovalCenterPage from './pages/admin/ApprovalCenterPage';
import FraudAlertsPage from './pages/admin/FraudAlertsPage';
import RetailerManagementPage from './pages/admin/RetailerManagementPage';
import FarmerManagementPage from './pages/admin/FarmerManagementPage';
import VillageMonitoringPage from './pages/admin/VillageMonitoringPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import ReportsPage from './pages/admin/ReportsPage';
import NotificationsPage from './pages/admin/NotificationsPage';
import SettingsPage from './pages/admin/SettingsPage';

import HomePage from './pages/HomePage';

const PrivateRoute = ({ children, allowedRoles }) => {
  const userStr = localStorage.getItem('subsidy_user');
  if (!userStr) return <Navigate to="/login" replace />;
  try {
    const user = JSON.parse(userStr);
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to={user.role === 'RETAILER' ? '/pos' : '/admin'} replace />;
    }
    return children;
  } catch {
    localStorage.removeItem('subsidy_user');
    return <Navigate to="/login" replace />;
  }
};

const OfficerRoute = ({ children }) => (
  <PrivateRoute allowedRoles={['OFFICER']}>
    <Layout>{children}</Layout>
  </PrivateRoute>
);

const RetailerRoute = ({ children }) => {
  const userStr = localStorage.getItem('retailer_user');
  if (!userStr) return <Navigate to="/retailer/login" replace />;
  try {
    JSON.parse(userStr);
    return children;
  } catch {
    localStorage.removeItem('retailer_user');
    return <Navigate to="/retailer/login" replace />;
  }
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Legacy POS */}
        <Route path="/pos" element={<PrivateRoute allowedRoles={['RETAILER']}><Layout><POSPage /></Layout></PrivateRoute>} />

        {/* Retailer Module — Public */}
        <Route path="/retailer/login" element={<RetailerLogin />} />
        <Route path="/retailer/register" element={<RetailerRegister />} />

        {/* Retailer Module — Protected */}
        <Route path="/retailer" element={<RetailerRoute><RetailerLayout /></RetailerRoute>}>
          <Route index element={<Navigate to="/retailer/dashboard" replace />} />
          <Route path="dashboard" element={<RetailerDashboard />} />
          <Route path="new-transaction" element={<NewTransaction />} />
          <Route path="transactions" element={<TransactionHistory />} />
          <Route path="pending" element={<PendingApprovals />} />
          <Route path="farmer-lookup" element={<FarmerLookup />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="inventory/history" element={<StockHistory />} />
          <Route path="reports" element={<RetailerReports />} />
          <Route path="notifications" element={<RetailerNotifications />} />
          <Route path="profile" element={<RetailerProfile />} />
          <Route path="help" element={<HelpSupport />} />
        </Route>

        {/* Officer - all 12 pages */}
        <Route path="/admin" element={<OfficerRoute><AdminDashboard /></OfficerRoute>} />
        <Route path="/admin/transactions" element={<OfficerRoute><TransactionsPage /></OfficerRoute>} />
        <Route path="/admin/transaction-approvals" element={<OfficerRoute><TransactionApprovalsPage /></OfficerRoute>} />
        <Route path="/admin/approvals" element={<OfficerRoute><ApprovalCenterPage /></OfficerRoute>} />
        <Route path="/admin/fraud-alerts" element={<OfficerRoute><FraudAlertsPage /></OfficerRoute>} />
        <Route path="/clusters" element={<OfficerRoute><ClustersPage /></OfficerRoute>} />
        <Route path="/admin/retailers" element={<OfficerRoute><RetailerManagementPage /></OfficerRoute>} />
        <Route path="/admin/farmers" element={<OfficerRoute><FarmerManagementPage /></OfficerRoute>} />
        <Route path="/admin/villages" element={<OfficerRoute><VillageMonitoringPage /></OfficerRoute>} />
        <Route path="/admin/analytics" element={<OfficerRoute><AnalyticsPage /></OfficerRoute>} />
        <Route path="/admin/reports" element={<OfficerRoute><ReportsPage /></OfficerRoute>} />
        <Route path="/admin/notifications" element={<OfficerRoute><NotificationsPage /></OfficerRoute>} />
        <Route path="/admin/settings" element={<OfficerRoute><SettingsPage /></OfficerRoute>} />

        <Route path="/" element={<HomePage />} />
      </Routes>
    </Router>
  );
}

export default App;
