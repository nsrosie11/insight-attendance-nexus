
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface ExcelData {
  nama: string;
  status: string;
  tanggal: string;
  jam_masuk: string | null;
  jam_pulang: string | null;
  terlambat: boolean;
  pulang_tercatat: boolean;
}

const ExcelUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          selectedFile.name.endsWith('.xlsx')) {
        setFile(selectedFile);
        setUploadStatus('idle');
      } else {
        toast({
          title: "Format file tidak valid",
          description: "Hanya file Excel (.xlsx) yang diperbolehkan",
          variant: "destructive"
        });
      }
    }
  };

  const parseExcelData = (workbook: XLSX.WorkBook): ExcelData[] => {
    const logSheet = workbook.Sheets['Log'];
    if (!logSheet) {
      throw new Error('Sheet "Log" tidak ditemukan dalam file Excel');
    }

    const data = XLSX.utils.sheet_to_json(logSheet, { header: 1 }) as any[][];
    const parsedData: ExcelData[] = [];

    // Skip header dan mulai dari baris kedua
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 4) continue;

      const nama = row[0]?.toString().trim();
      const dept = row[1]?.toString().trim();
      const tanggal = row[2];
      const jamMasuk = row[3]?.toString().trim();
      const jamPulang = row[4]?.toString().trim();

      if (!nama || !dept || !tanggal) continue;

      // Konversi dept ke status
      let status = 'Karyawan';
      if (dept === 'RND') {
        status = 'Magang';
      }

      // Parse tanggal
      let formattedDate: string;
      if (typeof tanggal === 'number') {
        // Excel date serial number
        const excelDate = new Date((tanggal - 25569) * 86400 * 1000);
        formattedDate = excelDate.toISOString().split('T')[0];
      } else {
        // String date
        const dateObj = new Date(tanggal);
        formattedDate = dateObj.toISOString().split('T')[0];
      }

      // Parse jam
      const parseTime = (timeStr: string | null): string | null => {
        if (!timeStr) return null;
        // Handle format HH:MM atau HH:MM:SS
        const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
        if (timeMatch) {
          const hours = timeMatch[1].padStart(2, '0');
          const minutes = timeMatch[2];
          return `${hours}:${minutes}:00`;
        }
        return null;
      };

      const jamMasukParsed = parseTime(jamMasuk);
      const jamPulangParsed = parseTime(jamPulang);

      // Hitung status terlambat dan pulang_tercatat
      const terlambat = jamMasukParsed ? jamMasukParsed > '10:00:00' : false;
      const pulang_tercatat = jamPulangParsed ? 
        (jamPulangParsed >= '15:00:00' && jamPulangParsed <= '17:00:00') : false;

      parsedData.push({
        nama,
        status,
        tanggal: formattedDate,
        jam_masuk: jamMasukParsed,
        jam_pulang: jamPulangParsed,
        terlambat,
        pulang_tercatat
      });
    }

    return parsedData;
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const parsedData = parseExcelData(workbook);
      
      if (parsedData.length === 0) {
        throw new Error('Tidak ada data valid yang ditemukan dalam file');
      }

      // Insert data ke Supabase
      const { data, error } = await supabase
        .from('absensi')
        .insert(parsedData);

      if (error) {
        throw error;
      }

      setUploadStatus('success');
      toast({
        title: "Upload berhasil!",
        description: `${parsedData.length} data absensi berhasil diimpor ke database`,
      });

      // Reset form
      setFile(null);
      const fileInput = document.getElementById('excel-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error: any) {
      console.error('Error uploading file:', error);
      setUploadStatus('error');
      toast({
        title: "Upload gagal",
        description: error.message || "Terjadi kesalahan saat mengupload file",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-blue-200 shadow-lg">
      <CardHeader>
        <CardTitle className="text-blue-800 flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Upload Data Absensi Excel
        </CardTitle>
        <CardDescription className="text-blue-600">
          Upload file Excel (.xlsx) dengan data absensi dari sheet "Log"
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="excel-file" className="text-sm font-medium text-gray-700">
            Pilih File Excel
          </Label>
          <Input
            id="excel-file"
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            disabled={isUploading}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {file && (
          <Alert className="border-blue-200 bg-blue-50">
            <FileSpreadsheet className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              File terpilih: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
            </AlertDescription>
          </Alert>
        )}

        {uploadStatus === 'success' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Data berhasil diupload ke database!
            </AlertDescription>
          </Alert>
        )}

        {uploadStatus === 'error' && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Gagal mengupload data. Silakan coba lagi.
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Mengupload...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Data Absensi
            </>
          )}
        </Button>

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Format Excel yang dibutuhkan:</strong></p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Sheet bernama "Log"</li>
            <li>Kolom: Nama, Dept, Tanggal, Jam Masuk, Jam Pulang</li>
            <li>Dept: "RND" = Magang, "Office" = Karyawan</li>
            <li>Format jam: HH:MM atau HH:MM:SS</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExcelUpload;
