
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
  const { dateRow, dateColumns } = findAttendanceTable(data);
  
  if (dateRow === -1 || dateColumns.length === 0) {
    console.log(`❌ No attendance table found in sheet ${sheetName}`);
    return parsedData;
  }
  
  console.log(`✅ Found attendance table structure:`, {
    dateRow,
    dateColumnsCount: dateColumns.length
  });
  
  // Process each date column
  for (const { col, day } of dateColumns) {
    const tanggal = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    console.log(`\n📅 Processing date ${tanggal} (day ${day}) in column ${col}`);
    
    // Look for jam masuk data in the rows below the date
    let jamMasuk: string | null = null;
    let jamPulang: string | null = null;
    let isAbsen = false;
    
    // Search in the next few rows after the date row for time data
    const searchRows = [dateRow + 1, dateRow + 2, dateRow + 3, dateRow + 4, dateRow + 5];
    
    for (const searchRow of searchRows) {
      if (searchRow >= data.length) continue;
      
      const cell = data[searchRow] && data[searchRow][col];
      if (cell && cell.toString().trim()) {
        const cellValue = cell.toString().trim();
        console.log(`  Checking [${searchRow}][${col}]: "${cellValue}"`);
        
        // Check for absence indicators
        const cellLower = cellValue.toLowerCase();
        if (cellLower.includes('absen') || cellLower.includes('ijin') || 
            cellLower.includes('sakit') || cellLower.includes('cuti')) {
          console.log(`    Found absence indicator: ${cellValue}`);
          isAbsen = true;
          break;
        }
        
        // Look for time patterns for jam masuk
        const parsedTime = parseTime(cellValue);
        if (parsedTime && !jamMasuk) {
          jamMasuk = parsedTime;
          console.log(`  ✅ Found jam masuk: ${jamMasuk}`);
        }
      }
      
      // Also check adjacent columns for jam pulang
      for (let adjCol = col + 1; adjCol <= col + 3; adjCol++) {
        const adjCell = data[searchRow] && data[searchRow][adjCol];
        if (adjCell && adjCell.toString().trim()) {
          const adjCellValue = adjCell.toString().trim();
          const adjCellLower = adjCellValue.toLowerCase();
          
          // Skip absence indicators
          if (adjCellLower.includes('absen') || adjCellLower.includes('ijin') || 
              adjCellLower.includes('sakit') || adjCellLower.includes('cuti')) {
            continue;
          }
          
          const parsedAdjTime = parseTime(adjCellValue);
          if (parsedAdjTime && parsedAdjTime !== jamMasuk && !jamPulang) {
            // Check if this looks like afternoon time (jam pulang)
            const timeHour = parseInt(parsedAdjTime.split(':')[0]);
            if (timeHour >= 12) {
              jamPulang = parsedAdjTime;
              console.log(`  ✅ Found jam pulang: ${jamPulang} at [${searchRow}][${adjCol}]`);
            }
          }
        }
      }
    }
    
    console.log(`📋 Final times for ${tanggal}: jam_masuk=${jamMasuk}, jam_pulang=${jamPulang}, isAbsen=${isAbsen}`);
    
    // Skip creating entry if it's marked as absent
    if (isAbsen) {
      console.log(`⏭️ Skipping ${tanggal} - marked as absent`);
      
      // Create entry for absent day
      const absentData: ExcelData = {
        nama: employeeInfo.nama,
        status: employeeInfo.status,
        tanggal,
        jam_masuk: null,
        jam_pulang: null,
        terlambat: false,
        pulang_tercatat: false
      };
      
      parsedData.push(absentData);
      continue;
    }
    
    // Skip if no valid time data found (but not explicitly marked as absent)
    if (!jamMasuk && !jamPulang) {
      console.log(`⏭️ Skipping ${tanggal} - no time data found`);
      continue;
    }
    
    // Calculate terlambat and pulang_tercatat based on your logic
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
