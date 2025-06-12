
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Eye, Clock, Calendar, User, Building } from 'lucide-react';
import { useAbsensi, type AbsensiData } from '@/hooks/useAbsensi';

const TableView: React.FC = () => {
  const { data: absensiData, isLoading, error } = useAbsensi();
  const [selectedEmployee, setSelectedEmployee] = useState<AbsensiData | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-blue-600">Loading data absensi...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Error loading data: {error.message}</div>
      </div>
    );
  }

  const formatTime = (time: string | null) => {
    if (!time) return '-';
    return time;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    return status === 'Karyawan' ? (
      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
        <Building className="w-3 h-3 mr-1" />
        Karyawan
      </Badge>
    ) : (
      <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">
        <User className="w-3 h-3 mr-1" />
        Magang
      </Badge>
    );
  };

  const getAttendanceStatus = (jamMasuk: string | null, jamPulang: string | null) => {
    if (!jamMasuk && !jamPulang) return 'Tidak Hadir';
    if (jamMasuk && !jamPulang) return 'Belum Pulang';
    if (jamMasuk && jamPulang) return 'Hadir Lengkap';
    return 'Status Tidak Dikenal';
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/90 backdrop-blur-sm border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Data Absensi Karyawan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-50">
                  <TableHead className="text-blue-800 font-semibold">No</TableHead>
                  <TableHead className="text-blue-800 font-semibold">Nama</TableHead>
                  <TableHead className="text-blue-800 font-semibold">Status</TableHead>
                  <TableHead className="text-blue-800 font-semibold">Tanggal</TableHead>
                  <TableHead className="text-blue-800 font-semibold">Jam Masuk</TableHead>
                  <TableHead className="text-blue-800 font-semibold">Jam Pulang</TableHead>
                  <TableHead className="text-blue-800 font-semibold">Keterangan</TableHead>
                  <TableHead className="text-blue-800 font-semibold text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {absensiData?.map((item, index) => (
                  <TableRow key={item.id} className="hover:bg-blue-50 transition-colors">
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium text-blue-900">{item.nama}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{formatDate(item.tanggal)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-blue-600" />
                        {formatTime(item.jam_masuk)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-green-600" />
                        {formatTime(item.jam_pulang)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {getAttendanceStatus(item.jam_masuk, item.jam_pulang)}
                        </div>
                        {item.terlambat && (
                          <Badge variant="destructive" className="text-xs">
                            Terlambat
                          </Badge>
                        )}
                        {item.pulang_tercatat && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            Pulang Tepat Waktu
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-200 text-blue-600 hover:bg-blue-50"
                            onClick={() => setSelectedEmployee(item)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-blue-800">Detail Absensi</DialogTitle>
                          </DialogHeader>
                          {selectedEmployee && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Nama:</label>
                                  <p className="text-blue-900 font-semibold">{selectedEmployee.nama}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Status:</label>
                                  <div className="mt-1">{getStatusBadge(selectedEmployee.status)}</div>
                                </div>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium text-gray-600">Tanggal:</label>
                                <p className="text-gray-900">{formatDate(selectedEmployee.tanggal)}</p>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Jam Masuk:</label>
                                  <p className="text-blue-900 font-mono text-lg">
                                    {formatTime(selectedEmployee.jam_masuk)}
                                  </p>
                                  {selectedEmployee.terlambat && (
                                    <Badge variant="destructive" className="text-xs mt-1">
                                      Terlambat
                                    </Badge>
                                  )}
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Jam Pulang:</label>
                                  <p className="text-green-900 font-mono text-lg">
                                    {formatTime(selectedEmployee.jam_pulang)}
                                  </p>
                                  {selectedEmployee.pulang_tercatat && (
                                    <Badge className="bg-green-100 text-green-800 text-xs mt-1">
                                      Pulang Tepat Waktu
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="bg-blue-50 p-3 rounded-lg">
                                <h4 className="font-medium text-blue-800 mb-2">Ringkasan Kehadiran</h4>
                                <p className="text-sm text-blue-700">
                                  Status: {getAttendanceStatus(selectedEmployee.jam_masuk, selectedEmployee.jam_pulang)}
                                </p>
                                {selectedEmployee.jam_masuk && selectedEmployee.jam_pulang && (
                                  <p className="text-sm text-blue-700 mt-1">
                                    Durasi kerja: {(() => {
                                      const masuk = new Date(`2025-01-01 ${selectedEmployee.jam_masuk}`);
                                      const pulang = new Date(`2025-01-01 ${selectedEmployee.jam_pulang}`);
                                      const diff = pulang.getTime() - masuk.getTime();
                                      const hours = Math.floor(diff / (1000 * 60 * 60));
                                      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                      return `${hours} jam ${minutes} menit`;
                                    })()}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TableView;
