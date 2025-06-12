
import * as XLSX from 'xlsx';
import { ExcelData, EmployeeInfo } from '@/types/excel';

export const parseTime = (timeStr: string): string | null => {
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

export const parseExcelData = (workbook: XLSX.WorkBook): ExcelData[] => {
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
  const karyawanData: EmployeeInfo[] = [];
  
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
