
export const findAttendanceTable = (data: any[][]): { 
  dateRow: number; 
  jamMasukRow: number; 
  jamPulangRow: number; 
  employeeColumns: number[];
} => {
  let dateRow = -1;
  let jamMasukRow = -1;
  let jamPulangRow = -1;
  const employeeColumns: number[] = [];
  
  console.log('🔍 Looking for attendance table structure...');
  console.log('📊 Sheet has', data.length, 'rows');
  
  // Debug: Show more comprehensive raw data
  console.log('\n=== 📋 RAW DATA SAMPLE ===');
  for (let row = 0; row < Math.min(30, data.length); row++) {
    const rowData = data[row] || [];
    if (rowData.length > 0) {
      const cellsInfo = [];
      for (let col = 0; col < Math.min(20, rowData.length); col++) {
        const cell = rowData[col];
        if (cell && cell.toString().trim()) {
          cellsInfo.push(`[${col}]:"${cell.toString().trim()}"`);
        }
      }
      if (cellsInfo.length > 0) {
        console.log(`Row ${row.toString().padStart(2, '0')}: ${cellsInfo.join(', ')}`);
      }
    }
  }
  
  // Step 1: Find date row by looking for sequential date numbers (1, 2, 3, etc)
  console.log('\n=== 📋 Step 1: Finding date row ===');
  
  for (let row = 0; row < Math.min(data.length, 50); row++) {
    const rowData = data[row] || [];
    let validDates = [];
    let consecutiveDates = 0;
    let maxConsecutive = 0;
    
    console.log(`\nChecking row ${row} for date pattern...`);
    
    for (let col = 0; col < Math.min(50, rowData.length); col++) {
      const cell = rowData[col];
      if (cell && cell.toString().trim()) {
        const cellStr = cell.toString().trim();
        
        // Check if it's a valid date (1-31)
        if (/^\d{1,2}$/.test(cellStr)) {
          const dayNum = parseInt(cellStr);
          if (dayNum >= 1 && dayNum <= 31) {
            validDates.push(dayNum);
            consecutiveDates++;
            maxConsecutive = Math.max(maxConsecutive, consecutiveDates);
          } else {
            consecutiveDates = 0;
          }
        } else {
          consecutiveDates = 0;
        }
      } else {
        consecutiveDates = 0;
      }
    }
    
    console.log(`  Row ${row}: found ${validDates.length} valid dates, max consecutive: ${maxConsecutive}`);
    console.log(`  Sample dates: [${validDates.slice(0, 15).join(', ')}${validDates.length > 15 ? '...' : ''}]`);
    
    // If we found enough consecutive dates, this is our date row
    if (validDates.length >= 10 && maxConsecutive >= 5) {
      dateRow = row;
      console.log(`✅ Date row found at ${row}`);
      break;
    }
  }
  
  if (dateRow === -1) {
    console.log('❌ Could not find date row');
    return { dateRow, jamMasukRow, jamPulangRow, employeeColumns };
  }
  
  // Step 2: Find employee columns by looking in the first few columns for employee cards
  console.log('\n=== 📋 Step 2: Finding employee columns ===');
  
  // Look in first 5 columns for employee information (usually columns 0, 1, 2)
  for (let col = 0; col < Math.min(5, (data[0] || []).length); col++) {
    console.log(`\n--- Checking column ${col} for employee info ---`);
    
    let hasName = false;
    let hasDepartment = false;
    let nameRow = -1;
    let deptRow = -1;
    
    // Look in rows before the date row for employee info
    for (let row = 0; row < Math.min(dateRow, 30); row++) {
      const rowData = data[row] || [];
      const cell = rowData[col];
      
      if (cell && cell.toString().trim()) {
        const cellStr = cell.toString().trim();
        const cellLower = cellStr.toLowerCase();
        const cellUpper = cellStr.toUpperCase();
        
        console.log(`  [${row}][${col}]: "${cellStr}"`);
        
        // Check for department (RND/OFFICE)
        if (cellUpper.includes('RND') || cellUpper.includes('R&D') || cellUpper.includes('OFFICE')) {
          hasDepartment = true;
          deptRow = row;
          console.log(`    ✅ Found department: ${cellStr} at row ${row}`);
        }
        
        // Check for employee name (should be a proper name, not header/label)
        if (!hasName && 
            cellStr.length >= 2 && 
            cellStr.length <= 25 &&
            !cellLower.includes('nama') &&
            !cellLower.includes('name') &&
            !cellLower.includes('employee') &&
            !cellLower.includes('karyawan') &&
            !cellLower.includes('jam') &&
            !cellLower.includes('masuk') &&
            !cellLower.includes('pulang') &&
            !cellLower.includes('tanggal') &&
            !cellLower.includes('date') &&
            !cellLower.includes('hari') &&
            !cellLower.includes('department') &&
            !cellLower.includes('rnd') &&
            !cellLower.includes('office') &&
            !cellLower.includes('absen') &&
            !cellStr.match(/^\d+$/) &&
            !cellStr.match(/\d{1,2}:\d{2}/) &&
            !cellStr.match(/^\d{1,2}$/) &&
            cellStr !== '-' &&
            cellStr !== '' &&
            /[a-zA-Z]/.test(cellStr) &&
            cellStr !== cellUpper &&
            cellStr !== cellLower) {
          
          hasName = true;
          nameRow = row;
          console.log(`    ✅ Found potential name: "${cellStr}" at row ${row}`);
        }
      }
    }
    
    // If we found both name and department in this column, it's an employee column
    if (hasName && hasDepartment) {
      employeeColumns.push(col);
      console.log(`✅ Employee column confirmed at ${col} (name at row ${nameRow}, dept at row ${deptRow})`);
    } else {
      console.log(`❌ Column ${col} rejected - name: ${hasName}, dept: ${hasDepartment}`);
    }
  }
  
  console.log(`\n📊 Found ${employeeColumns.length} employee columns: [${employeeColumns.join(', ')}]`);
  
  // Step 3: Find jam masuk/pulang rows around the date row
  console.log('\n=== 📋 Step 3: Finding jam masuk/pulang rows ===');
  
  // Look for time-related labels in rows around the date row
  for (let searchRow = dateRow + 1; searchRow <= dateRow + 5 && searchRow < data.length; searchRow++) {
    const searchRowData = data[searchRow] || [];
    
    // Check first few columns for time labels
    for (let searchCol = 0; searchCol < Math.min(8, searchRowData.length); searchCol++) {
      const searchCell = searchRowData[searchCol];
      if (searchCell && searchCell.toString().trim()) {
        const searchStr = searchCell.toString().toLowerCase().trim();
        
        console.log(`  Checking [${searchRow}][${searchCol}]: "${searchCell}" for time labels`);
        
        if ((searchStr.includes('masuk') || searchStr.includes('in') || searchStr.includes('datang')) && jamMasukRow === -1) {
          jamMasukRow = searchRow;
          console.log(`✅ Found jam masuk at row ${searchRow} (label: "${searchCell}")`);
        } else if ((searchStr.includes('pulang') || searchStr.includes('out') || searchStr.includes('keluar')) && jamPulangRow === -1) {
          jamPulangRow = searchRow;
          console.log(`✅ Found jam pulang at row ${searchRow} (label: "${searchCell}")`);
        }
      }
    }
  }
  
  // If not found by labels, use default positions relative to date row
  if (jamMasukRow === -1) {
    jamMasukRow = dateRow + 1;
    console.log(`📍 Setting default jam masuk row to ${jamMasukRow} (dateRow + 1)`);
  }
  if (jamPulangRow === -1) {
    jamPulangRow = dateRow + 2;
    console.log(`📍 Setting default jam pulang row to ${jamPulangRow} (dateRow + 2)`);
  }
  
  console.log(`\n🎉 FINAL ATTENDANCE TABLE STRUCTURE:`);
  console.log(`📅 Date row: ${dateRow}`);
  console.log(`⏰ Jam masuk row: ${jamMasukRow}`);
  console.log(`🏃 Jam pulang row: ${jamPulangRow}`);
  console.log(`👥 Employee columns: ${employeeColumns.length} found - [${employeeColumns.join(', ')}]`);
  
  return { dateRow, jamMasukRow, jamPulangRow, employeeColumns };
};
