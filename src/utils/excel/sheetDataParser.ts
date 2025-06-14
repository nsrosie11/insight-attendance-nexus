
import { ExcelData } from '@/types/excel';
import { findEmployeeInfo } from './employeeParser';
import { findAttendanceTable } from './attendanceTableParser';
import { parseTime } from './timeParser';

export const parseSheetData = (data: any[][], sheetName: string, selectedMonth: number, selectedYear: number): ExcelData[] => {
  const parsedData: ExcelData[] = [];
  
  console.log(`Processing sheet: ${sheetName}`);
  console.log(`Sheet data preview (first 20 rows):`, data.slice(0, 20));
  
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
    dateColumnsCount: dateColumns.length,
    dateColumns: dateColumns.slice(0, 5) // Show first 5 for debugging
  });
  
  // Process each date column
  for (const { col, day } of dateColumns) {
    const tanggal = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    console.log(`\n=== Processing date ${tanggal} for day ${day} in column ${col} ===`);
    
    // Get jam masuk - look for data in the rows below and around the date
    let jamMasuk: string | null = null;
    
    // Search in multiple rows around the date for time data
    const searchRows = [
      dateRow + 1, dateRow + 2, dateRow + 3, dateRow + 4, dateRow + 5,
      dateRow - 1, dateRow - 2 // Also check rows above just in case
    ];
    
    for (const searchRow of searchRows) {
      if (searchRow < 0 || searchRow >= data.length) continue;
      
      const cell = data[searchRow] && data[searchRow][col];
      if (cell && cell.toString().trim()) {
        const cellValue = cell.toString().trim();
        console.log(`Checking cell [${searchRow}][${col}] for jam masuk: "${cellValue}"`);
        
        // Skip cells with "absen" or similar
        if (cellValue.toLowerCase().includes('absen') || 
            cellValue.toLowerCase().includes('ijin') ||
            cellValue.toLowerCase().includes('sakit')) {
          console.log(`Skipping ${cellValue} - indicates absence`);
          continue;
        }
        
        // Look for time patterns
        if (cellValue.match(/\d{1,2}[:.]\d{2}/) || cellValue.match(/^\d{1,2}$/)) {
          const parsedJamMasuk = parseTime(cellValue);
          if (parsedJamMasuk) {
            jamMasuk = parsedJamMasuk;
            console.log(`Found jam masuk: ${jamMasuk} at [${searchRow}][${col}]`);
            break;
          }
        }
      }
    }
    
    // Get jam pulang - look in adjacent columns and surrounding rows
    let jamPulang: string | null = null;
    
    // Search in nearby columns and rows for jam pulang
    for (const searchRow of searchRows) {
      if (searchRow < 0 || searchRow >= data.length) continue;
      
      // Check multiple columns to the right and left
      const searchCols = [col + 1, col + 2, col + 3, col - 1];
      
      for (const searchCol of searchCols) {
        if (searchCol < 0) continue;
        
        const cell = data[searchRow] && data[searchRow][searchCol];
        if (cell && cell.toString().trim()) {
          const cellValue = cell.toString().trim();
          console.log(`Checking cell [${searchRow}][${searchCol}] for jam pulang: "${cellValue}"`);
          
          // Skip cells with "absen" or similar
          if (cellValue.toLowerCase().includes('absen') || 
              cellValue.toLowerCase().includes('ijin') ||
              cellValue.toLowerCase().includes('sakit')) {
            continue;
          }
          
          // Look for time patterns
          if (cellValue.match(/\d{1,2}[:.]\d{2}/) || cellValue.match(/^\d{1,2}$/)) {
            const parsedJamPulang = parseTime(cellValue);
            if (parsedJamPulang && parsedJamPulang !== jamMasuk) {
              // Check if this looks like afternoon time (after 12:00)
              if (parsedJamPulang >= '12:00:00') {
                jamPulang = parsedJamPulang;
                console.log(`Found jam pulang: ${jamPulang} at [${searchRow}][${searchCol}]`);
                break;
              }
            }
          }
        }
      }
      if (jamPulang) break;
    }
    
    console.log(`Final times for ${tanggal}: jam_masuk=${jamMasuk}, jam_pulang=${jamPulang}`);
    
    // Skip if both jam masuk and jam pulang are null (indicates absence)
    if (!jamMasuk && !jamPulang) {
      console.log(`Skipping ${tanggal} for ${employeeInfo.nama} - no valid time data found (likely absent)`);
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
    
    console.log(`✓ Data for ${employeeInfo.nama} on ${tanggal}:`, formattedData);
    parsedData.push(formattedData);
  }
  
  console.log(`\n=== SUMMARY: Total parsed entries for ${sheetName}: ${parsedData.length} ===`);
  return parsedData;
};
