
export const parseFlexibleAttendance = (data: any[][], sheetName: string, selectedMonth: number, selectedYear: number) => {
  console.log(`\n🔍 =============== PARSING SHEET: ${sheetName} ===============`);
  
  const results: any[] = [];
  
  try {
    // Show complete sheet structure first
    console.log(`\n=== 📋 SHEET STRUCTURE (First 15 rows) ===`);
    for (let row = 0; row < Math.min(15, data.length); row++) {
      const rowData = data[row] || [];
      console.log(`Row ${row.toString().padStart(2, '0')}:`, rowData.slice(0, 12).map((cell, idx) => `[${idx}]:"${cell || ''}"`).join(' | '));
    }
    
    // Step 1: Find date row (look for numbers 1-31)
    let dateRow = -1;
    let dateColumns: number[] = [];
    
    console.log('\n=== 🗓️ SEARCHING FOR DATE ROW ===');
    for (let row = 0; row < Math.min(20, data.length); row++) {
      const rowData = data[row] || [];
      const dateValues: number[] = [];
      const dateCols: number[] = [];
      
      for (let col = 0; col < Math.min(40, rowData.length); col++) {
        const cell = rowData[col];
        if (cell) {
          const cellStr = cell.toString().trim();
          if (/^\d{1,2}$/.test(cellStr)) {
            const num = parseInt(cellStr);
            if (num >= 1 && num <= 31) {
              dateValues.push(num);
              dateCols.push(col);
            }
          }
        }
      }
      
      console.log(`Row ${row}: found ${dateValues.length} dates: [${dateValues.slice(0, 10).join(', ')}...]`);
      
      // Need at least 10 dates and they should be somewhat sequential
      if (dateValues.length >= 10) {
        dateRow = row;
        dateColumns = dateCols;
        console.log(`✅ DATE ROW FOUND at row ${row} with ${dateColumns.length} date columns`);
        break;
      }
    }
    
    if (dateRow === -1) {
      console.log(`❌ No date row found in ${sheetName}`);
      return results;
    }
    
    // Step 2: Smart employee detection - look for real names, not headers
    console.log('\n=== 👥 SMART EMPLOYEE DETECTION ===');
    const employees: Array<{name: string; status: string; nameRow: number; nameCol: number}> = [];
    
    // Look for employees BEFORE the date row
    for (let row = 0; row < dateRow; row++) {
      const rowData = data[row] || [];
      
      for (let col = 0; col < Math.min(15, rowData.length); col++) {
        const cell = rowData[col];
        if (!cell) continue;
        
        const cellStr = cell.toString().trim();
        
        // Check if this looks like a real employee name
        if (isRealEmployeeName(cellStr)) {
          console.log(`🔍 Potential employee found: "${cellStr}" at [${row}][${col}]`);
          
          // Look for department context nearby
          let department = '';
          let status = '';
          
          // Search for department in surrounding area
          const searchRadius = 3;
          for (let deptRow = Math.max(0, row - searchRadius); deptRow <= Math.min(row + searchRadius, data.length - 1); deptRow++) {
            const deptRowData = data[deptRow] || [];
            for (let deptCol = Math.max(0, col - searchRadius); deptCol <= Math.min(col + searchRadius, deptRowData.length - 1); deptCol++) {
              const deptCell = deptRowData[deptCol];
              if (deptCell) {
                const deptStr = deptCell.toString().toLowerCase().trim();
                if (deptStr.includes('rnd') || deptStr.includes('r&d')) {
                  department = 'RND';
                  status = 'Magang';
                } else if (deptStr.includes('office')) {
                  department = 'OFFICE';
                  status = 'Karyawan';
                }
                if (department) break;
              }
            }
            if (department) break;
          }
          
          // If no department found, try to guess from position or default to Magang
          if (!status) {
            status = 'Magang'; // Default assumption
            console.log(`⚠️ No department found for "${cellStr}", defaulting to Magang`);
          }
          
          employees.push({
            name: cellStr,
            status: status,
            nameRow: row,
            nameCol: col
          });
          
          console.log(`✅ Employee added: "${cellStr}" (${status}) at [${row}][${col}]`);
        }
      }
    }
    
    console.log(`\n📊 TOTAL EMPLOYEES FOUND: ${employees.length}`);
    employees.forEach((emp, idx) => {
      console.log(`  ${idx + 1}. "${emp.name}" (${emp.status}) at [${emp.nameRow}][${emp.nameCol}]`);
    });
    
    if (employees.length === 0) {
      console.log(`❌ No valid employees found in ${sheetName}`);
      return results;
    }
    
    // Step 3: Process attendance for each employee
    console.log('\n=== 📊 PROCESSING ATTENDANCE DATA ===');
    
    for (const employee of employees) {
      console.log(`\n👤 Processing ${employee.name} (${employee.status})`);
      
      // Look for attendance data in rows AFTER the date row
      for (let timeRowOffset = 1; timeRowOffset <= 8; timeRowOffset++) {
        const timeRow = dateRow + timeRowOffset;
        if (timeRow >= data.length) break;
        
        const timeRowData = data[timeRow] || [];
        
        // Check if this row has time data by looking at the employee's column area
        let hasTimeData = false;
        const searchCols = [
          employee.nameCol, // Same column as employee name
          ...dateColumns.slice(0, 15) // First 15 date columns
        ];
        
        for (const col of searchCols) {
          const cell = timeRowData[col];
          if (cell && looksLikeTimeData(cell.toString().trim())) {
            hasTimeData = true;
            break;
          }
        }
        
        if (hasTimeData) {
          console.log(`  📅 Processing attendance from row ${timeRow}`);
          
          // Process each date column
          for (let i = 0; i < Math.min(dateColumns.length, 31); i++) {
            const dateCol = dateColumns[i];
            const dateCell = data[dateRow][dateCol];
            
            if (dateCell) {
              const dayStr = dateCell.toString().trim();
              const day = parseInt(dayStr);
              
              if (day >= 1 && day <= 31) {
                const attendanceCell = timeRowData[dateCol];
                
                if (attendanceCell && attendanceCell.toString().trim()) {
                  const timeStr = attendanceCell.toString().trim();
                  const tanggal = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                  
                  let jamMasuk: string | null = null;
                  let jamPulang: string | null = null;
                  
                  // Parse time data
                  if (timeStr.includes('\n') || timeStr.includes('\r')) {
                    const times = timeStr.split(/[\n\r]+/).map(t => t.trim()).filter(t => t);
                    if (times.length >= 1) jamMasuk = parseTimeFlexible(times[0]);
                    if (times.length >= 2) jamPulang = parseTimeFlexible(times[1]);
                  } else {
                    jamMasuk = parseTimeFlexible(timeStr);
                  }
                  
                  if (jamMasuk || jamPulang) {
                    const terlambat = jamMasuk ? jamMasuk > '10:00:00' : false;
                    const pulang_tercatat = jamPulang ? 
                      (jamPulang >= '15:00:00' && jamPulang <= '17:00:00') : false;
                    
                    results.push({
                      nama: employee.name,
                      status: employee.status,
                      tanggal,
                      jam_masuk: jamMasuk,
                      jam_pulang: jamPulang,
                      terlambat,
                      pulang_tercatat
                    });
                    
                    console.log(`    ✅ ${tanggal}: ${jamMasuk || 'N/A'} - ${jamPulang || 'N/A'}`);
                  }
                }
              }
            }
          }
          
          break; // Found the time row for this employee
        }
      }
    }
    
  } catch (error) {
    console.error(`❌ Error in sheet ${sheetName}:`, error);
  }
  
  console.log(`🎉 Sheet ${sheetName} processed: ${results.length} attendance records`);
  return results;
};

