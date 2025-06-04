
import React, { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from './components/Login';
import Navbar from './components/Navbar';
import PieChartView from './components/PieChartView';
import TableView from './components/TableView';

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
        return <PieChartView />;
      case 'table':
        return <TableView />;
      default:
        return <PieChartView />;
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
          <div className="min-h-screen">
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
