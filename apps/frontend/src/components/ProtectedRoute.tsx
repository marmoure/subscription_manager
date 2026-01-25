import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'admin' | 'super-admin'>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, checkTokenExpiration, logout, user } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = () => {
      if (isAuthenticated) {
        const isValid = checkTokenExpiration();
        if (!isValid) {
          logout();
        }
      }
      setIsChecking(false);
    };

    verifyAuth();
  }, [isAuthenticated, checkTokenExpiration, logout, location.pathname]);

  if (isChecking) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    // If user doesn't have required role, redirect to dashboard or show unauthorized
    // Preventing infinite loop if dashboard is also protected but requires different role (unlikely for dashboard)
    if (location.pathname !== '/admin') {
        return <Navigate to="/admin" replace />;
    }
    // If we are already at /admin and don't have permission (e.g. if /admin required super-admin), 
    // we should probably show an unauthorized message or logout.
    // For now, assuming /admin is accessible to basic 'admin'.
    // If 'admin' role tries to access 'super-admin' route, they go to /admin.
  }

  return <>{children}</>;
};

export default ProtectedRoute;
