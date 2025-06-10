
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

  console.log('Starting programmatic Excel parsing...');
  
  // Akses langsung ke sel tertentu menggunakan address Excel
  const getDept = () => {
    const cellRef = 'A3'; // Baris 3, kolom A
    const cell = logSheet[cellRef];
    if (!cell || !cell.v) {
      throw new Error(`Dept tidak ditemukan di sel ${cellRef}`);
    }
    return cell.v.toString().trim();
  };

  const getName = () => {
    const cellRef = 'A4'; // Baris 4, kolom A
    const cell = logSheet[cellRef];
    if (!cell || !cell.v) {
      throw new Error(`Nama tidak ditemukan di sel ${cellRef}`);
    }
    return cell.v.toString().trim();
  };

  // Ambil data karyawan
  const dept = getDept();
  const nama = getName();
  
  // Konversi dept ke status
  let status = 'Karyawan';
  if (dept.toUpperCase() === 'RND') {
    status = 'Magang';
  } else if (dept.toUpperCase() === 'OFFICE') {
    status = 'Karyawan';
  }

  console.log(`Found employee: ${nama} (${dept} -> ${status})`);

  const parsedData: ExcelData[] = [];

  // Tentukan range kolom yang akan diproses (mulai dari kolom B = kolom ke-2)
  const range = XLSX.utils.decode_range(logSheet['!ref'] || 'A1:A1');
  const maxCol = range.e.c; // Kolom terakhir
  
  console.log(`Processing columns from B (index 1) to ${XLSX.utils.encode_col(maxCol)} (index ${maxCol})`);

  // Loop per kolom mulai dari kolom B (index 1)
  for (let colIndex = 1; colIndex <= maxCol; colIndex++) {
    try {
      // Akses tanggal di baris 5 (index 4)
      const dateRef = XLSX.utils.encode_cell({ r: 4, c: colIndex }); // Baris 5, kolom saat ini
      const dateCell = logSheet[dateRef];
      
      if (!dateCell || !dateCell.v) {
        console.log(`No date found in column ${XLSX.utils.encode_col(colIndex)} (${dateRef})`);
        continue;
      }

      let tanggal: string;
      if (typeof dateCell.v === 'number') {
        // Excel date serial number
        const excelDate = new Date((dateCell.v - 25569) * 86400 * 1000);
        tanggal = excelDate.toISOString().split('T')[0];
      } else {
        // String date - parse various formats
        const dateStr = dateCell.v.toString().trim();
        console.log(`Processing date string: "${dateStr}" in column ${XLSX.utils.encode_col(colIndex)}`);
        
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
          console.log(`Invalid date "${dateStr}" in column ${XLSX.utils.encode_col(colIndex)}, skipping`);
          continue;
        }
        tanggal = dateObj.toISOString().split('T')[0];
      }

      console.log(`Column ${XLSX.utils.encode_col(colIndex)} -  Date: ${tanggal}`);

      // Mulai baris 6 (index 5) untuk jam masuk dan pulang
      const rowIndex = 5; // Baris 6 (karena index mulai dari 0)
      const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
      const timeCell = logSheet[cellRef];
      
      if (!timeCell || !timeCell.v) {
        console.log(`No time data found in ${cellRef}`);
        continue;
      }

      const cellValue = timeCell.v.toString().trim();
      console.log(`Time data in ${cellRef}: ${cellValue}`);
      
      let jamMasuk: string | null = null;
      let jamPulang: string | null = null;

      // Parse jam masuk dan pulang
      if (cellValue.includes('\n')) {
        const lines = cellValue.split('\n').map(line => line.trim()).filter(line => line !== '');
        console.log(`Column ${XLSX.utils.encode_col(colIndex)}, Row ${rowIndex + 1} - Time lines:`, lines);
        
        if (lines.length >= 1) {
          jamMasuk = parseTime(lines[0]);
        }
        if (lines.length >= 2) {
          jamPulang = parseTime(lines[1]);
        }
      } else {
        // Coba parse sebagai jam tunggal
        jamMasuk = parseTime(cellValue);
      }

      console.log(`Column ${XLSX.utils.encode_col(colIndex)} - ${nama} - Jam masuk: ${jamMasuk}, Jam pulang: ${jamPulang}`);

      // Hitung status terlambat dan pulang_tercatat
      const terlambat = jamMasuk ? jamMasuk > '10:00:00' : false;
      const pulang_tercatat = jamPulang ? 
        (jamPulang >= '15:00:00' && jamPulang <= '17:00:00') : false;

      // Buat objek data
      const formattedData: ExcelData = {
        nama,
        status,
        tanggal,
        jam_masuk: jamMasuk,
        jam_pulang: jamPulang,
        terlambat,
        pulang_tercatat
      };

      console.log(`Formatted data for ${nama} on ${tanggal}:`, formattedData);
      parsedData.push(formattedData);
    } catch (error) {
      console.log(`Error parsing column ${XLSX.utils.encode_col(colIndex)}:`, error);
      continue;  // Lanjutkan ke kolom berikutnya
    }
  }

  if (parsedData.length === 0) {
    throw new Error('Tidak ada data valid yang ditemukan dalam file');
  }

  return parsedData;
};
