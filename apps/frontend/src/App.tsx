import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/admin/Login';
import { useAuth } from './hooks/useAuth';

const App: React.FC = () => {
  const { checkTokenExpiration, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const isValid = checkTokenExpiration();
      if (!isValid) {
        logout();
      }
    }
  }, [isAuthenticated, checkTokenExpiration, logout]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
};

export default App;