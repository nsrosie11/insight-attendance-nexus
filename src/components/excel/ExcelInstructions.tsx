
import React from 'react';

const ExcelInstructions: React.FC = () => {
  return (
    <div className="text-xs text-gray-500 space-y-1">
      <p><strong>Format Excel yang dibutuhkan:</strong></p>
      <ul className="list-disc pl-4 space-y-1">
        <li>Sheet bernama "Log"</li>
        <li>Baris 3: Dept di kolom A (RND = Magang, Office = Karyawan)</li>
        <li>Baris 4: Nama karyawan di kolom A</li>
        <li>Baris 5: Tanggal di setiap kolom (B, C, D, dst)</li>
        <li>Baris 6+: Jam masuk dan pulang pada setiap sel (format: "08:42\n16:11")</li>
        <li>Setiap kolom mewakili satu tanggal absensi</li>
      </ul>
    </div>
  );
};

export default ExcelInstructions;
