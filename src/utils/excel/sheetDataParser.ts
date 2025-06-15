
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
      for (let i = 1; i <= 8; i++) {
        searchRows.push(dateRow + i);
      }
      
      // Also look for "Jam Kerja" or similar headers
      let jamMasukSearchRows: number[] = [];
      let jamPulangSearchRows: number[] = [];
      
      // Find rows with "Jam Kerja" or time-related headers
      for (let row = dateRow + 1; row < Math.min(data.length, dateRow + 15); row++) {
        for (let checkCol = 0; checkCol < Math.min((data[row] || []).length, 10); checkCol++) {
          const cell = data[row] && data[row][checkCol];
          if (cell) {
            const cellStr = cell.toString().toLowerCase().trim();
            
            if (cellStr.includes('jam') && cellStr.includes('kerja')) {
              console.log(`🕐 Found "Jam Kerja" at [${row}][${checkCol}]`);
              
              // Look for "Masuk" and "Keluar" in adjacent cells
              for (let adjCol = checkCol; adjCol < Math.min((data[row] || []).length, checkCol + 10); adjCol++) {
                const adjCell = data[row] && data[row][adjCol];
                if (adjCell) {
                  const adjStr = adjCell.toString().toLowerCase().trim();
                  if (adjStr.includes('masuk')) {
                    jamMasukSearchRows.push(row + 1, row + 2);
                    console.log(`📥 Found "Masuk" at [${row}][${adjCol}], will search rows ${row + 1}, ${row + 2}`);
                  }
                  if (adjStr.includes('keluar') || adjStr.includes('pulang')) {
                    jamPulangSearchRows.push(row + 1, row + 2);
                    console.log(`📤 Found "Keluar/Pulang" at [${row}][${adjCol}], will search rows ${row + 1}, ${row + 2}`);
                  }
                }
              }
            }
          }
        }
      }
      
      // Combine all search rows
      const allSearchRows = [...new Set([...searchRows, ...jamMasukSearchRows, ...jamPulangSearchRows])];
      
      console.log(`🔍 Will search for time data in rows:`, allSearchRows);
      
      for (const searchRow of allSearchRows) {
        if (searchRow >= data.length) continue;
        
        const cell = data[searchRow] && data[searchRow][col];
        if (cell && cell.toString().trim()) {
          const cellValue = cell.toString().trim();
          console.log(`  📋 Checking [${searchRow}][${col}]: "${cellValue}"`);
          
          // Check for absence indicators
          const cellLower = cellValue.toLowerCase();
          if (cellLower.includes('absen') || cellLower.includes('ijin') || 
              cellLower.includes('sakit') || cellLower.includes('cuti') ||
              cellLower.includes('libur') || cellLower === '-') {
            console.log(`    🚫 Found absence indicator: ${cellValue}`);
            isAbsen = true;
            break;
          }
          
          // Look for time patterns
          const parsedTime = parseTime(cellValue);
          if (parsedTime) {
            // Determine if this is jam masuk or jam pulang based on context
            const timeHour = parseInt(parsedTime.split(':')[0]);
            
            if (timeHour <= 12 && !jamMasuk) {
              jamMasuk = parsedTime;
              console.log(`  ✅ Found jam masuk: ${jamMasuk}`);
            } else if (timeHour > 12 && !jamPulang) {
              jamPulang = parsedTime;
              console.log(`  ✅ Found jam pulang: ${jamPulang}`);
            }
          }
        }
        
        // Also check adjacent columns for jam pulang if we found jam masuk
        if (jamMasuk && !jamPulang) {
          for (let adjCol = col + 1; adjCol <= col + 5; adjCol++) {
            const adjCell = data[searchRow] && data[searchRow][adjCol];
            if (adjCell && adjCell.toString().trim()) {
              const adjCellValue = adjCell.toString().trim();
              const adjCellLower = adjCellValue.toLowerCase();
              
              // Skip absence indicators
              if (adjCellLower.includes('absen') || adjCellLower.includes('ijin') || 
                  adjCellLower.includes('sakit') || adjCellLower.includes('cuti') ||
                  adjCellLower === '-') {
                continue;
              }
              
              const parsedAdjTime = parseTime(adjCellValue);
              if (parsedAdjTime && parsedAdjTime !== jamMasuk) {
                const timeHour = parseInt(parsedAdjTime.split(':')[0]);
                if (timeHour >= 12) {
                  jamPulang = parsedAdjTime;
                  console.log(`  ✅ Found jam pulang: ${jamPulang} at [${searchRow}][${adjCol}]`);
                  break;
                }
              }
            }
          }
        }
      }
      
      console.log(`📋 Final times for ${tanggal}: jam_masuk=${jamMasuk}, jam_pulang=${jamPulang}, isAbsen=${isAbsen}`);
      
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
    }
    
  } catch (error) {
    console.error(`❌ Error parsing sheet ${sheetName}:`, error);
  }
  
  console.log(`\n🎉 SUMMARY: Successfully parsed ${parsedData.length} entries for ${sheetName}`);
  return parsedData;
};
