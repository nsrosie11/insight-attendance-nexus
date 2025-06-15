
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
    
    // Find attendance table structure - look for date column with daily entries
    const { dateRow, dateColumns } = findAttendanceTable(data);
    
    if (dateRow === -1 || dateColumns.length === 0) {
      console.log(`❌ No attendance table found in sheet ${sheetName}`);
      return parsedData;
    }
    
    console.log(`✅ Found attendance table with ${dateColumns.length} date entries starting at row ${dateRow}`);
    
    // Process each date entry (now these are rows, not columns)
    for (const { col: dateCol, day } of dateColumns) {
      const tanggal = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      console.log(`\n📅 ========== Processing date ${tanggal} (day ${day}) ==========`);
      
      // Find the row where this date is located
      let dateRowIndex = -1;
      for (let row = dateRow; row < Math.min(data.length, dateRow + 40); row++) {
        const cell = data[row] && data[row][dateCol];
        if (cell) {
          const cellStr = cell.toString().trim();
          const dayMatch = cellStr.match(/^(\d{1,2})/);
          if (dayMatch && parseInt(dayMatch[1]) === day) {
            dateRowIndex = row;
            break;
          }
        }
      }
      
      if (dateRowIndex === -1) {
        console.log(`❌ Could not find row for day ${day}`);
        continue;
      }
      
      console.log(`📍 Found day ${day} at row ${dateRowIndex}`);
      
      // Look for jam masuk and jam pulang in the same row, different columns
      let jamMasuk: string | null = null;
      let jamPulang: string | null = null;
      let isAbsen = false;
      
      const rowData = data[dateRowIndex] || [];
      console.log(`📋 Row ${dateRowIndex} data:`, rowData.slice(0, 15));
      
      // Look through the row for time data (typically in columns after the date)
      for (let col = dateCol + 1; col < Math.min(rowData.length, dateCol + 10); col++) {
        const cell = rowData[col];
        if (cell && cell.toString().trim()) {
          const cellValue = cell.toString().trim();
          console.log(`  📋 Checking [${dateRowIndex}][${col}]: "${cellValue}"`);
          
          // Check for absence indicators
          const cellLower = cellValue.toLowerCase();
          if (cellLower.includes('absen') || cellLower.includes('ijin') || 
              cellLower.includes('sakit') || cellLower.includes('cuti') ||
              cellLower.includes('libur') || cellLower === '-' ||
              cellLower.includes('tidak') || cellLower.includes('kosong') ||
              cellLower.includes('alfa') || cellLower.includes('alpa')) {
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
