
export const parseSimpleAttendance = (data: any[][], sheetName: string, selectedMonth: number, selectedYear: number) => {
  console.log(`\n🔍 =============== SIMPLE PARSING SHEET: ${sheetName} ===============`);
  
  const results: any[] = [];
  
  try {
    // Show complete sheet structure first
    console.log(`\n=== 📋 COMPLETE SHEET STRUCTURE ===`);
    for (let row = 0; row < Math.min(20, data.length); row++) {
      const rowData = data[row] || [];
      const cellsDisplay = [];
      for (let col = 0; col < Math.min(35, rowData.length); col++) {
        const cell = rowData[col];
        if (cell && cell.toString().trim()) {
          cellsDisplay.push(`[${col}]:"${cell.toString().trim()}"`);
        }
      }
      if (cellsDisplay.length > 0) {
        console.log(`Row ${row.toString().padStart(2, '0')}: ${cellsDisplay.join(' | ')}`);
      }
    }
    
    // Step 1: Find the row with sequential numbers (dates)
    let dateRow = -1;
    let dateColumns: number[] = [];
    
    console.log('\n=== 🗓️ FINDING DATE ROW ===');
    for (let row = 0; row < Math.min(25, data.length); row++) {
      const rowData = data[row] || [];
      const numbers: number[] = [];
      const numberCols: number[] = [];
      
      // Check each column for numbers 1-31
      for (let col = 0; col < Math.min(40, rowData.length); col++) {
        const cell = rowData[col];
        if (cell) {
          const cellStr = cell.toString().trim();
          // Must be exactly 1 or 2 digits
          if (/^\d{1,2}$/.test(cellStr)) {
            const num = parseInt(cellStr);
            if (num >= 1 && num <= 31) {
              numbers.push(num);
              numberCols.push(col);
            }
          }
        }
      }
      
      console.log(`Row ${row}: found ${numbers.length} valid dates: [${numbers.slice(0, 15).join(', ')}${numbers.length > 15 ? '...' : ''}]`);
      
      // If we find at least 15 valid dates, this is likely our date row
      if (numbers.length >= 15) {
        dateRow = row;
        dateColumns = numberCols;
        console.log(`✅ DATE ROW CONFIRMED at row ${row} with ${numbers.length} dates`);
        break;
      }
    }
    
    if (dateRow === -1) {
      console.log(`❌ No valid date row found in ${sheetName}`);
      return results;
    }
    
    // Step 2: Find employee data - look in specific areas
    console.log('\n=== 👥 FINDING EMPLOYEE DATA ===');
    const employees: Array<{name: string; status: string; row: number; col: number}> = [];
    
    // Look for employees in the first few columns, before the date row
    for (let col = 0; col < Math.min(5, (data[0] || []).length); col++) {
      console.log(`\n--- Analyzing column ${col} ---`);
      
      let employeeName = '';
      let department = '';
      let nameRow = -1;
      
      // Search this column from top to date row
      for (let row = 0; row < dateRow; row++) {
        const rowData = data[row] || [];
        const cell = rowData[col];
        
        if (cell && cell.toString().trim()) {
          const cellStr = cell.toString().trim();
          const cellLower = cellStr.toLowerCase();
          
          console.log(`  [${row}][${col}]: "${cellStr}"`);
          
          // Check for department indicators
          if (cellLower.includes('rnd') || cellLower.includes('r&d')) {
            department = 'RND';
            console.log(`    ✅ Found RND department`);
          } else if (cellLower.includes('office') || cellLower.includes('kantor')) {
            department = 'OFFICE';
            console.log(`    ✅ Found OFFICE department`);
          }
          
          // Check if this could be an employee name
          if (!employeeName && isValidEmployeeName(cellStr)) {
            employeeName = cellStr;
            nameRow = row;
            console.log(`    ✅ Potential employee: "${employeeName}"`);
          }
        }
      }
      
      // If we found both name and department, add employee
      if (employeeName && department) {
        const status = department === 'RND' ? 'Magang' : 'Karyawan';
        employees.push({
          name: employeeName,
          status: status,
          row: nameRow,
          col: col
        });
        console.log(`✅ EMPLOYEE CONFIRMED: "${employeeName}" (${status}) at [${nameRow}][${col}]`);
      } else if (employeeName) {
        // If we found a name but no department, default to Magang
        employees.push({
          name: employeeName,
          status: 'Magang',
          row: nameRow,
          col: col
        });
        console.log(`✅ EMPLOYEE ADDED: "${employeeName}" (Magang - default) at [${nameRow}][${col}]`);
      }
    }
    
    console.log(`\n📊 TOTAL EMPLOYEES FOUND: ${employees.length}`);
    
    if (employees.length === 0) {
      console.log(`❌ No employees found in ${sheetName}`);
      return results;
    }
    
    // Step 3: Extract attendance data for each employee
    console.log('\n=== 📊 EXTRACTING ATTENDANCE DATA ===');
    
    for (const employee of employees) {
      console.log(`\n👤 Processing ${employee.name} (${employee.status})`);
      
      // Look for attendance data in rows after the date row
      for (let timeRowOffset = 1; timeRowOffset <= 10; timeRowOffset++) {
        const timeRow = dateRow + timeRowOffset;
        if (timeRow >= data.length) break;
        
        const timeRowData = data[timeRow] || [];
        
        // Check if this row contains time data in the employee's column area
        let foundTimeData = false;
        const checkColumns = [employee.col, ...dateColumns.slice(0, 10)];
        
        for (const checkCol of checkColumns) {
          const cell = timeRowData[checkCol];
          if (cell && isTimeData(cell.toString().trim())) {
            foundTimeData = true;
            break;
          }
        }
        
        if (foundTimeData) {
          console.log(`  📅 Found time data at row ${timeRow}`);
          
          // Process each date column
          for (let i = 0; i < Math.min(dateColumns.length, 31); i++) {
            const dateCol = dateColumns[i];
            const dateCell = data[dateRow][dateCol];
            
            if (dateCell) {
              const day = parseInt(dateCell.toString().trim());
              
              if (day >= 1 && day <= 31) {
                const attendanceCell = timeRowData[dateCol];
                
                if (attendanceCell) {
                  const timeStr = attendanceCell.toString().trim();
                  
                  if (timeStr && timeStr !== '-' && !timeStr.toLowerCase().includes('absen')) {
                    const tanggal = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    
                    // Parse time data
                    const timeResult = parseTimeData(timeStr);
                    
                    if (timeResult.jamMasuk || timeResult.jamPulang) {
                      const terlambat = timeResult.jamMasuk ? timeResult.jamMasuk > '10:00:00' : false;
                      const pulang_tercatat = timeResult.jamPulang ? 
                        (timeResult.jamPulang >= '15:00:00' && timeResult.jamPulang <= '17:00:00') : false;
                      
                      results.push({
                        nama: employee.name,
                        status: employee.status,
                        tanggal,
                        jam_masuk: timeResult.jamMasuk,
                        jam_pulang: timeResult.jamPulang,
                        terlambat,
                        pulang_tercatat
                      });
                      
                      console.log(`    ✅ ${tanggal}: ${timeResult.jamMasuk || 'N/A'} - ${timeResult.jamPulang || 'N/A'}`);
                    }
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

// Simple employee name validation
const isValidEmployeeName = (str: string): boolean => {
  const cleanStr = str.trim();
  const lowerStr = cleanStr.toLowerCase();
  
  // Must be reasonable length
  if (cleanStr.length < 2 || cleanStr.length > 30) return false;
  
  // Must contain letters
  if (!/[a-zA-Z]/.test(cleanStr)) return false;
  
  // Skip obvious non-names
  const skipWords = [
    'nama', 'name', 'employee', 'karyawan', 'pegawai',
    'dept', 'departemen', 'department', 'bagian',
    'rnd', 'r&d', 'office', 'kantor',
    'absen', 'absensi', 'attendance', 'hadir',
    'jam', 'time', 'waktu', 'masuk', 'pulang',
    'tanggal', 'date', 'hari', 'bulan', 'tahun',
    'total', 'jumlah', 'laporan', 'rekap',
    'periode', 'ijin', 'sakit', 'cuti', 'dinas'
  ];
  
  for (const word of skipWords) {
    if (lowerStr.includes(word)) return false;
  }
  
  // Skip pure numbers or time formats
  if (/^\d+$/.test(cleanStr)) return false;
  if (/^\d{1,2}:\d{2}/.test(cleanStr)) return false;
  if (cleanStr === '-') return false;
  
  return true;
};

// Check if cell contains time data
const isTimeData = (str: string): boolean => {
  const cleanStr = str.trim();
  const lowerStr = cleanStr.toLowerCase();
  
  // Skip absence indicators
  if (lowerStr.includes('absen') || lowerStr.includes('ijin') || 
      lowerStr.includes('sakit') || lowerStr.includes('cuti') ||
      cleanStr === '-') {
    return false;
  }
  
  // Look for time patterns
  return /\d/.test(cleanStr) && (
    /\d{1,2}[:\.]?\d{0,2}/.test(cleanStr) ||
    /^0\.\d+$/.test(cleanStr) || // Excel decimal time
    /^\d{1,2}$/.test(cleanStr) // Hour only
  );
};

// Parse time data from cell
const parseTimeData = (timeStr: string): {jamMasuk: string | null; jamPulang: string | null} => {
  let jamMasuk: string | null = null;
  let jamPulang: string | null = null;
  
  // Split by newlines if multiple times
  const lines = timeStr.split(/[\n\r]+/).map(t => t.trim()).filter(t => t);
  
  if (lines.length >= 2) {
    // Multiple times - assume first is masuk, second is pulang
    jamMasuk = parseSimpleTime(lines[0]);
    jamPulang = parseSimpleTime(lines[1]);
  } else if (lines.length === 1) {
    // Single time - assume it's masuk
    jamMasuk = parseSimpleTime(lines[0]);
  }
  
  return { jamMasuk, jamPulang };
};

// Simple time parser
const parseSimpleTime = (timeStr: string): string | null => {
  if (!timeStr || !timeStr.trim()) return null;
  
  const cleanStr = timeStr.trim();
  const lowerStr = cleanStr.toLowerCase();
  
  // Skip absence indicators
  if (lowerStr.includes('absen') || lowerStr.includes('ijin') || 
      lowerStr.includes('sakit') || lowerStr.includes('cuti') ||
      cleanStr === '-') {
    return null;
  }
  
  // Excel decimal time (0.354166667 = 8:30)
  if (/^0\.\d+$/.test(cleanStr)) {
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
  
  // Hour only
  if (/^\d{1,2}$/.test(cleanStr)) {
    const hour = parseInt(cleanStr);
    if (hour >= 0 && hour < 24) {
      return `${hour.toString().padStart(2, '0')}:00:00`;
    }
  }
  
  return null;
};
