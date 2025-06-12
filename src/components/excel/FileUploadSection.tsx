
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileSpreadsheet } from 'lucide-react';

interface FileUploadSectionProps {
  file: File | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  file,
  onFileChange,
  isUploading
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="excel-file" className="text-sm font-medium text-gray-700">
        Pilih File Excel
      </Label>
      <Input
        id="excel-file"
        type="file"
        accept=".xlsx"
        onChange={onFileChange}
        disabled={isUploading}
        className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      
      {file && (
        <Alert className="border-blue-200 bg-blue-50">
          <FileSpreadsheet className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            File terpilih: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default FileUploadSection;
