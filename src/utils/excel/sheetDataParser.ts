
import { ExcelData } from '@/types/excel';
import { findEmployeeInfo } from './employeeParser';
import { findAttendanceTable } from './attendanceTableParser';
import { parseTime } from './timeParser';

export const parseSheetData = (data: any[][], sheetName: string, selectedMonth: number, selectedYear: number): ExcelData[] => {
  const parsedData: ExcelData[] = [];
  
  console.log(`\n🔍 =============== Processing sheet: ${sheetName} ===============`);
  console.log(`📊 Sheet dimensions: ${data.length} rows x ${(data[0] || []).length} columns`);
  
  try {
    // Find attendance table structure and employee columns
    const { dateRow, jamMasukRow, jamPulangRow, employeeColumns } = findAttendanceTable(data);
    
    if (dateRow === -1 || employeeColumns.length === 0) {
      console.log(`❌ No valid attendance structure found in sheet ${sheetName}`);
      return parsedData;
    }
    
    console.log(`✅ Found attendance table with ${employeeColumns.length} employee columns`);
    
    // Process each employee column
    for (const employeeCol of employeeColumns) {
      console.log(`\n👤 ========== Processing employee column ${employeeCol} ==========`);
      
      // Get employee info for this column
      const employeeInfo = findEmployeeInfo(data, employeeCol);
      if (!employeeInfo) {
        console.log(`❌ No employee info found for column ${employeeCol}`);
        continue;
      }
      
      console.log(`✅ Found employee: ${employeeInfo.nama} (${employeeInfo.status})`);
      
      // Get all dates from the date row and process attendance for each
      const dateRowData = data[dateRow] || [];
      for (let dateCol = 0; dateCol < Math.min(dateRowData.length, 50); dateCol++) {
        const dateCell = dateRowData[dateCol];
        if (dateCell && dateCell.toString().trim()) {
          const cellStr = dateCell.toString().trim();
          
          // Check if this is a valid date (1-31)
          if (/^\d{1,2}$/.test(cellStr)) {
            const day = parseInt(cellStr);
            if (day >= 1 && day <= 31) {
              const tanggal = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
              
              console.log(`\n📅 Processing date ${tanggal} (day ${day}) for ${employeeInfo.nama}`);
              
              // Get attendance data for this employee and date
              let jamMasuk: string | null = null;
              let jamPulang: string | null = null;
              let isAbsen = false;
              
              // Check jam masuk for this employee at this date
              if (jamMasukRow !== -1 && data[jamMasukRow] && data[jamMasukRow][dateCol]) {
                const jamMasukCell = data[jamMasukRow][dateCol];
                if (jamMasukCell && jamMasukCell.toString().trim()) {
                  const cellValue = jamMasukCell.toString().trim();
                  console.log(`  📋 Jam masuk [${jamMasukRow}][${dateCol}]: "${cellValue}"`);
                  
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
                      console.log(`    ✅ Parsed jam masuk: ${jamMasuk}`);
                    }
                  }
                }
              }
              
              // Check jam pulang for this employee at this date
              if (jamPulangRow !== -1 && data[jamPulangRow] && data[jamPulangRow][dateCol]) {
                const jamPulangCell = data[jamPulangRow][dateCol];
                if (jamPulangCell && jamPulangCell.toString().trim()) {
                  const cellValue = jamPulangCell.toString().trim();
                  console.log(`  📋 Jam pulang [${jamPulangRow}][${dateCol}]: "${cellValue}"`);
                  
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
                      console.log(`    ✅ Parsed jam pulang: ${jamPulang}`);
                    }
                  }
                }
              }
              
              // Only add data if there's meaningful attendance information
              if (isAbsen || jamMasuk || jamPulang) {
                // Final validation for time values
                let validJamMasuk = jamMasuk;
                let validJamPulang = jamPulang;
                
                if (jamMasuk) {
                  const timeParts = jamMasuk.split(':');
                  if (timeParts.length >= 2) {
                    const hours = parseInt(timeParts[0]);
                    const minutes = parseInt(timeParts[1]);
                    if (hours >= 24 || hours < 0 || minutes >= 60 || minutes < 0 || isNaN(hours) || isNaN(minutes)) {
                      console.log(`❌ Invalid jam_masuk: ${jamMasuk}, skipping`);
                      validJamMasuk = null;
                    }
                  }
                }
                
                if (jamPulang) {
                  const timeParts = jamPulang.split(':');
                  if (timeParts.length >= 2) {
                    const hours = parseInt(timeParts[0]);
                    const minutes = parseInt(timeParts[1]);
                    if (hours >= 24 || hours < 0 || minutes >= 60 || minutes < 0 || isNaN(hours) || isNaN(minutes)) {
                      console.log(`❌ Invalid jam_pulang: ${jamPulang}, skipping`);
                      validJamPulang = null;
                    }
                  }
                }
                
                // Calculate business logic
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
                console.log(`⚠️ Skipping ${tanggal} for ${employeeInfo.nama} - no attendance data`);
              }
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error(`❌ Error parsing sheet ${sheetName}:`, error);
  }
  
  console.log(`\n🎉 SUMMARY: Successfully parsed ${parsedData.length} entries for ${sheetName}`);
  return parsedData;
};
