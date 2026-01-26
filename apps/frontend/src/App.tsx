import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/admin/Dashboard';
import Licenses from './pages/admin/Licenses';
import LicenseDetail from './pages/admin/LicenseDetail';
import Submissions from './pages/admin/Submissions';
import ApiKeys from './pages/admin/ApiKeys';
import Login from './pages/admin/Login';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/admin/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/licenses" 
          element={
            <ProtectedRoute>
              <Licenses />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/licenses/:id" 
          element={
            <ProtectedRoute>
              <LicenseDetail />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/submissions" 
          element={
            <ProtectedRoute>
              <Submissions />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/api-keys" 
          element={
            <ProtectedRoute>
              <ApiKeys />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
};

export default App;