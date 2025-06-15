
import { ExcelData } from '@/types/excel';
import { findEmployeeInfo } from './employeeParser';
import { findAttendanceTable } from './attendanceTableParser';
import { parseTime } from './timeParser';

export const parseSheetData = (data: any[][], sheetName: string, selectedMonth: number, selectedYear: number): ExcelData[] => {
  const parsedData: ExcelData[] = [];
  
  console.log(`\n🔍 =============== Processing sheet: ${sheetName} ===============`);
  console.log(`📊 Sheet dimensions: ${data.length} rows x ${(data[0] || []).length} columns`);
  
  try {
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
      
      console.log(`\n📅 ========== Processing date ${tanggal} (day ${day}) in column ${col} ==========`);
      
      // Look for jam masuk and jam pulang data in the rows below the date
      let jamMasuk: string | null = null;
      let jamPulang: string | null = null;
      let isAbsen = false;
      
      // Search in multiple rows after the date row for time data
      const searchRows = [];
      for (let i = 1; i <= 10; i++) {
        searchRows.push(dateRow + i);
      }
      
      console.log(`🔍 Will search for time data in rows:`, searchRows);
      
      for (const searchRow of searchRows) {
        if (searchRow >= data.length) continue;
        
        const cell = data[searchRow] && data[searchRow][col];
        if (cell && cell.toString().trim()) {
          const cellValue = cell.toString().trim();
          console.log(`  📋 Checking [${searchRow}][${col}]: "${cellValue}"`);
          
          // Check for absence indicators first
          const cellLower = cellValue.toLowerCase();
          if (cellLower.includes('absen') || cellLower.includes('ijin') || 
              cellLower.includes('sakit') || cellLower.includes('cuti') ||
              cellLower.includes('libur') || cellLower === '-' ||
              cellLower.includes('tidak') || cellLower.includes('kosong')) {
            console.log(`    🚫 Found absence indicator: ${cellValue}`);
            isAbsen = true;
            break;
          }
          
          // Try to parse as time
          const parsedTime = parseTime(cellValue);
          if (parsedTime) {
            const timeHour = parseInt(parsedTime.split(':')[0]);
            
            // Logic for determining jam masuk vs jam pulang
            if (timeHour < 12 && !jamMasuk) {
              jamMasuk = parsedTime;
              console.log(`  ✅ Found jam masuk: ${jamMasuk}`);
            } else if (timeHour >= 12 && !jamPulang) {
              jamPulang = parsedTime;
              console.log(`  ✅ Found jam pulang: ${jamPulang}`);
            } else if (!jamMasuk) {
              jamMasuk = parsedTime;
              console.log(`  ✅ Found jam masuk (fallback): ${jamMasuk}`);
            } else if (!jamPulang) {
              jamPulang = parsedTime;
              console.log(`  ✅ Found jam pulang (fallback): ${jamPulang}`);
            }
          }
        }
        
        // Also check adjacent columns for jam pulang if we found jam masuk
        if (jamMasuk && !jamPulang) {
          for (let adjCol = col + 1; adjCol <= col + 3; adjCol++) {
            const adjCell = data[searchRow] && data[searchRow][adjCol];
            if (adjCell && adjCell.toString().trim()) {
              const adjCellValue = adjCell.toString().trim();
              const adjCellLower = adjCellValue.toLowerCase();
              
              // Skip absence indicators
              if (adjCellLower.includes('absen') || adjCellLower.includes('ijin') || 
                  adjCellLower.includes('sakit') || adjCellLower.includes('cuti') ||
                  adjCellLower === '-' || adjCellLower.includes('tidak')) {
                continue;
              }
              
              const parsedAdjTime = parseTime(adjCellValue);
              if (parsedAdjTime && parsedAdjTime !== jamMasuk) {
                jamPulang = parsedAdjTime;
                console.log(`  ✅ Found jam pulang in adjacent column: ${jamPulang} at [${searchRow}][${adjCol}]`);
                break;
              }
            }
          }
        }
      }
      
      console.log(`📋 Final times for ${tanggal}: jam_masuk=${jamMasuk}, jam_pulang=${jamPulang}, isAbsen=${isAbsen}`);
      
      // Only add data if there's meaningful attendance data
      if (isAbsen || jamMasuk || jamPulang) {
        // Calculate terlambat and pulang_tercatat based on business logic
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
      } else {
        console.log(`⚠️ Skipping ${tanggal} - no meaningful attendance data found`);
      }
    }
    
  } catch (error) {
    console.error(`❌ Error parsing sheet ${sheetName}:`, error);
  }
  
  console.log(`\n🎉 SUMMARY: Successfully parsed ${parsedData.length} entries for ${sheetName}`);
  return parsedData;
};
