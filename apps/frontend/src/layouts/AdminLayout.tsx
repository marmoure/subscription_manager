import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CreditCard, 
  FileText, 
  Key, 
  Settings, 
  LogOut, 
  Menu,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Licenses', href: '/admin/licenses', icon: CreditCard },
  { name: 'Submissions', href: '/admin/submissions', icon: FileText },
  { name: 'API Keys', href: '/admin/api-keys', icon: Key },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 transform bg-white dark:bg-gray-800 transition-transform duration-200 ease-in-out border-r border-gray-200 dark:border-gray-700 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-center border-b border-gray-200 dark:border-gray-700">
          <Link to="/admin" className="flex items-center gap-2 font-bold text-xl text-primary">
            <span>Vibe Admin</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <span className="font-semibold text-gray-900 dark:text-white">Vibe Admin</span>
          </div>

          <div className="flex flex-1 justify-end items-center gap-4">
            <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex flex-col items-end hidden sm:flex">
                    <span className="font-medium">{user?.username || 'Admin'}</span>
                    <span className="text-xs text-gray-500 capitalize">{user?.role || 'Role'}</span>
                </div>
                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
            </div>

            <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
