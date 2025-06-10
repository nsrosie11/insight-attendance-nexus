
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
  const [parsedData, setParsedData] = useState<ExcelData[]>([]);
  const { toast } = useToast();

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

  const parseExcelData = (workbook: XLSX.WorkBook): ExcelData[] => {
    const logSheet = workbook.Sheets['Log'];
    if (!logSheet) {
      throw new Error('Sheet "Log" tidak ditemukan dalam file Excel');
    }

    const data = XLSX.utils.sheet_to_json(logSheet, { header: 1 }) as any[][];
    const parsedData: ExcelData[] = [];

    console.log('Raw Excel data:', data);

    // Cari range kolom yang berisi data
    const range = XLSX.utils.decode_range(logSheet['!ref'] || 'A1:A1');
    
    // Ambil data karyawan dari kolom A (index 0)
    const karyawanData: Array<{nama: string, dept: string, rowIndex: number}> = [];
    
    // Iterasi untuk mencari nama dan dept karyawan di kolom A
    for (let row = 0; row < data.length; row++) {
      const deptCell = data[2] && data[2][0]; // Baris 3 (index 2), kolom A untuk dept
      const namaCell = data[3] && data[3][0]; // Baris 4 (index 3), kolom A untuk nama
      
      if (deptCell && namaCell) {
        const dept = deptCell.toString().trim();
        const nama = namaCell.toString().trim();
        
        // Konversi dept ke status
        let status = 'Karyawan';
        if (dept.toUpperCase() === 'RND') {
          status = 'Magang';
        } else if (dept.toUpperCase() === 'OFFICE') {
          status = 'Karyawan';
        }
        
        karyawanData.push({ nama, dept: status, rowIndex: row });
        break; // Ambil data karyawan pertama saja untuk struktur ini
      }
    }

    if (karyawanData.length === 0) {
      throw new Error('Data karyawan tidak ditemukan di kolom A');
    }

    console.log('Found employee data:', karyawanData);

    // Iterasi melalui setiap kolom mulai dari kolom B (index 1) untuk mengambil tanggal dan jam
    for (let col = 1; col <= range.e.c; col++) {
      try {
        // Ambil tanggal dari baris 5 (index 4)
        const tanggalCell = data[4] && data[4][col];
        if (!tanggalCell || tanggalCell.toString().trim() === '') continue;
        
        let tanggal: string;
        if (typeof tanggalCell === 'number') {
          // Excel date serial number
          const excelDate = new Date((tanggalCell - 25569) * 86400 * 1000);
          tanggal = excelDate.toISOString().split('T')[0];
        } else {
          // String date - parse various formats
          const dateStr = tanggalCell.toString().trim();
          let dateObj: Date;
          
          // Try MM/DD format first
          if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length >= 2) {
              const month = parseInt(parts[0]);
              const day = parseInt(parts[1]);
              const year = new Date().getFullYear(); // Use current year
              dateObj = new Date(year, month - 1, day);
            } else {
              dateObj = new Date(dateStr);
            }
          } else {
            dateObj = new Date(dateStr);
          }
          
          if (isNaN(dateObj.getTime())) {
            console.log(`Invalid date in column ${col}:`, dateStr);
            continue;
          }
          tanggal = dateObj.toISOString().split('T')[0];
        }

        console.log(`Column ${col} - Date:`, tanggal);

        // Untuk setiap karyawan, cari jam masuk dan pulang di kolom ini
        for (const karyawan of karyawanData) {
          // Cari sel yang berisi jam masuk dan pulang untuk karyawan ini
          let jamMasuk: string | null = null;
          let jamPulang: string | null = null;

          // Cari di baris 6 ke bawah (index 5+) untuk jam absen
          for (let row = 5; row < data.length; row++) {
            const cell = data[row] && data[row][col];
            if (cell && cell.toString().trim() !== '') {
              const cellValue = cell.toString().trim();
              
              // Cek apakah sel berisi jam (dengan newline)
              if (cellValue.includes('\n')) {
                const lines = cellValue.split('\n').map(line => line.trim()).filter(line => line !== '');
                console.log(`Column ${col}, Row ${row} - Time lines:`, lines);
                
                if (lines.length >= 1) {
                  jamMasuk = parseTime(lines[0]);
                }
                if (lines.length >= 2) {
                  jamPulang = parseTime(lines[1]);
                }
                break;
              } else {
                // Coba parse sebagai jam tunggal
                const parsedTime = parseTime(cellValue);
                if (parsedTime) {
                  jamMasuk = parsedTime;
                  break;
                }
              }
            }
          }

          console.log(`Column ${col} - ${karyawan.nama} - Jam masuk: ${jamMasuk}, Jam pulang: ${jamPulang}`);

          // Hitung status terlambat dan pulang_tercatat
          const terlambat = jamMasuk ? jamMasuk > '10:00:00' : false;
          const pulang_tercatat = jamPulang ? 
            (jamPulang >= '15:00:00' && jamPulang <= '17:00:00') : false;

          const formattedData: ExcelData = {
            nama: karyawan.nama,
            status: karyawan.dept,
            tanggal,
            jam_masuk: jamMasuk,
            jam_pulang: jamPulang,
            terlambat,
            pulang_tercatat
          };

          console.log(`Formatted data for ${karyawan.nama} on ${tanggal}:`, formattedData);
          parsedData.push(formattedData);
        }

      } catch (error) {
        console.log(`Error parsing column ${col}:`, error);
        continue;
      }
    }

    return parsedData;
  };

  const parseTime = (timeStr: string): string | null => {
    if (!timeStr) return null;
    
    // Bersihkan string dari karakter yang tidak perlu
    const cleanTimeStr = timeStr.toString().trim();
    
    // Handle format HH:MM atau HH:MM:SS
    const timeMatch = cleanTimeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (timeMatch) {
      const hours = timeMatch[1].padStart(2, '0');
      const minutes = timeMatch[2];
      const seconds = timeMatch[3] || '00';
      return `${hours}:${minutes}:${seconds}`;
    }
    
    // Handle format jam biasa (misal: 8, 9, 10)
    const hourMatch = cleanTimeStr.match(/^\d{1,2}$/);
    if (hourMatch) {
      const hour = hourMatch[0].padStart(2, '0');
      return `${hour}:00:00`;
    }
    
    return null;
  };

  const handleParseFile = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      console.log('Available sheets:', workbook.SheetNames);
      
      const parsed = parseExcelData(workbook);
      
      console.log('Final parsed data:', parsed);
      
      if (parsed.length === 0) {
        throw new Error('Tidak ada data valid yang ditemukan dalam file');
      }

      setParsedData(parsed);
      setUploadStatus('success');
      
      toast({
        title: "File berhasil diparse!",
        description: `${parsed.length} data absensi siap untuk diimpor`,
      });

    } catch (error: any) {
      console.error('Error parsing file:', error);
      setUploadStatus('error');
      toast({
        title: "Parse gagal",
        description: error.message || "Terjadi kesalahan saat memparse file",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (parsedData.length === 0) return;

    setIsUploading(true);

    try {
      // Insert data ke Supabase
      const { data, error } = await supabase
        .from('absensi')
        .insert(parsedData);

      if (error) {
        throw error;
      }

      toast({
        title: "Data berhasil disimpan!",
        description: `${parsedData.length} data absensi berhasil disimpan ke database`,
      });

      // Reset form
      setFile(null);
      setParsedData([]);
      setUploadStatus('idle');
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

        {parsedData.length > 0 && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>{parsedData.length} data berhasil diparse:</strong>
              <div className="mt-2 max-h-40 overflow-y-auto text-xs">
                {parsedData.slice(0, 5).map((item, index) => (
                  <div key={index} className="mb-1">
                    {item.nama} ({item.status}) - {item.tanggal} | 
                    Masuk: {item.jam_masuk || 'N/A'} | 
                    Pulang: {item.jam_pulang || 'N/A'}
                  </div>
                ))}
                {parsedData.length > 5 && <div>...dan {parsedData.length - 5} lainnya</div>}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {uploadStatus === 'error' && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Gagal memparse data. Silakan coba lagi.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleParseFile}
            disabled={!file || isUploading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isUploading && parsedData.length === 0 ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Memparse File...
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Parse File Excel
              </>
            )}
          </Button>

          {parsedData.length > 0 && (
            <Button
              onClick={handleSaveToDatabase}
              disabled={isUploading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isUploading && parsedData.length > 0 ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Simpan ke Database
                </>
              )}
            </Button>
          )}
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Format Excel yang dibutuhkan:</strong></p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Sheet bernama "Log"</li>
            <li>Baris 3: Dept di kolom A</li>
            <li>Baris 4: Nama karyawan di kolom A</li>
            <li>Baris 5: Tanggal di setiap kolom (B, C, D, dst)</li>
            <li>Baris 6+: Jam masuk dan pulang (dipisah newline)</li>
            <li>Dept: "RND" = Magang, "Office" = Karyawan</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExcelUpload;
