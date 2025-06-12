
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, XCircle } from 'lucide-react';
import { useAbsensi } from '@/hooks/useAbsensi';

const InformationPage: React.FC = () => {
  const [recapType, setRecapType] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  
  const { data: absensiData, isLoading } = useAbsensi();

  // Calculate attendance statistics
  const calculateStats = () => {
    if (!absensiData) return { late: 0, onTime: 0, absent: 0 };
    
    const late = absensiData.filter(item => item.terlambat).length;
    const onTime = absensiData.filter(item => !item.terlambat && item.jam_masuk).length;
    const absent = absensiData.filter(item => !item.jam_masuk).length;
    
    return { late, onTime, absent };
  };

  const stats = calculateStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-blue-600">Loading data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-800 text-lg flex items-center">
              <XCircle className="w-5 h-5 mr-2" />
              Terlambat
            </CardTitle>
            <CardDescription className="text-red-600">Total keterlambatan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900">{stats.late}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-800 text-lg flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Tepat Waktu
            </CardTitle>
            <CardDescription className="text-green-600">Kehadiran tepat waktu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{stats.onTime}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-orange-800 text-lg flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Tidak Hadir
            </CardTitle>
            <CardDescription className="text-orange-600">Total absen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">{stats.absent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Section */}
      <Card className="bg-white/90 backdrop-blur-sm border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-blue-800">Filter Rekap Absensi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-blue-700 mb-2">
                Jenis Rekap
              </label>
              <Select value={recapType} onValueChange={setRecapType}>
                <SelectTrigger className="border-blue-200">
                  <SelectValue placeholder="Pilih jenis rekap" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Rekapan Bulanan</SelectItem>
                  <SelectItem value="weekly">Rekapan Mingguan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-blue-700 mb-2">
                Bulan
              </label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border-blue-200"
              />
            </div>
            
            {recapType === 'weekly' && (
              <div className="flex-1">
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  Minggu ke-
                </label>
                <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                  <SelectTrigger className="border-blue-200">
                    <SelectValue placeholder="Pilih minggu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Minggu 1</SelectItem>
                    <SelectItem value="2">Minggu 2</SelectItem>
                    <SelectItem value="3">Minggu 3</SelectItem>
                    <SelectItem value="4">Minggu 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <Button className="bg-blue-500 hover:bg-blue-600">
              Tampilkan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card className="bg-white/90 backdrop-blur-sm border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-blue-800">Riwayat Absensi</CardTitle>
          <CardDescription className="text-blue-600">
            Data absensi Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-blue-200">
                  <th className="text-left p-3 text-blue-800 font-medium">Tanggal</th>
                  <th className="text-left p-3 text-blue-800 font-medium">Jam Masuk</th>
                  <th className="text-left p-3 text-blue-800 font-medium">Jam Pulang</th>
                  <th className="text-left p-3 text-blue-800 font-medium">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {absensiData?.slice(0, 10).map((item) => (
                  <tr key={item.id} className="border-b border-blue-100 hover:bg-blue-50">
                    <td className="p-3 text-blue-900">{item.tanggal}</td>
                    <td className="p-3 text-blue-900">{item.jam_masuk || '-'}</td>
                    <td className="p-3 text-blue-900">{item.jam_pulang || '-'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.terlambat 
                          ? 'bg-red-100 text-red-800'
                          : item.jam_masuk 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                      }`}>
                        {item.terlambat ? 'Terlambat' : item.jam_masuk ? 'Tepat Waktu' : 'Tidak Hadir'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InformationPage;
