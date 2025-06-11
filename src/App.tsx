
import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from '@/integrations/supabase/client';
import Login from './components/Login';
import Navbar from './components/Navbar';
import PieChartView from './components/PieChartView';
import TableView from './components/TableView';
import ExcelUpload from './components/ExcelUpload';
import UserAbsensiView from './components/UserAbsensiView';
import UserProfile from './components/UserProfile';
import { useUserRole } from './hooks/useUserRole';

const queryClient = new QueryClient();

const AppContent = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('');
  const [user, setUser] = useState(null);
  const { data: userRole, isLoading } = useUserRole();

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoggedIn(!!session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setIsLoggedIn(!!session);
      if (!session) {
        setActiveTab('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    // Set default tab based on user role
    if (userRole === 'admin' && !activeTab) {
      setActiveTab('chart');
    } else if (userRole === 'user' && !activeTab) {
      setActiveTab('absensi');
    }
  }, [userRole, activeTab]);

  const handleLogin = () => {
    // Login is handled by Supabase auth now
    console.log('Login successful');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setActiveTab('');
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading...</div>
        </main>
      );
    }

    const isAdmin = userRole === 'admin';

    if (isAdmin) {
      // Admin content
      switch (activeTab) {
        case 'chart':
          return (
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="space-y-6">
                <ExcelUpload />
                <PieChartView />
              </div>
            </main>
          );
        case 'table':
          return (
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <TableView />
            </main>
          );
        default:
          return (
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="space-y-6">
                <ExcelUpload />
                <PieChartView />
              </div>
            </main>
          );
      }
    } else {
      // User content
      switch (activeTab) {
        case 'absensi':
          return <UserAbsensiView />;
        case 'profile':
          return <UserProfile />;
        default:
          return <UserAbsensiView />;
      }
    }
  };

  return (
    <>
      <Toaster />
      <Sonner />
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
          <Navbar 
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onLogout={handleLogout}
          />
          {renderContent()}
        </div>
      )}
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