// Much smarter employee name detection
const isRealEmployeeName = (str: string): boolean => {
  const cleanStr = str.trim();
  const lowerStr = cleanStr.toLowerCase();
  
  // Filter out obvious non-names first
  const excludeTerms = [
    'nama', 'name', 'employee', 'karyawan', 'pegawai',
    'departemen', 'department', 'dept', 'bagian',
    'rnd', 'r&d', 'office', 'kantor',
    'absen', 'absensi', 'attendance', 'hadir',
    'ijin', 'izin', 'permission', 'leave',
    'dinas', 'tugas', 'duty', 'work',
    'masuk', 'pulang', 'keluar', 'datang',
    'jam', 'time', 'waktu', 'hour',
    'tanggal', 'date', 'hari', 'day',
    'bulan', 'month', 'tahun', 'year',
    'total', 'jumlah', 'sum', 'count',
    'laporan', 'report', 'rekap', 'summary',
    'periode', 'period',
    'msuk/kluar', 'masuk/keluar'
  ];
  
  // Check if it contains any exclude terms
  for (const term of excludeTerms) {
    if (lowerStr.includes(term)) {
      return false;
    }
  }
  
  // Basic criteria for a real name
  return cleanStr.length >= 2 &&
         cleanStr.length <= 25 &&
         /[a-zA-Z]/.test(cleanStr) && // Must contain letters
         !cleanStr.match(/^\d+$/) && // Not just numbers
         !cleanStr.match(/^\d+:\d+/) && // Not time format
         cleanStr !== '-' &&
         cleanStr !== '' &&
         !cleanStr.match(/^[^a-zA-Z]*$/); // Must have at least one letter
};

