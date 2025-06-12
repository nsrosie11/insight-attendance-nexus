
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { ExcelData } from '@/types/excel';
import { parseExcelData } from '@/utils/excelParser';
import FileUploadSection from './excel/FileUploadSection';
import DataPreview from './excel/DataPreview';
import ActionButtons from './excel/ActionButtons';
import ExcelInstructions from './excel/ExcelInstructions';

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
  );
};

export default ExcelUpload;
