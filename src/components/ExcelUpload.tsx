import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { ExcelData } from '@/types/excel';
import { parseExcelData } from '@/utils/excelParser';
import { useCreateUploadHistory } from '@/hooks/useUploadHistory';
import PeriodSelector from './excel/PeriodSelector';
import FileUploadSection from './excel/FileUploadSection';
import DataPreview from './excel/DataPreview';
import ActionButtons from './excel/ActionButtons';
import ExcelInstructions from './excel/ExcelInstructions';
import UploadHistory from './excel/UploadHistory';

const ExcelUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [parsedData, setParsedData] = useState<ExcelData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'history'>('upload');
  
  const { toast } = useToast();
  const createUploadHistory = useCreateUploadHistory();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          selectedFile.name.endsWith('.xlsx')) {
        setFile(selectedFile);
        setUploadStatus('idle');
        setParsedData([]); // Clear previous data
      } else {
        toast({
          title: "Format file tidak valid",
          description: "Hanya file Excel (.xlsx) yang diperbolehkan",
          variant: "destructive"
        });
      }
    }
  };

  const handleParseFile = async () => {
    if (!file) return;

    // Validasi periode harus dipilih
    if (!selectedMonth || !selectedYear) {
      toast({
        title: "Periode belum dipilih",
        description: "Silakan pilih bulan dan tahun terlebih dahulu",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      console.log(`\n🚀 ========== STARTING EXCEL PARSING ==========`);
      console.log(`📁 File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
      console.log(`📅 Period: ${selectedMonth}/${selectedYear}`);
      
      const arrayBuffer = await file.arrayBuffer();
      console.log(`📦 ArrayBuffer size: ${arrayBuffer.byteLength} bytes`);
      
      // Try different workbook parsing options
      let workbook: XLSX.WorkBook;
      try {
        // Method 1: Standard parsing
        workbook = XLSX.read(arrayBuffer, { 
          type: 'array',
          cellText: false,
          cellDates: true,
          cellNF: false,
          cellStyles: false
        });
        console.log('✅ Workbook parsed with Method 1');
      } catch (error) {
        console.log('❌ Method 1 failed, trying Method 2:', error);
        // Method 2: More permissive parsing
        workbook = XLSX.read(arrayBuffer, { 
          type: 'array',
          cellText: true,
          cellDates: false,
          raw: false
        });
        console.log('✅ Workbook parsed with Method 2');
      }
      
      console.log(`📊 Workbook loaded with ${workbook.SheetNames.length} sheets:`, workbook.SheetNames);
      
      const parsed = parseExcelData(workbook, selectedMonth, selectedYear);
      
      console.log(`🎉 Final parsed data: ${parsed.length} records`);
      
      if (parsed.length === 0) {
        throw new Error('Tidak ada data valid yang ditemukan dalam file. Pastikan file Excel memiliki format yang benar dengan sheet bernama angka (contoh: 14.15.17) dan berisi data absensi.');
      }

      setParsedData(parsed);
      setUploadStatus('success');
      
      toast({
        title: "File berhasil diparse!",
        description: `${parsed.length} data absensi siap untuk diimpor`,
      });

    } catch (error: any) {
      console.error('❌ Error parsing file:', error);
      setUploadStatus('error');
      toast({
        title: "Parse gagal",
        description: error.message || "Terjadi kesalahan saat memparse file. Periksa console browser (F12) untuk detail lebih lanjut.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (parsedData.length === 0 || !selectedMonth || !selectedYear) return;

    setIsUploading(true);

    try {
      // Check for duplicates based on nama + tanggal before inserting
      const uniqueData = [];
      const seen = new Set();
      
      for (const item of parsedData) {
        const key = `${item.nama}-${item.tanggal}`;
        if (!seen.has(key)) {
          seen.add(key);
          // Pastikan status dalam format yang benar untuk database
          const formattedItem = {
            ...item,
            status: item.status === 'magang' ? 'Magang' : 
                    item.status === 'karyawan' ? 'Karyawan' : item.status
          };
          uniqueData.push(formattedItem);
          console.log(`Adding item with status: ${formattedItem.status}`);
        } else {
          console.log(`Skipping duplicate entry: ${key}`);
        }
      }

      console.log(`Inserting ${uniqueData.length} unique records (filtered from ${parsedData.length} total)`);
      console.log('Sample data being inserted:', uniqueData.slice(0, 3));

      // Insert data ke Supabase
      const { data, error } = await supabase
        .from('absensi')
        .insert(uniqueData);

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      // Simpan riwayat upload
      await createUploadHistory.mutateAsync({
        filename: file?.name || 'Unknown file',
        upload_month: selectedMonth,
        upload_year: selectedYear,
        records_count: uniqueData.length,
      });

      toast({
        title: "Data berhasil disimpan!",
        description: `${uniqueData.length} data absensi berhasil disimpan ke database${parsedData.length - uniqueData.length > 0 ? ` (${parsedData.length - uniqueData.length} duplikat diabaikan)` : ''}`,
      });

      // Reset form
      setFile(null);
      setParsedData([]);
      setUploadStatus('idle');
      setSelectedMonth(null);
      setSelectedYear(null);
      const fileInput = document.getElementById('excel-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error: any) {
      console.error('Error saving to database:', error);
      toast({
        title: "Gagal menyimpan",
        description: error.message || "Terjadi kesalahan saat menyimpan ke database",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'upload'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Upload Data
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'history'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Riwayat Upload
        </button>
      </div>

      {activeTab === 'upload' ? (
        <>
          <PeriodSelector
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
          />

          <Card className="bg-white/90 backdrop-blur-sm border-blue-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Upload Data Absensi Excel
              </CardTitle>
              <CardDescription className="text-blue-600">
                Upload file Excel (.xlsx) dengan data absensi dari sheet dengan nama angka (mulai dari 14.15.17)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUploadSection
                file={file}
                onFileChange={handleFileChange}
                isUploading={isUploading}
              />

              <DataPreview
                parsedData={parsedData}
                uploadStatus={uploadStatus}
              />

              <ActionButtons
                file={file}
                isUploading={isUploading}
                parsedDataLength={parsedData.length}
                onParseFile={handleParseFile}
                onSaveToDatabase={handleSaveToDatabase}
              />

              <ExcelInstructions />
            </CardContent>
          </Card>
        </>
      ) : (
        <UploadHistory />
      )}
    </div>
  );
};

export default ExcelUpload;
