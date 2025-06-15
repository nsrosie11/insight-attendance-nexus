
export const parseFlexibleAttendance = (data: any[][], sheetName: string, selectedMonth: number, selectedYear: number) => {
  console.log(`\n🔍 =============== FLEXIBLE PARSING: ${sheetName} ===============`);
  
  const results: any[] = [];
  
  try {
    // Show more detailed data structure first
    console.log(`\n=== 📋 DETAILED SHEET STRUCTURE ===`);
    for (let row = 0; row < Math.min(15, data.length); row++) {
      const rowData = data[row] || [];
      console.log(`Row ${row.toString().padStart(2, '0')}:`, rowData.slice(0, 10).map((cell, idx) => `[${idx}]:"${cell || ''}"`).join(', '));
    }
    
    // Step 1: Find date row first (this is crucial)
    let dateRow = -1;
    let dateColumns: number[] = [];
    
    console.log('\n=== 🗓️ FINDING DATE ROW ===');
    for (let row = 0; row < Math.min(25, data.length); row++) {
      const rowData = data[row] || [];
      const potentialDates: number[] = [];
      const dateColIndexes: number[] = [];
      
      for (let col = 0; col < Math.min(40, rowData.length); col++) {
        const cell = rowData[col];
        if (cell && /^\d{1,2}$/.test(cell.toString().trim())) {
          const num = parseInt(cell.toString().trim());
          if (num >= 1 && num <= 31) {
            potentialDates.push(num);
            dateColIndexes.push(col);
          }
        }
      }
      
      console.log(`Row ${row}: found ${potentialDates.length} valid dates: [${potentialDates.slice(0, 10).join(', ')}...]`);
      
      // If we found at least 10 dates in sequence, this is probably our date row
      if (potentialDates.length >= 10) {
        dateRow = row;
        dateColumns = dateColIndexes;
        console.log(`✅ Date row confirmed at ${row} with columns:`, dateColIndexes.slice(0, 10));
        break;
      }
    }
    
    if (dateRow === -1) {
      console.log(`❌ No date row found in ${sheetName}`);
      return results;
    }
    
    // Step 2: Look for employees more broadly - scan entire sheet for name patterns
    console.log('\n=== 👥 FINDING EMPLOYEES ===');
    const employeeInfo: Array<{name: string; department: string; row: number; column: number}> = [];
    
    // Scan the entire sheet for potential employee names and departments
    for (let row = 0; row < Math.min(30, data.length); row++) {
      const rowData = data[row] || [];
      
      for (let col = 0; col < Math.min(20, rowData.length); col++) {
        const cell = rowData[col];
        if (!cell) continue;
        
        const cellStr = cell.toString().trim();
        const cellLower = cellStr.toLowerCase();
        
        // Look for department patterns first
        if (cellLower.includes('rnd') || cellLower.includes('r&d') || cellLower.includes('office')) {
          console.log(`🏢 Found department "${cellStr}" at [${row}][${col}]`);
          
          // Look for names in nearby cells (same row, adjacent rows, same column)
          const searchAreas = [
            // Same row - left and right
            { startRow: row, endRow: row, startCol: Math.max(0, col - 3), endCol: Math.min(col + 5, rowData.length) },
            // Above and below rows
            { startRow: Math.max(0, row - 2), endRow: Math.min(row + 3, data.length), startCol: col, endCol: col + 1 },
            // Adjacent columns in nearby rows
            { startRow: Math.max(0, row - 1), endRow: Math.min(row + 2, data.length), startCol: Math.max(0, col - 2), endCol: Math.min(col + 3, rowData.length) }
          ];
          
          for (const area of searchAreas) {
            for (let searchRow = area.startRow; searchRow < area.endRow; searchRow++) {
              const searchRowData = data[searchRow] || [];
              for (let searchCol = area.startCol; searchCol < area.endCol; searchCol++) {
                const nameCell = searchRowData[searchCol];
                if (nameCell && nameCell !== cell) {
                  const nameStr = nameCell.toString().trim();
                  if (isValidEmployeeName(nameStr, cellStr)) {
                    const dept = cellStr.toUpperCase().includes('RND') ? 'RND' : 'OFFICE';
                    employeeInfo.push({
                      name: nameStr,
                      department: dept,
                      row: searchRow,
                      column: searchCol
                    });
                    console.log(`✅ Found employee: "${nameStr}" (${dept}) at [${searchRow}][${searchCol}]`);
                  }
                }
              }
            }
          }
        }
        
        // Also try to find standalone names that look like employees
        if (isLikelyEmployeeName(cellStr) && row < dateRow) {
          // Look for department info nearby
          let foundDept = '';
          for (let deptRow = Math.max(0, row - 2); deptRow <= Math.min(row + 2, data.length - 1); deptRow++) {
            const deptRowData = data[deptRow] || [];
            for (let deptCol = Math.max(0, col - 3); deptCol <= Math.min(col + 3, deptRowData.length - 1); deptCol++) {
              const deptCell = deptRowData[deptCol];
              if (deptCell) {
                const deptStr = deptCell.toString().toLowerCase();
                if (deptStr.includes('rnd') || deptStr.includes('r&d')) {
                  foundDept = 'RND';
                  break;
                } else if (deptStr.includes('office')) {
                  foundDept = 'OFFICE';
                  break;
                }
              }
            }
            if (foundDept) break;
          }
          
          if (foundDept) {
            employeeInfo.push({
              name: cellStr,
              department: foundDept,
              row: row,
              column: col
            });
            console.log(`✅ Found standalone employee: "${cellStr}" (${foundDept}) at [${row}][${col}]`);
          }
        }
      }
    }
    
    console.log(`📊 Total employees found: ${employeeInfo.length}`);
    employeeInfo.forEach((emp, idx) => {
      console.log(`  ${idx + 1}. ${emp.name} (${emp.department}) at [${emp.row}][${emp.column}]`);
    });
    
    if (employeeInfo.length === 0) {
      console.log(`❌ No employees found in ${sheetName}`);
      return results;
    }
    
    // Step 3: For each employee, find their attendance data
    console.log('\n=== 📊 PROCESSING ATTENDANCE DATA ===');
    
    for (const employee of employeeInfo) {
      console.log(`\n👤 Processing ${employee.name} (${employee.department})`);
      
      // Look for attendance data in rows after the date row
      // Check columns around the employee's position
      const searchCols = [];
      
      // Add employee's column and nearby columns
      for (let offset = -2; offset <= 3; offset++) {
        const col = employee.column + offset;
        if (col >= 0) searchCols.push(col);
      }
      
      // Also check columns that align with dates
      dateColumns.slice(0, 15).forEach(col => {
        if (!searchCols.includes(col)) searchCols.push(col);
      });
      
      console.log(`  Searching columns: [${searchCols.slice(0, 10).join(', ')}...]`);
      
      // Look in rows after date row for time data
      for (let timeRowOffset = 1; timeRowOffset <= 10; timeRowOffset++) {
        const timeRow = dateRow + timeRowOffset;
        if (timeRow >= data.length) break;
        
        const timeRowData = data[timeRow] || [];
        
        // Check if this row has any time-like data
        let hasTimeData = false;
        for (const col of searchCols.slice(0, 10)) {
          const cell = timeRowData[col];
          if (cell && cell.toString().trim() && looksLikeTimeData(cell.toString().trim())) {
            hasTimeData = true;
            break;
          }
        }
        
        if (hasTimeData) {
          console.log(`  Found time data in row ${timeRow}`);
          
          // Process dates for this employee
          for (let i = 0; i < Math.min(dateColumns.length, 31); i++) {
            const dateCol = dateColumns[i];
            const dateCell = data[dateRow][dateCol];
            
            if (dateCell) {
              const day = parseInt(dateCell.toString().trim());
              if (day >= 1 && day <= 31) {
                const attendanceCell = timeRowData[dateCol];
                
                if (attendanceCell && attendanceCell.toString().trim()) {
                  const timeStr = attendanceCell.toString().trim();
                  const tanggal = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                  
                  // Parse attendance data
                  let jamMasuk: string | null = null;
                  let jamPulang: string | null = null;
                  
                  if (timeStr.includes('\n') || timeStr.includes('\r')) {
                    // Multi-line time data
                    const times = timeStr.split(/[\n\r]+/).map(t => t.trim()).filter(t => t);
                    if (times.length >= 1) jamMasuk = parseTimeFlexible(times[0]);
                    if (times.length >= 2) jamPulang = parseTimeFlexible(times[1]);
                  } else {
                    // Single time entry
                    jamMasuk = parseTimeFlexible(timeStr);
                  }
                  
                  if (jamMasuk || jamPulang) {
                    const status = employee.department === 'RND' ? 'Magang' : 'Karyawan';
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
          break; // Found time row for this employee, move to next employee
        }
      }
    }
    
  } catch (error) {
    console.error(`❌ Error in flexible parsing for sheet ${sheetName}:`, error);
  }
  
  console.log(`🎉 Sheet ${sheetName} processed: ${results.length} attendance records`);
  return results;
};

const isValidEmployeeName = (nameStr: string, deptStr: string): boolean => {
  const name = nameStr.toLowerCase().trim();
  const dept = deptStr.toLowerCase();
  
  return nameStr.length >= 2 && 
         nameStr.length <= 30 &&
         !name.includes('nama') &&
         !name.includes('name') &&
         !name.includes('departemen') &&
         !name.includes('department') &&
         !name.includes('office') &&
         !name.includes('rnd') &&
         !name.includes('r&d') &&
         !name.includes('jam') &&
         !name.includes('masuk') &&
         !name.includes('pulang') &&
         !name.includes('tanggal') &&
         !name.includes('date') &&
         !name.includes('absen') &&
         !name.includes('hadir') &&
         /[a-zA-Z]/.test(nameStr) &&
         !nameStr.match(/^\d+$/) &&
         nameStr !== deptStr &&
         nameStr !== '-' &&
         nameStr !== '';
};

const isLikelyEmployeeName = (str: string): boolean => {
  const cleanStr = str.trim();
  const lowerStr = cleanStr.toLowerCase();
  
  return cleanStr.length >= 2 &&
         cleanStr.length <= 25 &&
         /^[a-zA-Z\s]+$/.test(cleanStr) &&
         !lowerStr.includes('nama') &&
         !lowerStr.includes('department') &&
         !lowerStr.includes('jam') &&
         !lowerStr.includes('tanggal') &&
         !lowerStr.includes('office') &&
         !lowerStr.includes('rnd') &&
         !lowerStr.includes('absen') &&
         cleanStr !== cleanStr.toUpperCase() &&
         cleanStr !== cleanStr.toLowerCase();
};

const looksLikeTimeData = (str: string): boolean => {
  const cleanStr = str.trim();
  return /\d{1,2}[:\.]?\d{0,2}/.test(cleanStr) ||
         cleanStr.toLowerCase().includes('absen') ||
         cleanStr.toLowerCase().includes('ijin') ||
         cleanStr.toLowerCase().includes('sakit') ||
         cleanStr.toLowerCase().includes('cuti');
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
  
  // Try HH:MM format
  const timeMatch = cleanStr.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    }
  }
  
  // Try decimal format (8.30 = 08:30)
  const decimalMatch = cleanStr.match(/^(\d{1,2})\.(\d{1,2})$/);
  if (decimalMatch) {
    const hours = parseInt(decimalMatch[1]);
    let minutes = parseInt(decimalMatch[2]);
    if (decimalMatch[2].length === 1) {
      minutes = minutes * 6; // .5 = 30 minutes
    }
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    }
  }
  
  // Try hour only
  const hourMatch = cleanStr.match(/^\d{1,2}$/);
  if (hourMatch) {
    const hour = parseInt(hourMatch[0]);
    if (hour >= 0 && hour < 24) {
      return `${hour.toString().padStart(2, '0')}:00:00`;
    }
  }
  
  return null;
};
