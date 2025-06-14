
import { ExcelData } from '@/types/excel';
import { findEmployeeInfo } from './employeeParser';
import { findAttendanceTable } from './attendanceTableParser';
import { parseTime } from './timeParser';

export const parseSheetData = (data: any[][], sheetName: string, selectedMonth: number, selectedYear: number): ExcelData[] => {
  const parsedData: ExcelData[] = [];
  
  console.log(`\n🔍 Processing sheet: ${sheetName}`);
  console.log(`📊 Sheet data preview (first 15 rows):`, data.slice(0, 15));
  
  // Find employee info (nama and status)
  const employeeInfo = findEmployeeInfo(data);
  if (!employeeInfo) {
    console.log(`❌ No employee info found in sheet ${sheetName}`);
    return parsedData;
  }
  
  console.log(`👤 Found employee info:`, employeeInfo);
  
  // Find attendance table structure
  const { dateRow, jamMasukRow, jamPulangRow, dateColumns } = findAttendanceTable(data);
  
  if (dateRow === -1 || dateColumns.length === 0) {
    console.log(`❌ No attendance table found in sheet ${sheetName}`);
    console.log(`Debug: dateRow=${dateRow}, dateColumns.length=${dateColumns.length}`);
    return parsedData;
  }
  
  console.log(`✅ Found attendance table structure:`, {
    dateRow,
    jamMasukRow,
    jamPulangRow,
    dateColumnsCount: dateColumns.length
  });
  
  // Process each date column
  for (const { col, day } of dateColumns) {
    const tanggal = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    console.log(`\n📅 Processing date ${tanggal} (day ${day}) in column ${col}`);
    
    // Look for jam masuk in the rows below the date
    let jamMasuk: string | null = null;
    
    // Search in the next few rows after the date row
    const searchRows = [dateRow + 1, dateRow + 2, dateRow + 3, dateRow + 4];
    
    for (const searchRow of searchRows) {
      if (searchRow >= data.length) continue;
      
      const cell = data[searchRow] && data[searchRow][col];
      if (cell && cell.toString().trim()) {
        const cellValue = cell.toString().trim();
        console.log(`  Checking [${searchRow}][${col}] for jam masuk: "${cellValue}"`);
        
        // Skip absence indicators
        const cellLower = cellValue.toLowerCase();
        if (cellLower.includes('absen') || cellLower.includes('ijin') || 
            cellLower.includes('sakit') || cellLower.includes('cuti')) {
          console.log(`    Skipping ${cellValue} - indicates absence`);
          continue;
        }
        
        // Look for time patterns
        const parsedTime = parseTime(cellValue);
        if (parsedTime) {
          jamMasuk = parsedTime;
          console.log(`  ✅ Found jam masuk: ${jamMasuk}`);
          break;
        }
      }
    }
    
    // Look for jam pulang in adjacent columns and rows
    let jamPulang: string | null = null;
    
    // Check columns to the right of the current date column
    const adjacentCols = [col + 1, col + 2, col + 3];
    
    for (const adjCol of adjacentCols) {
      let foundPulang = false;
      
      for (const searchRow of searchRows) {
        if (searchRow >= data.length) continue;
        
        const cell = data[searchRow] && data[searchRow][adjCol];
        if (cell && cell.toString().trim()) {
          const cellValue = cell.toString().trim();
          console.log(`  Checking [${searchRow}][${adjCol}] for jam pulang: "${cellValue}"`);
          
          // Skip absence indicators
          const cellLower = cellValue.toLowerCase();
          if (cellLower.includes('absen') || cellLower.includes('ijin') || 
              cellLower.includes('sakit') || cellLower.includes('cuti')) {
            continue;
          }
          
          const parsedTime = parseTime(cellValue);
          if (parsedTime && parsedTime !== jamMasuk) {
            // Check if this looks like afternoon time
            const timeHour = parseInt(parsedTime.split(':')[0]);
            if (timeHour >= 12) {
              jamPulang = parsedTime;
              console.log(`  ✅ Found jam pulang: ${jamPulang}`);
              foundPulang = true;
              break;
            }
          }
        }
      }
      
      if (foundPulang) break;
    }
    
    console.log(`📋 Final times for ${tanggal}: jam_masuk=${jamMasuk}, jam_pulang=${jamPulang}`);
    
    // Skip if both times are null (indicates absence)
    if (!jamMasuk && !jamPulang) {
      console.log(`⏭️ Skipping ${tanggal} - no valid time data (likely absent)`);
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
    
    console.log(`✅ Added data for ${employeeInfo.nama} on ${tanggal}:`, formattedData);
    parsedData.push(formattedData);
  }
  
  console.log(`\n🎉 SUMMARY: Successfully parsed ${parsedData.length} entries for ${sheetName}`);
  return parsedData;
};
