
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar } from 'lucide-react';

interface PeriodSelectorProps {
  selectedMonth: number | null;
  selectedYear: number | null;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange
}) => {
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

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-blue-200 shadow-lg">
      <CardHeader>
        <CardTitle className="text-blue-800 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Pilih Periode Upload
        </CardTitle>
        <CardDescription className="text-blue-600">
          Tentukan bulan dan tahun untuk data absensi yang akan diupload
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="month-select" className="text-sm font-medium text-gray-700">
              Bulan
            </Label>
            <Select
              value={selectedMonth?.toString() || ""}
              onValueChange={(value) => onMonthChange(parseInt(value))}
            >
              <SelectTrigger id="month-select">
                <SelectValue placeholder="Pilih bulan" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="year-select" className="text-sm font-medium text-gray-700">
              Tahun
            </Label>
            <Select
              value={selectedYear?.toString() || ""}
              onValueChange={(value) => onYearChange(parseInt(value))}
            >
              <SelectTrigger id="year-select">
                <SelectValue placeholder="Pilih tahun" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedMonth && selectedYear && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 text-sm">
              <strong>Periode terpilih:</strong> {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PeriodSelector;
