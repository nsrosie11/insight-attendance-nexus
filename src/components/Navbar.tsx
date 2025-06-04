
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange, onLogout }) => {
  return (
    <nav className="bg-white/90 backdrop-blur-sm border-b border-blue-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex space-x-8">
            <button
              onClick={() => onTabChange('chart')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'chart'
                  ? 'bg-blue-100 text-blue-700 shadow-sm'
                  : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              Info Pie Chart
            </button>
            <button
              onClick={() => onTabChange('table')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'table'
                  ? 'bg-blue-100 text-blue-700 shadow-sm'
                  : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              Tabel Data
            </button>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
