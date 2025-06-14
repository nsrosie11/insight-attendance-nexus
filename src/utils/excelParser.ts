
import * as XLSX from 'xlsx';
import { ExcelData, EmployeeInfo } from '@/types/excel';

export const parseTime = (timeStr: string): string | null => {
  if (!timeStr) return null;
  
  // Bersihkan string dari karakter yang tidak perlu
  const cleanTimeStr = timeStr.toString().trim();
  
  // Skip jika berisi "Absen"
  if (cleanTimeStr.toLowerCase().includes('absen')) {
    return null;
  }
  
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

const isNumericSheetName = (sheetName: string): boolean => {
  // Check if sheet name contains only numbers and dots (like 14.15.17)
  return /^[\d.]+$/.test(sheetName);
};

const shouldProcessSheet = (sheetName: string, allSheetNames: string[]): boolean => {
  // Skip if not numeric sheet name
  if (!isNumericSheetName(sheetName)) {
    return false;
  }
  
  // Find index of sheet 14.15.17
  const startSheetIndex = allSheetNames.findIndex(name => name === '14.15.17');
  const currentSheetIndex = allSheetNames.indexOf(sheetName);
  
  // If 14.15.17 exists, process from that sheet onwards
  if (startSheetIndex !== -1) {
    return currentSheetIndex >= startSheetIndex;
  }
  
  // If 14.15.17 doesn't exist, process all numeric sheets
  return true;
};

const findEmployeeInfo = (data: any[][]): { nama: string; status: string } | null => {
  let nama = '';
  let status = 'karyawan'; // default
  
  console.log('Looking for employee info in sheet...');
  
  // Look for "Nama:" pattern in first 20 rows
  for (let row = 0; row < Math.min(data.length, 20); row++) {
    for (let col = 0; col < Math.min((data[row] || []).length, 10); col++) {
      const cell = data[row] && data[row][col];
      if (cell) {
        const cellStr = cell.toString().trim();
        
        // Look for nama pattern
        if (cellStr.toLowerCase().includes('nama') && cellStr.includes(':')) {
          // Extract name from "Nama: neila" format
          const nameMatch = cellStr.match(/nama\s*:\s*(.+)/i);
          if (nameMatch && nameMatch[1].trim()) {
            nama = nameMatch[1].trim();
            console.log(`Found employee name: ${nama}`);
          }
        }
        
        // Look for departemen pattern
        if (cellStr.toLowerCase().includes('dept') || cellStr.toLowerCase().includes('departemen')) {
          // Look for department value in adjacent cells or same cell
          const adjacentCells = [
            cellStr, // same cell
            data[row] && data[row][col + 1] && data[row][col + 1].toString(), // right
            data[row + 1] && data[row + 1][col] && data[row + 1][col].toString(), // below
            data[row + 1] && data[row + 1][col + 1] && data[row + 1][col + 1].toString() // diagonal
          ];
          
          for (const adjCell of adjacentCells) {
            if (adjCell) {
              const adjStr = adjCell.toUpperCase().trim();
              if (adjStr.includes('RND')) {
                status = 'magang';
                console.log(`Found department: RND - status set to magang`);
                break;
              } else if (adjStr.includes('OFFICE')) {
                status = 'karyawan';
                console.log(`Found department: OFFICE - status set to karyawan`);
                break;
              }
            }
          }
        }
      }
    }
  }
  
  if (!nama) {
    console.log('No employee name found in sheet');
    return null;
  }
  
  console.log(`Final employee info: ${nama} with status: ${status}`);
  return { nama, status };
};

const findAttendanceTable = (data: any[][]): { 
  dateRow: number; 
  jamMasukRow: number; 
  jamPulangRow: number; 
  dateColumns: Array<{ col: number; day: number }> 
} => {
  let dateRow = -1;
  let jamMasukRow = -1;
  let jamPulangRow = -1;
  const dateColumns: Array<{ col: number; day: number }> = [];
  
  console.log('Looking for attendance table (Tabel Kehadiran)...');
  
  // Find date row (look for patterns like "01 Ka", "02 Ju", etc.)
  for (let row = 0; row < data.length; row++) {
    let foundDatesInRow = 0;
    const tempDateColumns: Array<{ col: number; day: number }> = [];
    
    for (let col = 0; col < (data[row] || []).length; col++) {
      const cell = data[row] && data[row][col];
      if (cell) {
        const cellStr = cell.toString().trim();
        // Look for date pattern like "01 Ka", "02 Ju", etc.
        const dayMatch = cellStr.match(/^(\d{1,2})\s*[A-Za-z]{2}/);
        if (dayMatch) {
          const day = parseInt(dayMatch[1]);
          if (day >= 1 && day <= 31) {
            tempDateColumns.push({ col, day });
            foundDatesInRow++;
          }
        }
      }
    }
    
    // If we found multiple dates in this row, it's probably the date row
    if (foundDatesInRow >= 2) {
      dateRow = row;
      dateColumns.push(...tempDateColumns);
      console.log(`Found date row at ${row} with ${foundDatesInRow} dates`);
      break;
    }
  }
  
  // Find jam masuk and jam pulang rows after date row
  if (dateRow !== -1) {
    for (let row = dateRow + 1; row < Math.min(data.length, dateRow + 20); row++) {
      for (let col = 0; col < (data[row] || []).length; col++) {
        const cell = data[row] && data[row][col];
        if (cell) {
          const cellStr = cell.toString().toLowerCase();
          
          // Look for "Jam Kerja 1" and "Masuk" pattern for jam masuk
          if (cellStr.includes('jam kerja 1') && cellStr.includes('masuk')) {
            jamMasukRow = row;
            console.log(`Found jam masuk row at ${row}`);
          }
          
          // Look for "Jam Kerja 2" and "Masuk" pattern for jam pulang
          if (cellStr.includes('jam kerja 2') && cellStr.includes('masuk')) {
            jamPulangRow = row;
            console.log(`Found jam pulang row at ${row}`);
          }
        }
      }
    }
  }
  
  console.log(`Attendance table structure: dateRow=${dateRow}, jamMasukRow=${jamMasukRow}, jamPulangRow=${jamPulangRow}, dateColumns=${dateColumns.length}`);
  return { dateRow, jamMasukRow, jamPulangRow, dateColumns };
};

const parseSheetData = (data: any[][], sheetName: string, selectedMonth: number, selectedYear: number): ExcelData[] => {
  const parsedData: ExcelData[] = [];
  
  console.log(`Processing sheet: ${sheetName}`);
  
  // Find employee info (nama and status)
  const employeeInfo = findEmployeeInfo(data);
  if (!employeeInfo) {
    console.log(`No employee info found in sheet ${sheetName}`);
    return parsedData;
  }
  
  // Find attendance table structure
  const { dateRow, jamMasukRow, jamPulangRow, dateColumns } = findAttendanceTable(data);
  
  if (dateRow === -1 || dateColumns.length === 0) {
    console.log(`No attendance table found in sheet ${sheetName}`);
    return parsedData;
  }
  
  if (jamMasukRow === -1 || jamPulangRow === -1) {
    console.log(`Incomplete attendance table structure in sheet ${sheetName}`);
    return parsedData;
  }
  
  // Process each date column
  for (const { col, day } of dateColumns) {
    const tanggal = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    console.log(`Processing date ${tanggal} in column ${col}`);
    
    // Get jam masuk from jam masuk row
    let jamMasuk: string | null = null;
    if (jamMasukRow !== -1) {
      const jamMasukCell = data[jamMasukRow] && data[jamMasukRow][col];
      if (jamMasukCell && jamMasukCell.toString().trim()) {
        const cellValue = jamMasukCell.toString().trim().toLowerCase();
        if (!cellValue.includes('absen')) {
          jamMasuk = parseTime(jamMasukCell.toString().trim());
        }
      }
    }
    
    // Get jam pulang from jam pulang row
    let jamPulang: string | null = null;
    if (jamPulangRow !== -1) {
      const jamPulangCell = data[jamPulangRow] && data[jamPulangRow][col];
      if (jamPulangCell && jamPulangCell.toString().trim()) {
        const cellValue = jamPulangCell.toString().trim().toLowerCase();
        if (!cellValue.includes('absen')) {
          jamPulang = parseTime(jamPulangCell.toString().trim());
        }
      }
    }
    
    // Skip if both jam masuk and jam pulang are null (absen)
    if (!jamMasuk && !jamPulang) {
      console.log(`Skipping ${tanggal} for ${employeeInfo.nama} - marked as absen or no data`);
      continue;
    }
    
    // Calculate terlambat and pulang_tercatat
    const terlambat = jamMasuk ? jamMasuk > '10:00:00' : false;
    const pulang_tercatat = jamPulang ? 
      (jamPulang >= '15:00:00' && jamPulang <= '17:00:00') : false;
    
    const formattedData: ExcelData = {
      nama: employeeInfo.nama,
      status: employeeInfo.status,
      tanggal,
      jam_masuk: jamMasuk,
      jam_pulang: jamPulang,
      terlambat,
      pulang_tercatat
    };
    
    console.log(`Data for ${employeeInfo.nama} on ${tanggal}:`, formattedData);
    parsedData.push(formattedData);
  }
  
  return parsedData;
};

export const parseExcelData = (workbook: XLSX.WorkBook, selectedMonth: number, selectedYear: number): ExcelData[] => {
  const allParsedData: ExcelData[] = [];
  
  console.log('Available sheets:', workbook.SheetNames);
  
  // Filter and process only numeric sheets starting from 14.15.17
  const sheetsToProcess = workbook.SheetNames.filter(sheetName => 
    shouldProcessSheet(sheetName, workbook.SheetNames)
  );
  
  console.log('Sheets to process:', sheetsToProcess);
  
  if (sheetsToProcess.length === 0) {
    throw new Error('Tidak ditemukan sheet dengan nama angka yang valid (mulai dari 14.15.17)');
  }
  
  for (const sheetName of sheetsToProcess) {
    try {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;
      
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      const sheetData = parseSheetData(data, sheetName, selectedMonth, selectedYear);
      
      allParsedData.push(...sheetData);
      
    } catch (error) {
      console.log(`Error parsing sheet ${sheetName}:`, error);
      continue;
    }
  }
  
  if (allParsedData.length === 0) {
    throw new Error('Tidak ada data valid yang ditemukan dalam sheet yang diproses');
  }
  
  console.log('Total parsed data:', allParsedData);
  return allParsedData;
};
