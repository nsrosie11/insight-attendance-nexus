
import { ExcelData } from '@/types/excel';
import { findEmployeeInfo } from './employeeParser';
import { findAttendanceTable } from './attendanceTableParser';
import { parseTime } from './timeParser';

export const parseSheetData = (data: any[][], sheetName: string, selectedMonth: number, selectedYear: number): ExcelData[] => {
  const parsedData: ExcelData[] = [];
  
  console.log(`\n🔍 =============== Processing sheet: ${sheetName} ===============`);
  console.log(`📊 Sheet dimensions: ${data.length} rows x ${(data[0] || []).length} columns`);
  
  try {
    // Find attendance table structure first
    const { dateRow, jamMasukRow, jamPulangRow, dateColumns } = findAttendanceTable(data);
    
    if (dateRow === -1 || dateColumns.length === 0) {
      console.log(`❌ No attendance table found in sheet ${sheetName}`);
      return parsedData;
    }
    
    console.log(`✅ Found attendance table with ${dateColumns.length} date entries starting at row ${dateRow}`);
    
    // Process each date column to find employee data
    for (const { col, day } of dateColumns) {
      const tanggal = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      console.log(`\n📅 ========== Processing date ${tanggal} (day ${day} at col ${col}) ==========`);
      
      // Find employee info for this column
      const employeeInfo = findEmployeeInfo(data, col);
      if (!employeeInfo) {
        console.log(`❌ No employee info found for column ${col}`);
        continue;
      }
      
      console.log(`👤 Found employee: ${employeeInfo.nama} (${employeeInfo.status})`);
      
      // Get time data from the appropriate rows
      let jamMasuk: string | null = null;
      let jamPulang: string | null = null;
      let isAbsen = false;
      
      // Check jam masuk
      if (jamMasukRow !== -1 && data[jamMasukRow] && data[jamMasukRow][col]) {
        const jamMasukCell = data[jamMasukRow][col];
        if (jamMasukCell && jamMasukCell.toString().trim()) {
          const cellValue = jamMasukCell.toString().trim();
          console.log(`  📋 Jam masuk cell [${jamMasukRow}][${col}]: "${cellValue}"`);
          
          // Check for absence indicators
          const cellLower = cellValue.toLowerCase();
          if (cellLower.includes('absen') || cellLower.includes('ijin') || 
              cellLower.includes('sakit') || cellLower.includes('cuti') ||
              cellLower.includes('libur') || cellLower === '-' ||
              cellLower.includes('tidak') || cellLower.includes('kosong') ||
              cellLower.includes('alfa') || cellLower.includes('alpa')) {
            console.log(`    🚫 Found absence indicator: ${cellValue}`);
            isAbsen = true;
          } else {
            jamMasuk = parseTime(cellValue);
            if (jamMasuk) {
              console.log(`    ✅ Found jam masuk: ${jamMasuk}`);
            }
          }
        }
      }
      
      // Check jam pulang
      if (jamPulangRow !== -1 && data[jamPulangRow] && data[jamPulangRow][col]) {
        const jamPulangCell = data[jamPulangRow][col];
        if (jamPulangCell && jamPulangCell.toString().trim()) {
          const cellValue = jamPulangCell.toString().trim();
          console.log(`  📋 Jam pulang cell [${jamPulangRow}][${col}]: "${cellValue}"`);
          
          // Check for absence indicators
          const cellLower = cellValue.toLowerCase();
          if (cellLower.includes('absen') || cellLower.includes('ijin') || 
              cellLower.includes('sakit') || cellLower.includes('cuti') ||
              cellLower.includes('libur') || cellLower === '-' ||
              cellLower.includes('tidak') || cellLower.includes('kosong') ||
              cellLower.includes('alfa') || cellLower.includes('alpa')) {
            console.log(`    🚫 Found absence indicator: ${cellValue}`);
            isAbsen = true;
          } else {
            jamPulang = parseTime(cellValue);
            if (jamPulang) {
              console.log(`    ✅ Found jam pulang: ${jamPulang}`);
            }
          }
        }
      }
      
      console.log(`📋 Final times for ${tanggal}: jam_masuk=${jamMasuk}, jam_pulang=${jamPulang}, isAbsen=${isAbsen}`);
      
      // Validate time values before creating data entry
      let validJamMasuk = jamMasuk;
      let validJamPulang = jamPulang;
      
      // Additional validation to prevent invalid times
      if (jamMasuk) {
        const [hours, minutes] = jamMasuk.split(':').map(Number);
        if (hours >= 24 || hours < 0 || minutes >= 60 || minutes < 0) {
          console.log(`❌ Invalid jam_masuk detected: ${jamMasuk}, skipping`);
          validJamMasuk = null;
        }
      }
      
      if (jamPulang) {
        const [hours, minutes] = jamPulang.split(':').map(Number);
        if (hours >= 24 || hours < 0 || minutes >= 60 || minutes < 0) {
          console.log(`❌ Invalid jam_pulang detected: ${jamPulang}, skipping`);
          validJamPulang = null;
        }
      }
      
      // Only add data if there's meaningful attendance data
      if (isAbsen || validJamMasuk || validJamPulang) {
        // Calculate terlambat and pulang_tercatat based on business logic
        const terlambat = validJamMasuk ? validJamMasuk > '10:00:00' : false;
        const pulang_tercatat = validJamPulang ? 
          (validJamPulang >= '15:00:00' && validJamPulang <= '17:00:00') : false;
        
        const formattedData: ExcelData = {
          nama: employeeInfo.nama,
          status: employeeInfo.status,
          tanggal,
          jam_masuk: validJamMasuk,
          jam_pulang: validJamPulang,
          terlambat,
          pulang_tercatat
        };
        
        console.log(`✅ Added data for ${employeeInfo.nama} on ${tanggal}:`, formattedData);
        parsedData.push(formattedData);
      } else {
        console.log(`⚠️ Skipping ${tanggal} for ${employeeInfo.nama} - no meaningful attendance data found`);
      }
    }
    
  } catch (error) {
    console.error(`❌ Error parsing sheet ${sheetName}:`, error);
  }
  
  console.log(`\n🎉 SUMMARY: Successfully parsed ${parsedData.length} entries for ${sheetName}`);
  return parsedData;
};
