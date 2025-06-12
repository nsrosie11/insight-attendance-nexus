
import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from '@/integrations/supabase/client';
import Login from './components/Login';
import Navbar from './components/Navbar';
import UserNavbar from './components/UserNavbar';
import PieChartView from './components/PieChartView';
import TableView from './components/TableView';
import ExcelUpload from './components/ExcelUpload';
import InformationPage from './components/InformationPage';
import ProfilePage from './components/ProfilePage';
import { useUserRole } from './hooks/useUserRole';

const queryClient = new QueryClient();

const AppContent = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('chart');
  const [user, setUser] = useState<any>(null);
  
  const { data: userRole, isLoading: roleLoading } = useUserRole();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsLoggedIn(true);
        setUser(session.user);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setIsLoggedIn(true);
        setUser(session.user);
      } else {
        setIsLoggedIn(false);
        setUser(null);
        setActiveTab('chart');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Set default tabs based on user role
  useEffect(() => {
    if (userRole && isLoggedIn) {
      if (userRole === 'admin') {
        setActiveTab('chart');
      } else {
        setActiveTab('information');
      }
    }
  }, [userRole, isLoggedIn]);

  const handleLogin = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error) {
      setIsLoggedIn(true);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUser(null);
    setActiveTab('chart');
  };

  const renderAdminContent = () => {
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
  };

  const renderUserContent = () => {
    switch (activeTab) {
      case 'information':
        return (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <InformationPage />
          </main>
        );
      case 'profile':
        return (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ProfilePage />
          </main>
        );
      default:
        return (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <InformationPage />
          </main>
        );
    }
  };

  if (roleLoading && isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="text-blue-600">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Toaster />
      <Sonner />
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
          {userRole === 'admin' ? (
            <Navbar 
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onLogout={handleLogout}
            />
          ) : (
            <UserNavbar 
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onLogout={handleLogout}
            />
          )}
          {userRole === 'admin' ? renderAdminContent() : renderUserContent()}
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
