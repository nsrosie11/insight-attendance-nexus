
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
import InformationPage from './components/InformationPage';
import ProfilePage from './components/ProfilePage';
import ExcelUpload from './components/ExcelUpload';

const queryClient = new QueryClient();

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const [activeTab, setActiveTab] = useState('chart');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        // Get user role from user_roles table
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        
        setUserRole(roleData?.role || 'user');
        setActiveTab(roleData?.role === 'admin' ? 'chart' : 'information');
      }
      setLoading(false);
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsLoggedIn(true);
        // Get user role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        
        setUserRole(roleData?.role || 'user');
        setActiveTab(roleData?.role === 'admin' ? 'chart' : 'information');
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setUserRole(null);
        setActiveTab('chart');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      // Get user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();
      
      setUserRole(roleData?.role || 'user');
      setIsLoggedIn(true);
      setActiveTab(roleData?.role === 'admin' ? 'chart' : 'information');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserRole(null);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="text-blue-600">Memuat...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {!isLoggedIn ? (
          <Login onLogin={handleLogin} />
        ) : (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
            {userRole === 'admin' ? (
              <>
                <Navbar 
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  onLogout={handleLogout}
                />
                {renderAdminContent()}
              </>
            ) : (
              <>
                <UserNavbar 
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  onLogout={handleLogout}
                />
                {renderUserContent()}
              </>
            )}
          </div>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
