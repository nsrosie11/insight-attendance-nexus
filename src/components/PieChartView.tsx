
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

const permanentEmployeeData = [
  { name: 'Laki-laki', value: 14, color: '#3B82F6' },
  { name: 'Perempuan', value: 1, color: '#93C5FD' },
];

const internEmployeeData = [
  { name: 'Laki-laki', value: 3, color: '#2563EB' },
  { name: 'Perempuan', value: 4, color: '#60A5FA' },
];

const attendanceData = [
  { name: 'Hadir', value: 80, color: '#1D4ED8' },
  { name: 'Tidak Hadir', value: 20, color: '#93C5FD' },
];

const PieChartView: React.FC = () => {
  const renderChart = (data: any[], title: string) => (
    <Card className="shadow-xl bg-white/80 backdrop-blur-sm border-blue-200">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold text-blue-800 mb-2">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                className="drop-shadow-lg"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #93C5FD',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="font-medium text-blue-700">{item.name}</span>
              </div>
              <span className="text-blue-800 font-bold">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">Info Pie Chart</h1>
          <p className="text-blue-600">Visualisasi Data Kehadiran Karyawan</p>
        </div>
        
        {/* Summary Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-xl bg-white/80 backdrop-blur-sm border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-blue-600">Total Karyawan Tetap</p>
                  <p className="text-3xl font-bold text-blue-800">15</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-xl bg-white/80 backdrop-blur-sm border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-blue-600">Total Karyawan Magang</p>
                  <p className="text-3xl font-bold text-blue-800">7</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {renderChart(permanentEmployeeData, "Karyawan Tetap")}
          {renderChart(internEmployeeData, "Karyawan Magang")}
          {renderChart(attendanceData, "Info Kehadiran")}
        </div>
      </div>
    </div>
  );
};

export default PieChartView;
