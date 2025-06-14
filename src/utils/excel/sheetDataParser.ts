
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
  
  console.log(`Found attendance table structure:`, {
    dateRow,
    jamMasukRow,
    jamPulangRow,
    dateColumnsCount: dateColumns.length
  });
  
  // Process each date column
  for (const { col, day } of dateColumns) {
    const tanggal = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    console.log(`Processing date ${tanggal} for day ${day} in column ${col}`);
    
    // Get jam masuk - look for data in the rows below the date
    let jamMasuk: string | null = null;
    
    // Search in the next few rows after the date row for time data
    for (let searchRow = dateRow + 1; searchRow < Math.min(data.length, dateRow + 30); searchRow++) {
      const cell = data[searchRow] && data[searchRow][col];
      if (cell && cell.toString().trim()) {
        const cellValue = cell.toString().trim().toLowerCase();
        console.log(`Checking cell [${searchRow}][${col}] for jam masuk: "${cellValue}"`);
        
        if (!cellValue.includes('absen') && cellValue.match(/\d{1,2}[:.]\d{2}/)) {
          jamMasuk = parseTime(cell.toString().trim());
          console.log(`Found jam masuk: ${jamMasuk} at [${searchRow}][${col}]`);
          break;
        }
      }
    }
    
    // Get jam pulang - look in columns to the right of jam masuk
    let jamPulang: string | null = null;
    
    // Look in the same row as jam masuk but in adjacent columns
    if (jamMasuk) {
      for (let searchRow = dateRow + 1; searchRow < Math.min(data.length, dateRow + 30); searchRow++) {
        // Check a few columns to the right for jam pulang
        for (let searchCol = col + 1; searchCol <= col + 5; searchCol++) {
          const cell = data[searchRow] && data[searchRow][searchCol];
          if (cell && cell.toString().trim()) {
            const cellValue = cell.toString().trim().toLowerCase();
            console.log(`Checking cell [${searchRow}][${searchCol}] for jam pulang: "${cellValue}"`);
            
            if (!cellValue.includes('absen') && cellValue.match(/\d{1,2}[:.]\d{2}/)) {
              const parsedTime = parseTime(cell.toString().trim());
              // Make sure it's different from jam masuk and looks like afternoon time
              if (parsedTime && parsedTime !== jamMasuk && parsedTime >= '13:00:00') {
                jamPulang = parsedTime;
                console.log(`Found jam pulang: ${jamPulang} at [${searchRow}][${searchCol}]`);
                break;
              }
            }
          }
        }
        if (jamPulang) break;
      }
    }
    
    // Skip if both jam masuk and jam pulang are null (absen)
    if (!jamMasuk && !jamPulang) {
      console.log(`Skipping ${tanggal} for ${employeeInfo.nama} - no valid time data found`);
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
