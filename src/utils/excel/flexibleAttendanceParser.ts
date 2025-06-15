
export const parseFlexibleAttendance = (data: any[][], sheetName: string, selectedMonth: number, selectedYear: number) => {
  console.log(`\n🔍 =============== FLEXIBLE PARSING: ${sheetName} ===============`);
  
  const results: any[] = [];
  
  // Step 1: Find all potential employee info by scanning for Department + Name patterns
  const employeeInfo: Array<{name: string; department: string; column: number}> = [];
  
  // Scan first 10 rows for employee patterns
  for (let row = 0; row < Math.min(10, data.length); row++) {
    const rowData = data[row] || [];
    
    for (let col = 0; col < Math.min(20, rowData.length); col++) {
      const cell = rowData[col];
      if (!cell) continue;
      
      const cellStr = cell.toString().trim();
      const cellLower = cellStr.toLowerCase();
      
      // Look for department indicators
      if (cellLower.includes('departemen') || cellLower.includes('dept')) {
        // Check next few cells in same row for department value
        for (let nextCol = col + 1; nextCol < Math.min(col + 5, rowData.length); nextCol++) {
          const nextCell = rowData[nextCol];
          if (nextCell) {
            const nextStr = nextCell.toString().trim().toUpperCase();
            if (nextStr.includes('OFFICE') || nextStr.includes('RND')) {
              console.log(`📍 Found department: ${nextStr} at [${row}][${nextCol}]`);
              
              // Look for name in nearby cells (same row or next row)
              for (let nameRow = row; nameRow <= row + 2 && nameRow < data.length; nameRow++) {
                const nameRowData = data[nameRow] || [];
                for (let nameCol = Math.max(0, col - 2); nameCol < Math.min(col + 10, nameRowData.length); nameCol++) {
                  const nameCell = nameRowData[nameCol];
                  if (nameCell) {
                    const nameStr = nameCell.toString().trim();
                    // Check if this looks like a name
                    if (nameStr.length >= 2 && nameStr.length <= 25 && 
                        !nameStr.toLowerCase().includes('nama') &&
                        !nameStr.toLowerCase().includes('departemen') &&
                        !nameStr.toLowerCase().includes('office') &&
                        !nameStr.toLowerCase().includes('rnd') &&
                        /[a-zA-Z]/.test(nameStr) &&
                        !nameStr.match(/^\d+$/) &&
                        nameStr !== nextStr) {
                      
                      employeeInfo.push({
                        name: nameStr,
                        department: nextStr,
                        column: nameCol
                      });
                      console.log(`✅ Found employee: ${nameStr} (${nextStr}) at column ${nameCol}`);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  console.log(`📊 Found ${employeeInfo.length} employees:`, employeeInfo);
  
  if (employeeInfo.length === 0) {
    console.log(`❌ No employees found in ${sheetName}`);
    return results;
  }
  
  // Step 2: Find date row by looking for sequential numbers 1-31
  let dateRow = -1;
  let dateColumns: number[] = [];
  
  for (let row = 0; row < Math.min(20, data.length); row++) {
    const rowData = data[row] || [];
    const potentialDates: number[] = [];
    const dateColIndexes: number[] = [];
    
    for (let col = 0; col < Math.min(50, rowData.length); col++) {
      const cell = rowData[col];
      if (cell && /^\d{1,2}$/.test(cell.toString().trim())) {
        const num = parseInt(cell.toString().trim());
        if (num >= 1 && num <= 31) {
          potentialDates.push(num);
          dateColIndexes.push(col);
        }
      }
    }
    
    // If we found at least 10 valid dates, this is probably our date row
    if (potentialDates.length >= 10) {
      dateRow = row;
      dateColumns = dateColIndexes;
      console.log(`✅ Found date row ${row} with ${potentialDates.length} dates: [${potentialDates.slice(0, 10).join(', ')}...]`);
      break;
    }
  }
  
  if (dateRow === -1) {
    console.log(`❌ No date row found in ${sheetName}`);
    return results;
  }
  
  // Step 3: For each employee, find their attendance data
  for (const employee of employeeInfo) {
    console.log(`\n👤 Processing ${employee.name} (${employee.department}) at column ${employee.column}`);
    
    // Look for time data in rows after the date row
    for (let timeRow = dateRow + 1; timeRow < Math.min(dateRow + 10, data.length); timeRow++) {
      const timeRowData = data[timeRow] || [];
      
      // Check if this row has time data for our employee column
      for (const dateColIndex of dateColumns) {
        const dateCell = data[dateRow][dateColIndex];
        const timeCell = timeRowData[dateColIndex];
        
        if (dateCell && timeCell) {
          const day = parseInt(dateCell.toString().trim());
          const timeStr = timeCell.toString().trim();
          
          if (day >= 1 && day <= 31 && timeStr) {
            const tanggal = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            
            // Parse time or check for absence
            let jamMasuk: string | null = null;
            let jamPulang: string | null = null;
            
            const timeLower = timeStr.toLowerCase();
            
            if (timeLower.includes('absen') || timeLower.includes('ijin') || 
                timeLower.includes('sakit') || timeLower.includes('cuti') ||
                timeLower === '-') {
              // This is an absence record
              console.log(`📅 ${tanggal}: ${employee.name} - ABSENT (${timeStr})`);
            } else if (timeStr.includes('\n') || timeStr.includes('\r')) {
              // Time data with newlines (masuk/pulang)
              const times = timeStr.split(/[\n\r]+/).map(t => t.trim()).filter(t => t);
              if (times.length >= 1) jamMasuk = parseTimeFlexible(times[0]);
              if (times.length >= 2) jamPulang = parseTimeFlexible(times[1]);
              console.log(`📅 ${tanggal}: ${employee.name} - IN: ${jamMasuk}, OUT: ${jamPulang}`);
            } else {
              // Single time entry
              jamMasuk = parseTimeFlexible(timeStr);
              console.log(`📅 ${tanggal}: ${employee.name} - IN: ${jamMasuk}`);
            }
            
            // Add to results if we have any attendance data
            if (jamMasuk || jamPulang || timeLower.includes('absen')) {
              const status = employee.department.includes('RND') ? 'Magang' : 'Karyawan';
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
            }
          }
        }
      }
    }
  }
  
  console.log(`🎉 Sheet ${sheetName} processed: ${results.length} attendance records`);
  return results;
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
