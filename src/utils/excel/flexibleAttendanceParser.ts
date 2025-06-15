
export const parseFlexibleAttendance = (data: any[][], sheetName: string, selectedMonth: number, selectedYear: number) => {
  console.log(`\n🔍 =============== SUPER FLEXIBLE PARSING: ${sheetName} ===============`);
  
  const results: any[] = [];
  
  try {
    // Show COMPLETE raw data structure
    console.log(`\n=== 📋 COMPLETE SHEET STRUCTURE (First 20 rows) ===`);
    for (let row = 0; row < Math.min(20, data.length); row++) {
      const rowData = data[row] || [];
      console.log(`Row ${row.toString().padStart(2, '0')}:`, rowData.slice(0, 15).map((cell, idx) => `[${idx}]:"${cell || ''}"`).join(' | '));
    }
    
    // Step 1: EXTREMELY flexible date row detection
    let dateRow = -1;
    let dateColumns: number[] = [];
    
    console.log('\n=== 🗓️ SUPER FLEXIBLE DATE ROW SEARCH ===');
    for (let row = 0; row < Math.min(30, data.length); row++) {
      const rowData = data[row] || [];
      const potentialDates: number[] = [];
      const dateColIndexes: number[] = [];
      
      for (let col = 0; col < Math.min(50, rowData.length); col++) {
        const cell = rowData[col];
        if (cell) {
          const cellStr = cell.toString().trim();
          
          // Super flexible date detection - accept numbers 1-31
          if (/^\d{1,2}$/.test(cellStr)) {
            const num = parseInt(cellStr);
            if (num >= 1 && num <= 31) {
              potentialDates.push(num);
              dateColIndexes.push(col);
            }
          }
          // Also try to parse dates like "1/5", "2025/5/1", etc
          else if (/\d+[\/\-\.]\d+/.test(cellStr)) {
            const dayMatch = cellStr.match(/(\d+)[\/\-\.](\d+)[\/\-\.]?(\d+)?/);
            if (dayMatch) {
              const parts = [parseInt(dayMatch[1]), parseInt(dayMatch[2]), parseInt(dayMatch[3] || '0')];
              const possibleDay = parts.find(p => p >= 1 && p <= 31);
              if (possibleDay) {
                potentialDates.push(possibleDay);
                dateColIndexes.push(col);
              }
            }
          }
        }
      }
      
      console.log(`Row ${row}: found ${potentialDates.length} date-like values: [${potentialDates.slice(0, 10).join(', ')}...]`);
      
      // Much more lenient criteria - accept if we found at least 5 dates
      if (potentialDates.length >= 5) {
        dateRow = row;
        dateColumns = dateColIndexes;
        console.log(`✅ DATE ROW FOUND at ${row} with ${dateColumns.length} date columns`);
        break;
      }
    }
    
    if (dateRow === -1) {
      console.log(`❌ No date row found in ${sheetName} - trying alternative method`);
      
      // Alternative: look for any row with many numbers
      for (let row = 0; row < Math.min(15, data.length); row++) {
        const rowData = data[row] || [];
        let numberCount = 0;
        const numberCols = [];
        
        for (let col = 0; col < Math.min(40, rowData.length); col++) {
          const cell = rowData[col];
          if (cell && /^\d+$/.test(cell.toString().trim())) {
            numberCount++;
            numberCols.push(col);
          }
        }
        
        if (numberCount >= 3) {
          dateRow = row;
          dateColumns = numberCols;
          console.log(`✅ FALLBACK: Using row ${row} as date row with ${numberCount} numbers`);
          break;
        }
      }
    }
    
    // Step 2: EXTREMELY flexible employee detection - scan EVERYTHING
    console.log('\n=== 👥 ULTRA-FLEXIBLE EMPLOYEE SEARCH ===');
    const employeeInfo: Array<{name: string; department: string; row: number; column: number}> = [];
    
    // Scan entire sheet for ANY text that could be names or departments
    for (let row = 0; row < Math.min(25, data.length); row++) {
      const rowData = data[row] || [];
      
      for (let col = 0; col < Math.min(25, rowData.length); col++) {
        const cell = rowData[col];
        if (!cell) continue;
        
        const cellStr = cell.toString().trim();
        const cellLower = cellStr.toLowerCase();
        
        console.log(`Examining [${row}][${col}]: "${cellStr}"`);
        
        // Look for department keywords ANYWHERE
        if (cellLower.includes('rnd') || cellLower.includes('r&d') || 
            cellLower.includes('office') || cellLower.includes('magang') ||
            cellLower.includes('karyawan') || cellLower.includes('intern')) {
          
          console.log(`🏢 DEPARTMENT FOUND: "${cellStr}" at [${row}][${col}]`);
          
          // Look for names in a MUCH wider area around this department
          const searchAreas = [
            // Same row - much wider search
            { startRow: row, endRow: row, startCol: Math.max(0, col - 5), endCol: Math.min(col + 8, rowData.length) },
            // Rows above and below - wider search
            { startRow: Math.max(0, row - 3), endRow: Math.min(row + 4, data.length), startCol: Math.max(0, col - 3), endCol: Math.min(col + 4, rowData.length) },
            // Entire column above and below
            { startRow: Math.max(0, row - 5), endRow: Math.min(row + 6, data.length), startCol: col, endCol: col + 1 }
          ];
          
          for (const area of searchAreas) {
            for (let searchRow = area.startRow; searchRow < area.endRow; searchRow++) {
              const searchRowData = data[searchRow] || [];
              for (let searchCol = area.startCol; searchCol < area.endCol; searchCol++) {
                const nameCell = searchRowData[searchCol];
                if (nameCell && nameCell !== cell) {
                  const nameStr = nameCell.toString().trim();
                  
                  // MUCH more permissive name detection
                  if (couldBeEmployeeName(nameStr)) {
                    const dept = determineDepartment(cellStr);
                    employeeInfo.push({
                      name: nameStr,
                      department: dept,
                      row: searchRow,
                      column: searchCol
                    });
                    console.log(`✅ EMPLOYEE FOUND: "${nameStr}" (${dept}) at [${searchRow}][${searchCol}]`);
                  }
                }
              }
            }
          }
        }
        
        // Also look for standalone names that look like they could be employees
        if (couldBeEmployeeName(cellStr) && row < (dateRow === -1 ? 20 : dateRow)) {
          // Look for department context nearby
          let nearbyDept = '';
          
          // Search in much wider radius for department context
          for (let deptRow = Math.max(0, row - 3); deptRow <= Math.min(row + 3, data.length - 1); deptRow++) {
            const deptRowData = data[deptRow] || [];
            for (let deptCol = Math.max(0, col - 5); deptCol <= Math.min(col + 5, deptRowData.length - 1); deptCol++) {
              const deptCell = deptRowData[deptCol];
              if (deptCell) {
                nearbyDept = determineDepartment(deptCell.toString());
                if (nearbyDept) break;
              }
            }
            if (nearbyDept) break;
          }
          
          // If no department found, assume based on position or default
          if (!nearbyDept) {
            nearbyDept = 'UNKNOWN';  // We'll process these anyway
          }
          
          employeeInfo.push({
            name: cellStr,
            department: nearbyDept,
            row: row,
            column: col
          });
          console.log(`✅ STANDALONE EMPLOYEE: "${cellStr}" (${nearbyDept}) at [${row}][${col}]`);
        }
      }
    }
    
    console.log(`\n📊 TOTAL EMPLOYEES FOUND: ${employeeInfo.length}`);
    employeeInfo.forEach((emp, idx) => {
      console.log(`  ${idx + 1}. "${emp.name}" (${emp.department}) at [${emp.row}][${emp.column}]`);
    });
    
    // If we found employees but no date row, try to process anyway
    if (employeeInfo.length > 0 && dateRow === -1) {
      console.log('\n⚠️ Found employees but no date row - trying to process with row scanning');
      
      // For each employee, look for time data in surrounding area
      for (const employee of employeeInfo) {
        console.log(`\n👤 Processing ${employee.name} (${employee.department}) without date row`);
        
        // Look for time patterns in rows around the employee
        for (let timeRow = employee.row + 1; timeRow < Math.min(employee.row + 10, data.length); timeRow++) {
          const timeRowData = data[timeRow] || [];
          
          // Check for time patterns in this row
          for (let timeCol = Math.max(0, employee.column - 5); timeCol < Math.min(employee.column + 15, timeRowData.length); timeCol++) {
            const timeCell = timeRowData[timeCol];
            if (timeCell && looksLikeTimeData(timeCell.toString().trim())) {
              console.log(`  Found potential time data "${timeCell}" at [${timeRow}][${timeCol}]`);
              
              // Try to create a record even without proper date
              const timeStr = timeCell.toString().trim();
              const jamMasuk = parseTimeFlexible(timeStr);
              
              if (jamMasuk) {
                // Create records for first few days of the month as fallback
                for (let day = 1; day <= 3; day++) {
                  const tanggal = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                  const status = employee.department === 'RND' ? 'Magang' : 'Karyawan';
                  
                  results.push({
                    nama: employee.name,
                    status,
                    tanggal,
                    jam_masuk: jamMasuk,
                    jam_pulang: null,
                    terlambat: jamMasuk > '10:00:00',
                    pulang_tercatat: false
                  });
                  
                  console.log(`    ✅ Created fallback record: ${tanggal} - ${jamMasuk}`);
                }
              }
            }
          }
        }
      }
      
      return results;
    }
    
    // Process with date row if we found one
    if (dateRow !== -1 && employeeInfo.length > 0) {
      console.log('\n=== 📊 PROCESSING WITH DATE ROW ===');
      
      for (const employee of employeeInfo) {
        console.log(`\n👤 Processing ${employee.name} (${employee.department})`);
        
        // Look for attendance data in larger area around employee
        const searchCols = [];
        
        // Add wide range of columns around employee
        for (let offset = -5; offset <= 10; offset++) {
          const col = employee.column + offset;
          if (col >= 0) searchCols.push(col);
        }
        
        // Also add all date columns
        dateColumns.forEach(col => {
          if (!searchCols.includes(col)) searchCols.push(col);
        });
        
        console.log(`  Searching ${searchCols.length} columns for attendance data`);
        
        // Look for time data in multiple rows after date row
        for (let timeRowOffset = 1; timeRowOffset <= 8; timeRowOffset++) {
          const timeRow = dateRow + timeRowOffset;
          if (timeRow >= data.length) break;
          
          const timeRowData = data[timeRow] || [];
          
          // Check if this row has time data
          let hasTimeData = false;
          for (const col of searchCols.slice(0, 15)) {
            const cell = timeRowData[col];
            if (cell && looksLikeTimeData(cell.toString().trim())) {
              hasTimeData = true;
              break;
            }
          }
          
          if (hasTimeData) {
            console.log(`  Processing time data from row ${timeRow}`);
            
            // Process all date columns
            for (let i = 0; i < Math.min(dateColumns.length, 31); i++) {
              const dateCol = dateColumns[i];
              const dateCell = data[dateRow][dateCol];
              
              if (dateCell) {
                const dayStr = dateCell.toString().trim();
                let day = parseInt(dayStr);
                
                // Handle date parsing
                if (isNaN(day)) {
                  const dayMatch = dayStr.match(/(\d+)/);
                  if (dayMatch) day = parseInt(dayMatch[1]);
                }
                
                if (day >= 1 && day <= 31) {
                  const attendanceCell = timeRowData[dateCol];
                  
                  if (attendanceCell && attendanceCell.toString().trim()) {
                    const timeStr = attendanceCell.toString().trim();
                    const tanggal = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    
                    let jamMasuk: string | null = null;
                    let jamPulang: string | null = null;
                    
                    if (timeStr.includes('\n') || timeStr.includes('\r')) {
                      const times = timeStr.split(/[\n\r]+/).map(t => t.trim()).filter(t => t);
                      if (times.length >= 1) jamMasuk = parseTimeFlexible(times[0]);
                      if (times.length >= 2) jamPulang = parseTimeFlexible(times[1]);
                    } else {
                      jamMasuk = parseTimeFlexible(timeStr);
                    }
                    
                    if (jamMasuk || jamPulang) {
                      const status = employee.department === 'RND' || employee.department === 'UNKNOWN' ? 'Magang' : 'Karyawan';
                      const terlambat = jamMasuk ? jamMasuk > '10:00:00' : false;
                      const pulang_tercatat = jamPulang ? 
                        (jamPulang >= '15:00:00' && jamPulang <= '17:00:00') : false;
                      
                      results.push({
                        nama: employee.name,
                        status,
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
            break; // Found time row for this employee
          }
        }
      }
    }
    
  } catch (error) {
    console.error(`❌ Error in flexible parsing for sheet ${sheetName}:`, error);
  }
  
  console.log(`🎉 Sheet ${sheetName} processed: ${results.length} attendance records`);
  return results;
};

// Much more permissive employee name detection
const couldBeEmployeeName = (str: string): boolean => {
  const cleanStr = str.trim();
  const lowerStr = cleanStr.toLowerCase();
  
  // Very basic filtering - just avoid obvious non-names
  return cleanStr.length >= 2 &&
         cleanStr.length <= 30 &&
         /[a-zA-Z]/.test(cleanStr) &&
         !lowerStr.includes('tanggal') &&
         !lowerStr.includes('date') &&
         !lowerStr.includes('jam') &&
         !lowerStr.includes('time') &&
         !lowerStr.includes('total') &&
         !lowerStr.includes('summary') &&
         !lowerStr.includes('laporan') &&
         !cleanStr.match(/^\d+$/) &&
         !cleanStr.match(/^\d+:\d+/) &&
         cleanStr !== '-' &&
         cleanStr !== '';
};

const determineDepartment = (str: string): string => {
  const lowerStr = str.toLowerCase();
  if (lowerStr.includes('rnd') || lowerStr.includes('r&d') || lowerStr.includes('magang')) return 'RND';
  if (lowerStr.includes('office') || lowerStr.includes('karyawan')) return 'OFFICE';
  return '';
};

const looksLikeTimeData = (str: string): boolean => {
  const cleanStr = str.trim();
  return /\d/.test(cleanStr) && (
    /\d{1,2}[:\.]?\d{0,2}/.test(cleanStr) ||
    cleanStr.toLowerCase().includes('absen') ||
    cleanStr.toLowerCase().includes('ijin') ||
    cleanStr.toLowerCase().includes('sakit') ||
    cleanStr.toLowerCase().includes('cuti') ||
    /^\d+$/.test(cleanStr)
  );
};

const parseTimeFlexible = (timeStr: string): string | null => {
  if (!timeStr || timeStr.trim() === '') return null;
  
  const cleanStr = timeStr.toString().trim();
  
  // Skip absence indicators
  const lowerStr = cleanStr.toLowerCase();
  if (lowerStr.includes('absen') || lowerStr.includes('ijin') || 
      lowerStr.includes('sakit') || lowerStr.includes('cuti') ||
      lowerStr === '-') {
    return null;
  }
  
  // Try various time formats
  
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
      minutes = minutes * 6;
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
