
import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import PieChartView from '@/components/PieChartView';
import TableView from '@/components/TableView';

const queryClient = new QueryClient();

const Index = () => {
  const [activeTab, setActiveTab] = useState('chart');

  const handleLogout = () => {
    console.log('Logout clicked');
    // Implementasi logout bisa ditambahkan di sini
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <Navbar 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          onLogout={handleLogout}
        />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'chart' && <PieChartView />}
          {activeTab === 'table' && <TableView />}
        </main>
      </div>
    </QueryClientProvider>
  );
};

export default Index;
