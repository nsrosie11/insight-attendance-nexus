
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Eye, User, Building, Calendar, Clock } from 'lucide-react';
import { useEmployeeList, useEmployeeAttendance } from '@/hooks/useAbsensi';

const EmployeeListView: React.FC = () => {
  const { data: employees, isLoading, error } = useEmployeeList();
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: attendanceData } = useEmployeeAttendance(selectedEmployee);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-blue-600">Loading data karyawan...</div>
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

  const getStatusBadge = (status: string) => {
    return status === 'Karyawan' ? (
      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
        <Building className="w-3 h-3 mr-1" />
        Karyawan Tetap
      </Badge>
    ) : (
      <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">
        <User className="w-3 h-3 mr-1" />
        Karyawan Magang
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return {
      formatted: date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      dayName: days[date.getDay()]
    };
  };

  const formatTime = (time: string | null) => {
    if (!time) return '-';
    return time;
  };

  const getAttendanceStatus = (jamMasuk: string | null, jamPulang: string | null) => {
    if (!jamMasuk && !jamPulang) return 'Absen';
    if (jamMasuk && !jamPulang) return 'Hadir (Belum Pulang)';
    if (jamMasuk && jamPulang) return 'Hadir';
    return 'Status Tidak Dikenal';
  };

  const handleViewDetails = (employeeName: string) => {
    setSelectedEmployee(employeeName);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/90 backdrop-blur-sm border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <User className="w-5 h-5" />
            Daftar Karyawan
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
                  <TableHead className="text-blue-800 font-semibold text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees?.map((employee, index) => (
                  <TableRow key={`${employee.nama}-${index}`} className="hover:bg-blue-50 transition-colors">
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium text-blue-900">{employee.nama}</TableCell>
                    <TableCell>{getStatusBadge(employee.status)}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                        onClick={() => handleViewDetails(employee.nama)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Lihat Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Attendance Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-blue-800 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Detail Absensi - {selectedEmployee}
            </DialogTitle>
          </DialogHeader>
          
          {attendanceData && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Ringkasan Kehadiran Bulan Ini</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Hari:</span>
                    <span className="ml-2 font-semibold">{attendanceData.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Hadir:</span>
                    <span className="ml-2 font-semibold text-green-600">
                      {attendanceData.filter(item => item.jam_masuk).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Terlambat:</span>
                    <span className="ml-2 font-semibold text-red-600">
                      {attendanceData.filter(item => item.terlambat).length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Hari</TableHead>
                      <TableHead>Jam Masuk</TableHead>
                      <TableHead>Jam Pulang</TableHead>
                      <TableHead>Terlambat</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceData.map((record, index) => {
                      const dateInfo = formatDate(record.tanggal);
                      return (
                        <TableRow key={index} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{dateInfo.formatted}</TableCell>
                          <TableCell>{dateInfo.dayName}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-blue-600" />
                              {formatTime(record.jam_masuk)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-green-600" />
                              {formatTime(record.jam_pulang)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {record.terlambat ? (
                              <Badge variant="destructive" className="text-xs">
                                ❌ Ya
                              </Badge>
                            ) : record.jam_masuk ? (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                ✅ Tidak
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={record.jam_masuk ? "default" : "secondary"}
                              className={record.jam_masuk ? "bg-green-100 text-green-800" : ""}
                            >
                              {getAttendanceStatus(record.jam_masuk, record.jam_pulang)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeListView;