const looksLikeTimeData = (str: string): boolean => {
  const cleanStr = str.trim();
  const lowerStr = cleanStr.toLowerCase();
  
  // Skip absence indicators
  if (lowerStr.includes('absen') || lowerStr.includes('ijin') || 
      lowerStr.includes('sakit') || lowerStr.includes('cuti') ||
      cleanStr === '-') {
    return false;
  }
  
  return /\d/.test(cleanStr) && (
    /\d{1,2}[:\.]?\d{0,2}/.test(cleanStr) ||
    /^0\.\d+$/.test(cleanStr) || // Excel decimal time
    /^\d{1,2}$/.test(cleanStr) // Hour only
  );
};

const parseTimeFlexible = (timeStr: string): string | null => {
  if (!timeStr || timeStr.trim() === '') return null;
  
  const cleanStr = timeStr.toString().trim();
  const lowerStr = cleanStr.toLowerCase();
  
  // Skip absence indicators
  if (lowerStr.includes('absen') || lowerStr.includes('ijin') || 
      lowerStr.includes('sakit') || lowerStr.includes('cuti') ||
      cleanStr === '-') {
    return null;
  }
  
  // Excel decimal time (0.354166667 = 8:30)
  const excelMatch = cleanStr.match(/^0\.(\d+)$/);
  if (excelMatch) {
    const decimal = parseFloat(cleanStr);
    const totalMinutes = Math.round(decimal * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    }
  }
  
  // HH:MM format
  const timeMatch = cleanStr.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    }
  }
  
  // Decimal format (8.30 = 08:30)
  const decimalMatch = cleanStr.match(/^(\d{1,2})\.(\d{1,2})$/);
  if (decimalMatch) {
    const hours = parseInt(decimalMatch[1]);
    let minutes = parseInt(decimalMatch[2]);
    if (decimalMatch[2].length === 1) {
      minutes = minutes * 6; // .3 = 18 minutes, .5 = 30 minutes
    }
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    }
  }
  
  // Hour only
  const hourMatch = cleanStr.match(/^\d{1,2}$/);
  if (hourMatch) {
    const hour = parseInt(hourMatch[0]);
    if (hour >= 0 && hour < 24) {
      return `${hour.toString().padStart(2, '0')}:00:00`;
    }
  }
  
  return null;
};
