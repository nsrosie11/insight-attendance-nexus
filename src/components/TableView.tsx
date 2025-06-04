
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const tableData = [
  {
    id: 1,
    nama: 'Ahmad Rahman',
    tanggal: '02-05-25',
    jamDatang: '08:29:00',
    jamPulang: '16:12:00',
    status: 'Hadir'
  },
  {
    id: 2,
    nama: 'Siti Nurhaliza',
    tanggal: '02-05-25',
    jamDatang: '08:15:00',
    jamPulang: '16:00:00',
    status: 'Hadir'
  },
  {
    id: 3,
    nama: 'Budi Santoso',
    tanggal: '02-05-25',
    jamDatang: '09:15:00',
    jamPulang: '16:05:00',
    status: 'Terlambat'
  },
  {
    id: 4,
    nama: 'Maya Sari',
    tanggal: '02-05-25',
    jamDatang: '-',
    jamPulang: '-',
    status: 'Tidak Hadir'
  },
  {
    id: 5,
    nama: 'Dian Pratama',
    tanggal: '02-05-25',
    jamDatang: '08:05:00',
    jamPulang: '16:30:00',
    status: 'Hadir'
  }
];

const TableView: React.FC = () => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <div className="max-w-6xl mx-auto">
        <Card className="shadow-xl bg-white/80 backdrop-blur-sm border-blue-200">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-blue-800 mb-2">
              Tabel Data
            </CardTitle>
            <p className="text-blue-600">Data Presensi Karyawan</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50">
                    <TableHead className="font-semibold text-blue-800">No</TableHead>
                    <TableHead className="font-semibold text-blue-800">Nama Karyawan</TableHead>
                    <TableHead className="font-semibold text-blue-800">Tanggal</TableHead>
                    <TableHead className="font-semibold text-blue-800">Jam Datang</TableHead>
                    <TableHead className="font-semibold text-blue-800">Jam Pulang</TableHead>
                    <TableHead className="font-semibold text-blue-800">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.map((row) => (
                    <TableRow 
                      key={row.id}
                      className="hover:bg-blue-50/50 transition-colors duration-200"
                    >
                      <TableCell className="font-medium text-blue-700">{row.id}</TableCell>
                      <TableCell className="text-blue-800">{row.nama}</TableCell>
                      <TableCell className="text-blue-700">{row.tanggal}</TableCell>
                      <TableCell className="text-blue-700">{row.jamDatang}</TableCell>
                      <TableCell className="text-blue-700">{row.jamPulang}</TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(row.status)}`}>
                          {row.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TableView;
