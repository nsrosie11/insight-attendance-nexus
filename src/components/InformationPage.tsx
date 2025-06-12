
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarIcon, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAbsensi } from '@/hooks/useAbsensi';

const InformationPage: React.FC = () => {
  const [filterType, setFilterType] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedWeek, setSelectedWeek] = useState<string>('1');
  
  const { data: absensiData, isLoading } = useAbsensi();

  // Calculate summary statistics
  const summary = React.useMemo(() => {
    if (!absensiData) return { late: 0, onTime: 0, absent: 0 };
    
    const late = absensiData.filter(item => item.terlambat).length;
    const onTime = absensiData.filter(item => item.jam_masuk && !item.terlambat).length;
    const absent = absensiData.filter(item => !item.jam_masuk).length;
    
    return { late, onTime, absent };
  }, [absensiData]);

  const weeks = [
    { value: '1', label: 'Minggu 1 (1-7)' },
    { value: '2', label: 'Minggu 2 (8-14)' },
    { value: '3', label: 'Minggu 3 (15-21)' },
    { value: '4', label: 'Minggu 4 (22-28)' },
    { value: '5', label: 'Minggu 5 (29-31)' }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Terlambat</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{summary.late}</div>
            <p className="text-xs text-red-600">Total keterlambatan</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Tepat Waktu</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{summary.onTime}</div>
            <p className="text-xs text-green-600">Kehadiran tepat waktu</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Tidak Hadir</CardTitle>
            <XCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-700">{summary.absent}</div>
            <p className="text-xs text-gray-600">Total ketidakhadiran</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Riwayat Absensi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Jenis Rekapan</label>
              <Select value={filterType} onValueChange={(value: 'weekly' | 'monthly') => setFilterType(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Rekapan Mingguan</SelectItem>
                  <SelectItem value="monthly">Rekapan Bulanan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Pilih Bulan</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[200px] justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "MMMM yyyy") : "Pilih bulan"}
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

            {filterType === 'weekly' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Pilih Minggu</label>
                <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {weeks.map((week) => (
                      <SelectItem key={week.value} value={week.value}>
                        {week.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Attendance Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jam Masuk</TableHead>
                  <TableHead>Jam Pulang</TableHead>
                  <TableHead>Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : absensiData && absensiData.length > 0 ? (
                  absensiData.slice(0, 10).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {new Date(record.tanggal).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        {record.jam_masuk || '-'}
                      </TableCell>
                      <TableCell>
                        {record.jam_pulang || '-'}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          record.terlambat
                            ? "bg-red-100 text-red-700"
                            : record.jam_masuk
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        )}>
                          {record.terlambat 
                            ? 'Terlambat' 
                            : record.jam_masuk 
                            ? 'Tepat Waktu' 
                            : 'Tidak Hadir'
                          }
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                      Belum ada data absensi
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InformationPage;
