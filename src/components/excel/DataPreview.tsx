
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { ExcelData } from '@/types/excel';

interface DataPreviewProps {
  parsedData: ExcelData[];
  uploadStatus: 'idle' | 'success' | 'error';
}

const DataPreview: React.FC<DataPreviewProps> = ({ parsedData, uploadStatus }) => {
  if (parsedData.length > 0) {
    return (
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
    );
  }

  if (uploadStatus === 'error') {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Gagal memparse data. Silakan coba lagi.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default DataPreview;
