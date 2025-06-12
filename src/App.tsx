
import React, { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from './components/Login';
import Navbar from './components/Navbar';
import PieChartView from './components/PieChartView';
import TableView from './components/TableView';
import ExcelUpload from './components/ExcelUpload';

const queryClient = new QueryClient();

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('chart');

  const handleLogin = (email: string, password: string) => {
    // Simple validation - in real app, you'd validate against backend
    if (email && password) {
      setIsLoggedIn(true);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveTab('chart');
  };

  const renderContent = () => {
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

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
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
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
