
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Employee {
  id: number;
  nama: string;
  tipe: 'tetap' | 'magang';
  tanggal: string;
  jamDatang: string;
  jamPulang: string;
  status: string;
  totalHadir: number;
  totalTerlambat: number;
  totalTidakHadir: number;
}

const tableData: Employee[] = [
  {
    id: 1,
    nama: 'Ahmad Rahman',
    tipe: 'tetap',
    tanggal: '02-05-25',
    jamDatang: '08:29:00',
    jamPulang: '16:12:00',
    status: 'Hadir',
    totalHadir: 20,
    totalTerlambat: 3,
    totalTidakHadir: 2
  },
  {
    id: 2,
    nama: 'Siti Nurhaliza',
    tipe: 'tetap',
    tanggal: '02-05-25',
    jamDatang: '08:15:00',
    jamPulang: '16:00:00',
    status: 'Hadir',
    totalHadir: 22,
    totalTerlambat: 1,
    totalTidakHadir: 2
  },
  {
    id: 3,
    nama: 'Budi Santoso',
    tipe: 'magang',
    tanggal: '02-05-25',
    jamDatang: '09:15:00',
    jamPulang: '16:05:00',
    status: 'Terlambat',
    totalHadir: 18,
    totalTerlambat: 5,
    totalTidakHadir: 2
  },
  {
    id: 4,
    nama: 'Maya Sari',
    tipe: 'tetap',
    tanggal: '02-05-25',
    jamDatang: '-',
    jamPulang: '-',
    status: 'Tidak Hadir',
    totalHadir: 15,
    totalTerlambat: 2,
    totalTidakHadir: 8
  },
  {
    id: 5,
    nama: 'Dian Pratama',
    tipe: 'magang',
    tanggal: '02-05-25',
    jamDatang: '08:05:00',
    jamPulang: '16:30:00',
    status: 'Hadir',
    totalHadir: 19,
    totalTerlambat: 4,
    totalTidakHadir: 2
  }
];

const TableView: React.FC = () => {
  const [employeeFilter, setEmployeeFilter] = useState<string>('semua');
  const [periodFilter, setPeriodFilter] = useState<string>('hari');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Hadir':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Terlambat':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Tidak Hadir':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredData = tableData.filter(employee => {
    if (employeeFilter === 'semua') return true;
    return employee.tipe === employeeFilter;
  });

  const handleShowDetail = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDetail(true);
  };

  const DetailModal = () => {
    if (!selectedEmployee) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md shadow-xl bg-white">
          <CardHeader>
            <CardTitle className="text-blue-800">Detail Karyawan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-blue-700">{selectedEmployee.nama}</h3>
              <p className="text-sm text-blue-600 capitalize">Tipe: {selectedEmployee.tipe}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-600">Total Hadir</p>
                <p className="text-2xl font-bold text-green-800">{selectedEmployee.totalHadir}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-600">Total Terlambat</p>
                <p className="text-2xl font-bold text-yellow-800">{selectedEmployee.totalTerlambat}</p>
              </div>
            </div>
            
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-red-600">Total Tidak Hadir</p>
              <p className="text-2xl font-bold text-red-800">{selectedEmployee.totalTidakHadir}</p>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={() => setShowDetail(false)}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                Tutup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto">
        <Card className="shadow-xl bg-white/80 backdrop-blur-sm border-blue-200">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-blue-800 mb-2">
              Tabel Data
            </CardTitle>
            <p className="text-blue-600">Data Presensi Karyawan</p>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center space-x-2">
                <label className="text-blue-700 font-medium">Tipe Karyawan:</label>
                <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                  <SelectTrigger className="w-40 border-blue-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semua">Semua</SelectItem>
                    <SelectItem value="tetap">Karyawan Tetap</SelectItem>
                    <SelectItem value="magang">Karyawan Magang</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-blue-700 font-medium">Periode:</label>
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger className="w-32 border-blue-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hari">Per Hari</SelectItem>
                    <SelectItem value="minggu">Per Minggu</SelectItem>
                    <SelectItem value="bulan">Per Bulan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-blue-700 font-medium">Tanggal:</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-48 justify-start text-left font-normal border-blue-200",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pilih tanggal</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50">
                    <TableHead className="font-semibold text-blue-800">No</TableHead>
                    <TableHead className="font-semibold text-blue-800">Nama Karyawan</TableHead>
                    <TableHead className="font-semibold text-blue-800">Tipe</TableHead>
                    <TableHead className="font-semibold text-blue-800">Tanggal</TableHead>
                    <TableHead className="font-semibold text-blue-800">Jam Datang</TableHead>
                    <TableHead className="font-semibold text-blue-800">Jam Pulang</TableHead>
                    <TableHead className="font-semibold text-blue-800">Status</TableHead>
                    <TableHead className="font-semibold text-blue-800">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((row) => (
                    <TableRow 
                      key={row.id}
                      className="hover:bg-blue-50/50 transition-colors duration-200"
                    >
                      <TableCell className="font-medium text-blue-700">{row.id}</TableCell>
                      <TableCell className="text-blue-800">{row.nama}</TableCell>
                      <TableCell className="text-blue-700 capitalize">{row.tipe}</TableCell>
                      <TableCell className="text-blue-700">{row.tanggal}</TableCell>
                      <TableCell className="text-blue-700">{row.jamDatang}</TableCell>
                      <TableCell className="text-blue-700">{row.jamPulang}</TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(row.status)}`}>
                          {row.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleShowDetail(row)}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {showDetail && <DetailModal />}
    </div>
  );
};

export default TableView;
