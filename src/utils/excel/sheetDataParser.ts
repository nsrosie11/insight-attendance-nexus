
import { ExcelData } from '@/types/excel';
import { findEmployeeInfo } from './employeeParser';
import { findAttendanceTable } from './attendanceTableParser';
import { parseTime } from './timeParser';

export const parseSheetData = (data: any[][], sheetName: string, selectedMonth: number, selectedYear: number): ExcelData[] => {
  const parsedData: ExcelData[] = [];
  
  console.log(`\n🔍 =============== Processing sheet: ${sheetName} ===============`);
  console.log(`📊 Sheet dimensions: ${data.length} rows x ${(data[0] || []).length} columns`);
  
  try {
    // Find attendance table structure
    const { dateRow, jamMasukRow, jamPulangRow, employeeColumns } = findAttendanceTable(data);
    
    if (dateRow === -1) {
      console.log(`❌ No date row found in sheet ${sheetName}`);
      return parsedData;
    }
    
    if (employeeColumns.length === 0) {
      console.log(`❌ No employee columns found in sheet ${sheetName}`);
      return parsedData;
    }
    
    console.log(`\n✅ Found structure: dateRow=${dateRow}, jamMasuk=${jamMasukRow}, jamPulang=${jamPulangRow}`);
    console.log(`✅ Employee columns: [${employeeColumns.join(', ')}]`);
    
    // Process each employee column
    for (const employeeCol of employeeColumns) {
      console.log(`\n👤 ========== Processing employee column ${employeeCol} ==========`);
      
      // Get employee info
      const employeeInfo = findEmployeeInfo(data, employeeCol);
      if (!employeeInfo) {
        console.log(`❌ No employee info found for column ${employeeCol}`);
        continue;
      }
      
      console.log(`✅ Processing: ${employeeInfo.nama} (${employeeInfo.status})`);
      
      // Get date row data
      const dateRowData = data[dateRow] || [];
      console.log(`📅 Checking ${dateRowData.length} columns for dates...`);
      
      // Process each date column
      for (let dateCol = 0; dateCol < Math.min(dateRowData.length, 50); dateCol++) {
        const dateCell = dateRowData[dateCol];
        if (dateCell && dateCell.toString().trim()) {
          const cellStr = dateCell.toString().trim();
          
          // Check if this is a valid date (1-31)
          if (/^\d{1,2}$/.test(cellStr)) {
            const day = parseInt(cellStr);
            if (day >= 1 && day <= 31) {
              const tanggal = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
              
              console.log(`\n📅 Processing ${tanggal} (day ${day}) at dateCol ${dateCol}`);
              
              // Get attendance data
              let jamMasuk: string | null = null;
              let jamPulang: string | null = null;
              let isAbsen = false;
              
              // Check jam masuk
              if (jamMasukRow !== -1 && data[jamMasukRow] && data[jamMasukRow][dateCol]) {
                const jamMasukCell = data[jamMasukRow][dateCol];
                if (jamMasukCell && jamMasukCell.toString().trim()) {
                  const cellValue = jamMasukCell.toString().trim();
                  console.log(`  🕐 Jam masuk raw: "${cellValue}"`);
                  
                  const cellLower = cellValue.toLowerCase();
                  if (cellLower.includes('absen') || cellLower.includes('ijin') || 
                      cellLower.includes('sakit') || cellLower.includes('cuti') ||
                      cellLower === '-' || cellLower.includes('libur')) {
                    isAbsen = true;
                    console.log(`    🚫 Absence detected: ${cellValue}`);
                  } else {
                    jamMasuk = parseTime(cellValue);
                    console.log(`    ✅ Parsed jam masuk: ${jamMasuk}`);
                  }
                }
              }
              
              // Check jam pulang
              if (jamPulangRow !== -1 && data[jamPulangRow] && data[jamPulangRow][dateCol]) {
                const jamPulangCell = data[jamPulangRow][dateCol];
                if (jamPulangCell && jamPulangCell.toString().trim()) {
                  const cellValue = jamPulangCell.toString().trim();
                  console.log(`  🕐 Jam pulang raw: "${cellValue}"`);
                  
                  const cellLower = cellValue.toLowerCase();
                  if (cellLower.includes('absen') || cellLower.includes('ijin') || 
                      cellLower.includes('sakit') || cellLower.includes('cuti') ||
                      cellLower === '-' || cellLower.includes('libur')) {
                    isAbsen = true;
                    console.log(`    🚫 Absence detected: ${cellValue}`);
                  } else {
                    jamPulang = parseTime(cellValue);
                    console.log(`    ✅ Parsed jam pulang: ${jamPulang}`);
                  }
                }
              }
              
              // Add data if there's any attendance info
              if (isAbsen || jamMasuk || jamPulang) {
                const terlambat = jamMasuk ? jamMasuk > '10:00:00' : false;
                const pulang_tercatat = jamPulang ? 
                  (jamPulang >= '15:00:00' && jamPulang <= '17:00:00') : false;
                
                const attendanceData: ExcelData = {
                  nama: employeeInfo.nama,
                  status: employeeInfo.status,
                  tanggal,
                  jam_masuk: jamMasuk,
                  jam_pulang: jamPulang,
                  terlambat,
                  pulang_tercatat
                };
                
                parsedData.push(attendanceData);
                console.log(`✅ Added: ${employeeInfo.nama} on ${tanggal}`);
              } else {
                console.log(`⚠️ No attendance data for ${employeeInfo.nama} on ${tanggal}`);
              }
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error(`❌ Error parsing sheet ${sheetName}:`, error);
  }
  
  console.log(`\n🎉 Sheet ${sheetName} completed: ${parsedData.length} records`);
  return parsedData;
};
