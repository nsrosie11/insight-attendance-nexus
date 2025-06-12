
import React from 'react';

const ExcelInstructions: React.FC = () => {
  return (
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
  );
};

export default ExcelInstructions;
