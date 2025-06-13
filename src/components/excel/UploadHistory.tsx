
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { History, FileSpreadsheet, Calendar, Users } from 'lucide-react';
import { useUploadHistory, useUploadHistoryByPeriod } from '@/hooks/useUploadHistory';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const UploadHistory: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  
  const { data: allHistory, isLoading: allLoading } = useUploadHistory();
  const { data: periodHistory, isLoading: periodLoading } = useUploadHistoryByPeriod(
    selectedYear || undefined, 
    selectedMonth || undefined
  );

  const months = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const displayData = selectedYear && selectedMonth ? periodHistory : allHistory;
  const isLoading = selectedYear && selectedMonth ? periodLoading : allLoading;

  const clearFilter = () => {
    setSelectedYear(null);
    setSelectedMonth(null);
  };

  const getMonthName = (monthNumber: number) => {
    return months.find(m => m.value === monthNumber)?.label || monthNumber.toString();
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-blue-200 shadow-lg">
      <CardHeader>
        <CardTitle className="text-blue-800 flex items-center gap-2">
          <History className="h-5 w-5" />
          Riwayat Upload Excel
        </CardTitle>
        <CardDescription className="text-blue-600">
          Lihat riwayat upload file Excel data absensi
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter Section */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter Tahun
            </label>
            <Select
              value={selectedYear?.toString() || ""}
              onValueChange={(value) => setSelectedYear(value ? parseInt(value) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Semua tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua tahun</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter Bulan
            </label>
            <Select
              value={selectedMonth?.toString() || ""}
              onValueChange={(value) => setSelectedMonth(value ? parseInt(value) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Semua bulan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua bulan</SelectItem>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(selectedYear || selectedMonth) && (
            <div className="flex items-end">
              <button
                onClick={clearFilter}
                className="px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>

        {/* History Table */}
        <div className="border rounded-md">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Memuat riwayat upload...
            </div>
          ) : !displayData || displayData.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>Belum ada riwayat upload</p>
              {selectedYear && selectedMonth && (
                <p className="text-sm mt-1">
                  untuk periode {getMonthName(selectedMonth)} {selectedYear}
                </p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Periode</TableHead>
                  <TableHead>Nama File</TableHead>
                  <TableHead>Tanggal Upload</TableHead>
                  <TableHead>Jumlah Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayData.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {getMonthName(record.upload_month)} {record.upload_year}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{record.filename}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(record.upload_date), 'dd MMM yyyy, HH:mm', { locale: id })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {record.records_count} data
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UploadHistory;
