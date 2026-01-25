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
  X,
  User,
  Zap
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
  { name: 'API Keys', href: '/admin/api-keys', icon: Key, future: true },
  { name: 'Settings', href: '/admin/settings', icon: Settings, future: true },
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

  const currentPath = location.pathname;
  const activeNavItem = navigation.find(item => item.href === currentPath) || navigation[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row">
      {/* Mobile Sidebar Overlay */}
      <div 
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/80 backdrop-blur-sm lg:hidden transition-opacity duration-300",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-64 transform bg-white dark:bg-slate-900 transition-transform duration-300 ease-in-out border-r border-slate-200 dark:border-slate-800 lg:translate-x-0 flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center px-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <Link to="/admin" className="flex items-center gap-2 font-bold text-xl text-primary">
            <div className="bg-primary rounded-md p-1 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="tracking-tight">Vibe Manager</span>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-auto lg:hidden" 
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5 text-slate-500" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 group",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className={cn(
                  "h-4 w-4 shrink-0 transition-colors", 
                  isActive ? "text-primary-foreground" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                )} />
                <span className="truncate">{item.name}</span>
                {item.future && (
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded leading-none">
                    Soon
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3 px-2 py-2">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                    <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold truncate text-slate-900 dark:text-slate-200">
                      {user?.username || 'Admin User'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 capitalize truncate font-medium">
                      {user?.role || 'Administrator'}
                    </span>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 dark:border-slate-800 dark:bg-slate-900/80 sm:px-6 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-600 dark:text-slate-400"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="lg:hidden font-bold text-lg tracking-tight text-slate-900 dark:text-white mr-2 border-r border-slate-200 dark:border-slate-700 pr-4">Vibe</span>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <activeNavItem.icon className="h-4 w-4 lg:hidden" />
                {activeNavItem.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 pr-4 border-r border-slate-200 dark:border-slate-800">
                <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                      {user?.username || 'Admin User'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 capitalize font-medium">
                      {user?.role || 'Administrator'}
                    </span>
                </div>
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                    <User className="h-5 w-5 text-primary" />
                </div>
            </div>
            
            <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="h-9 px-3 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/30 dark:hover:text-red-400 dark:hover:border-red-900 transition-all duration-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}