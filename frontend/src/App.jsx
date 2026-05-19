import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Transactions from './pages/Transactions';
import Users from './pages/Users';
import Transfer from './pages/Transfer';

const ProtectedLayout = ({ children }) => (
  <ProtectedRoute>
    <Navbar>{children}</Navbar>
  </ProtectedRoute>
);

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (user && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"        element={<Login />} />
          <Route path="/"             element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/products"     element={<ProtectedLayout><Products /></ProtectedLayout>} />
          <Route path="/inventory"    element={<ProtectedLayout><Inventory /></ProtectedLayout>} />
          <Route path="/transactions" element={<ProtectedLayout><Transactions /></ProtectedLayout>} />
          <Route path="/transfer"     element={<ProtectedLayout><AdminRoute><Transfer /></AdminRoute></ProtectedLayout>} />
          <Route path="/users"        element={<ProtectedLayout><AdminRoute><Users /></AdminRoute></ProtectedLayout>} />
          <Route path="*"             element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
