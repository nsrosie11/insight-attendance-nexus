
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGenderStats, useAbsensiStats } from '@/hooks/useAbsensi';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];

const PieChartView: React.FC = () => {
  const { data: genderStats, isLoading: isGenderLoading } = useGenderStats();
  const { data: absensiStats, isLoading: isStatsLoading } = useAbsensiStats();

  if (isGenderLoading || isStatsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-blue-600">Loading data...</div>
      </div>
    );
  }

  const karyawanData = [
    { name: 'Laki-laki', value: genderStats?.karyawan.male || 0 },
    { name: 'Perempuan', value: genderStats?.karyawan.female || 0 },
  ];

  const magangData = [
    { name: 'Laki-laki', value: genderStats?.magang.male || 0 },
    { name: 'Perempuan', value: genderStats?.magang.female || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-800 text-lg">Total Karyawan</CardTitle>
            <CardDescription className="text-blue-600">Seluruh karyawan aktif</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{absensiStats?.total || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-800 text-lg">Karyawan Tetap</CardTitle>
            <CardDescription className="text-green-600">Karyawan tetap aktif</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{absensiStats?.karyawan || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-orange-800 text-lg">Karyawan Magang</CardTitle>
            <CardDescription className="text-orange-600">Karyawan magang aktif</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">{absensiStats?.magang || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/90 backdrop-blur-sm border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-blue-800">Distribusi Gender - Karyawan Tetap</CardTitle>
            <CardDescription className="text-blue-600">
              Total: {(genderStats?.karyawan.male || 0) + (genderStats?.karyawan.female || 0)} orang
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={karyawanData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {karyawanData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-blue-800">Distribusi Gender - Karyawan Magang</CardTitle>
            <CardDescription className="text-blue-600">
              Total: {(genderStats?.magang.male || 0) + (genderStats?.magang.female || 0)} orang
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={magangData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {magangData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PieChartView;
