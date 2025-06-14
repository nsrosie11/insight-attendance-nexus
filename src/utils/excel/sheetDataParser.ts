
import { ExcelData } from '@/types/excel';
import { findEmployeeInfo } from './employeeParser';
import { findAttendanceTable } from './attendanceTableParser';
import { parseTime } from './timeParser';

export const parseSheetData = (data: any[][], sheetName: string, selectedMonth: number, selectedYear: number): ExcelData[] => {
  const parsedData: ExcelData[] = [];
  
  console.log(`Processing sheet: ${sheetName}`);
  console.log(`Sheet data preview (first 15 rows):`, data.slice(0, 15));
  
  // Find employee info (nama and status)
  const employeeInfo = findEmployeeInfo(data);
  if (!employeeInfo) {
    console.log(`No employee info found in sheet ${sheetName}`);
    return parsedData;
  }
  
  console.log(`Found employee info:`, employeeInfo);
  
  // Find attendance table structure
  const { dateRow, jamMasukRow, jamPulangRow, dateColumns } = findAttendanceTable(data);
  
  if (dateRow === -1 || dateColumns.length === 0) {
    console.log(`No attendance table found in sheet ${sheetName}`);
    console.log(`Debug: dateRow=${dateRow}, dateColumns.length=${dateColumns.length}`);
    return parsedData;
  }
  
  if (jamMasukRow === -1 || jamPulangRow === -1) {
    console.log(`Incomplete attendance table structure in sheet ${sheetName}`);
    console.log(`Debug: jamMasukRow=${jamMasukRow}, jamPulangRow=${jamPulangRow}`);
    return parsedData;
  }
  
  console.log(`Found complete attendance table structure:`, {
    dateRow,
    jamMasukRow,
    jamPulangRow,
    dateColumnsCount: dateColumns.length
  });
  
  // Process each date column
  for (const { col, day } of dateColumns) {
    const tanggal = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    console.log(`Processing date ${tanggal} in column ${col}`);
    
    // Get jam masuk from jam masuk row
    let jamMasuk: string | null = null;
    if (jamMasukRow !== -1) {
      const jamMasukCell = data[jamMasukRow] && data[jamMasukRow][col];
      console.log(`Jam masuk cell [${jamMasukRow}][${col}]:`, jamMasukCell);
      if (jamMasukCell && jamMasukCell.toString().trim()) {
        const cellValue = jamMasukCell.toString().trim().toLowerCase();
        if (!cellValue.includes('absen')) {
          jamMasuk = parseTime(jamMasukCell.toString().trim());
          console.log(`Parsed jam masuk:`, jamMasuk);
        } else {
          console.log(`Jam masuk marked as absen`);
        }
      }
    }
    
    // Get jam pulang from jam pulang row
    let jamPulang: string | null = null;
    if (jamPulangRow !== -1) {
      const jamPulangCell = data[jamPulangRow] && data[jamPulangRow][col];
      console.log(`Jam pulang cell [${jamPulangRow}][${col}]:`, jamPulangCell);
      if (jamPulangCell && jamPulangCell.toString().trim()) {
        const cellValue = jamPulangCell.toString().trim().toLowerCase();
        if (!cellValue.includes('absen')) {
          jamPulang = parseTime(jamPulangCell.toString().trim());
          console.log(`Parsed jam pulang:`, jamPulang);
        } else {
          console.log(`Jam pulang marked as absen`);
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
  
  console.log(`Total parsed entries for ${sheetName}:`, parsedData.length);
  return parsedData;
};
