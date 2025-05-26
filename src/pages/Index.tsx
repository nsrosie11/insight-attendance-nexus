
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Clock, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const Index = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [selectedDate, setSelectedDate] = useState('2024-01-15');

  // Data karyawan tetap
  const permanentEmployeeData = [
    { name: 'Laki-laki', value: 14, color: '#3B82F6' },
    { name: 'Perempuan', value: 1, color: '#EC4899' }
  ];

  // Data karyawan magang
  const internEmployeeData = [
    { name: 'Laki-laki', value: 3, color: '#10B981' },
    { name: 'Perempuan', value: 4, color: '#F59E0B' }
  ];

  // Data status kehadiran
  const attendanceStatusData = [
    { name: 'Tepat Waktu', value: 75, color: '#10B981' },
    { name: 'Terlambat', value: 25, color: '#EF4444' }
  ];

  // Sample student data
  const studentsData = [
    {
      id: 1,
      name: 'Dinda',
      status: 'Karyawan Magang',
      gender: 'Perempuan',
      onTime: 4,
      late: 7,
      absent: 10,
      history: [
        { date: '2024-01-15', timeIn: '08:00', timeOut: '17:00', status: 'Tepat Waktu' },
        { date: '2024-01-14', timeIn: '08:15', timeOut: '17:00', status: 'Terlambat' },
        { date: '2024-01-13', timeIn: '-', timeOut: '-', status: 'Tidak Hadir' }
      ]
    },
    {
      id: 2,
      name: 'Ahmad',
      status: 'Karyawan Tetap',
      gender: 'Laki-laki',
      onTime: 15,
      late: 3,
      absent: 2,
      history: [
        { date: '2024-01-15', timeIn: '07:55', timeOut: '17:00', status: 'Tepat Waktu' },
        { date: '2024-01-14', timeIn: '08:00', timeOut: '17:00', status: 'Tepat Waktu' },
        { date: '2024-01-13', timeIn: '08:10', timeOut: '17:00', status: 'Terlambat' }
      ]
    },
    {
      id: 3,
      name: 'Sari',
      status: 'Karyawan Magang',
      gender: 'Perempuan',
      onTime: 8,
      late: 5,
      absent: 7,
      history: [
        { date: '2024-01-15', timeIn: '08:05', timeOut: '17:00', status: 'Terlambat' },
        { date: '2024-01-14', timeIn: '07:58', timeOut: '17:00', status: 'Tepat Waktu' },
        { date: '2024-01-13', timeIn: '08:00', timeOut: '17:00', status: 'Tepat Waktu' }
      ]
    }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{`${payload[0].name}: ${payload[0].value} orang`}</p>
        </div>
      );
    }
    return null;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Tepat Waktu': 'bg-green-100 text-green-800 hover:bg-green-200',
      'Terlambat': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      'Tidak Hadir': 'bg-red-100 text-red-800 hover:bg-red-200'
    };
    return statusConfig[status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Dashboard Visualisasi Data Karyawan & Presensi
          </h1>
          <p className="text-gray-600 text-lg">
            Monitoring data karyawan dan tracking presensi mahasiswa secara real-time
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Karyawan Tetap</p>
                  <p className="text-3xl font-bold">15</p>
                </div>
                <Users className="h-12 w-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Total Karyawan Magang</p>
                  <p className="text-3xl font-bold">7</p>
                </div>
                <TrendingUp className="h-12 w-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Total Mahasiswa</p>
                  <p className="text-3xl font-bold">{studentsData.length}</p>
                </div>
                <Calendar className="h-12 w-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Kehadiran Hari Ini</p>
                  <p className="text-3xl font-bold">75%</p>
                </div>
                <Clock className="h-12 w-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pie Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Karyawan Tetap Chart */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-center text-blue-700">Karyawan Tetap (15 orang)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={permanentEmployeeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {permanentEmployeeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span className="font-medium">Laki-laki:</span>
                  <span className="font-bold text-blue-600">14 orang</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-pink-50 rounded">
                  <span className="font-medium">Perempuan:</span>
                  <span className="font-bold text-pink-600">1 orang</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Karyawan Magang Chart */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-center text-green-700">Karyawan Magang (7 orang)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={internEmployeeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {internEmployeeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <span className="font-medium">Laki-laki:</span>
                  <span className="font-bold text-green-600">3 orang</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                  <span className="font-medium">Perempuan:</span>
                  <span className="font-bold text-yellow-600">4 orang</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Kehadiran Chart */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-center text-purple-700">Status Kehadiran Hari Ini</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {attendanceStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <span className="font-medium">Tepat Waktu:</span>
                  <span className="font-bold text-green-600">75%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                  <span className="font-medium">Terlambat:</span>
                  <span className="font-bold text-red-600">25%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student Attendance Tracker */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-xl text-gray-800">Presensi Mahasiswa</CardTitle>
              <div className="flex gap-4">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Per Hari</SelectItem>
                    <SelectItem value="weekly">Per Minggu</SelectItem>
                    <SelectItem value="monthly">Per Bulan</SelectItem>
                  </SelectContent>
                </Select>
                {selectedPeriod === 'daily' && (
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border p-3 text-left font-semibold">Nama</th>
                    <th className="border p-3 text-center font-semibold">Status</th>
                    <th className="border p-3 text-center font-semibold">Gender</th>
                    <th className="border p-3 text-center font-semibold">Tepat Waktu</th>
                    <th className="border p-3 text-center font-semibold">Terlambat</th>
                    <th className="border p-3 text-center font-semibold">Tidak Hadir</th>
                    <th className="border p-3 text-center font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsData.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="border p-3 font-medium">{student.name}</td>
                      <td className="border p-3 text-center">
                        <Badge variant="secondary" className="text-xs">
                          {student.status}
                        </Badge>
                      </td>
                      <td className="border p-3 text-center">{student.gender}</td>
                      <td className="border p-3 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {student.onTime}x
                        </span>
                      </td>
                      <td className="border p-3 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {student.late}x
                        </span>
                      </td>
                      <td className="border p-3 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {student.absent}x
                        </span>
                      </td>
                      <td className="border p-3 text-center">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                              Detail
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-xl">Detail Presensi - {student.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 mt-4">
                              {/* Student Info */}
                              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                <div>
                                  <p className="font-semibold text-gray-700">Nama:</p>
                                  <p className="text-lg">{student.name}</p>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-700">Status:</p>
                                  <Badge variant="outline">{student.status}</Badge>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-700">Gender:</p>
                                  <p>{student.gender}</p>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-700">ID:</p>
                                  <p>#{student.id.toString().padStart(3, '0')}</p>
                                </div>
                              </div>

                              {/* Summary Stats */}
                              <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-3 bg-green-50 rounded-lg">
                                  <p className="text-2xl font-bold text-green-600">{student.onTime}</p>
                                  <p className="text-sm text-green-700">Tepat Waktu</p>
                                </div>
                                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                  <p className="text-2xl font-bold text-yellow-600">{student.late}</p>
                                  <p className="text-sm text-yellow-700">Terlambat</p>
                                </div>
                                <div className="text-center p-3 bg-red-50 rounded-lg">
                                  <p className="text-2xl font-bold text-red-600">{student.absent}</p>
                                  <p className="text-sm text-red-700">Tidak Hadir</p>
                                </div>
                              </div>

                              {/* Attendance History */}
                              <div>
                                <h3 className="font-semibold text-lg mb-3">Riwayat Presensi Terbaru</h3>
                                <div className="overflow-x-auto">
                                  <table className="w-full border-collapse border border-gray-300">
                                    <thead>
                                      <tr className="bg-gray-100">
                                        <th className="border border-gray-300 p-2 text-left">Tanggal</th>
                                        <th className="border border-gray-300 p-2 text-center">Jam Masuk</th>
                                        <th className="border border-gray-300 p-2 text-center">Jam Pulang</th>
                                        <th className="border border-gray-300 p-2 text-center">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {student.history.map((record, index) => (
                                        <tr key={index}>
                                          <td className="border border-gray-300 p-2">{record.date}</td>
                                          <td className="border border-gray-300 p-2 text-center">{record.timeIn}</td>
                                          <td className="border border-gray-300 p-2 text-center">{record.timeOut}</td>
                                          <td className="border border-gray-300 p-2 text-center">
                                            <Badge className={getStatusBadge(record.status)}>
                                              {record.status}
                                            </Badge>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
