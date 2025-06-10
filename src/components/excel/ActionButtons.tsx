
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Upload } from 'lucide-react';

interface ActionButtonsProps {
  file: File | null;
  isUploading: boolean;
  parsedDataLength: number;
  onParseFile: () => void;
  onSaveToDatabase: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  file,
  isUploading,
  parsedDataLength,
  onParseFile,
  onSaveToDatabase
}) => {
  return (
    <div className="flex gap-2">
      <Button
        onClick={onParseFile}
        disabled={!file || isUploading}
        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isUploading && parsedDataLength === 0 ? (
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

      {parsedDataLength > 0 && (
        <Button
          onClick={onSaveToDatabase}
          disabled={isUploading}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          {isUploading && parsedDataLength > 0 ? (
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
  );
};

export default ActionButtons;
