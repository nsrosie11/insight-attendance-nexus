
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
  
  // Debug: Show raw data structure first
  console.log('\n=== 📋 RAW DATA SAMPLE ===');
  for (let row = 0; row < Math.min(20, data.length); row++) {
    const rowData = data[row] || [];
    const cellsInfo = [];
    for (let col = 0; col < Math.min(15, rowData.length); col++) {
      const cell = rowData[col];
      if (cell && cell.toString().trim()) {
        cellsInfo.push(`[${row}][${col}]:"${cell.toString().trim()}"`);
      }
    }
    if (cellsInfo.length > 0) {
      console.log(`Row ${row}: ${cellsInfo.join(', ')}`);
    }
  }
  
  // Step 1: Find employee columns by looking for name patterns in first few columns
  console.log('\n=== 📋 Step 1: Finding employee columns ===');
  
  // Check first 10 columns for employee information
  for (let col = 0; col < Math.min(10, (data[0] || []).length); col++) {
    console.log(`\n--- Checking column ${col} ---`);
    
    let hasName = false;
    let hasDepartment = false;
    
    // Look in first 20 rows for employee info
    for (let row = 0; row < Math.min(20, data.length); row++) {
      const rowData = data[row] || [];
      const cell = rowData[col];
      
      if (cell && cell.toString().trim()) {
        const cellStr = cell.toString().trim();
        const cellLower = cellStr.toLowerCase();
        const cellUpper = cellStr.toUpperCase();
        
        console.log(`  [${row}][${col}]: "${cellStr}"`);
        
        // Check for department
        if (cellUpper.includes('RND') || cellUpper.includes('R&D') || cellUpper.includes('OFFICE')) {
          hasDepartment = true;
          console.log(`    ✅ Found department: ${cellStr}`);
        }
        
        // Check for name (should be a proper name, not header)
        if (!hasName && 
            cellStr.length >= 2 && 
            cellStr.length <= 20 &&
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
            !cellStr.match(/^\d+$/) &&
            !cellStr.match(/\d{1,2}:\d{2}/) &&
            !cellStr.match(/^\d{1,2}$/) &&
            cellStr !== '-' &&
            /[a-zA-Z]/.test(cellStr) &&
            cellStr !== cellUpper) {
          
          hasName = true;
          console.log(`    ✅ Found potential name: ${cellStr}`);
        }
      }
    }
    
    if (hasName && hasDepartment) {
      employeeColumns.push(col);
      console.log(`✅ Employee column confirmed at ${col}`);
    } else {
      console.log(`❌ Column ${col} rejected - name: ${hasName}, dept: ${hasDepartment}`);
    }
  }
  
  console.log(`\n📊 Found ${employeeColumns.length} employee columns: [${employeeColumns.join(', ')}]`);
  
  // Step 2: Find date row by looking for sequential numbers
  console.log('\n=== 📋 Step 2: Finding date row ===');
  
  for (let row = 15; row < Math.min(data.length, 40); row++) {
    const rowData = data[row] || [];
    let consecutiveDates = 0;
    let maxConsecutive = 0;
    let validDates = [];
    
    console.log(`\nChecking row ${row} for dates...`);
    
    for (let col = 0; col < Math.min(50, rowData.length); col++) {
      const cell = rowData[col];
      if (cell && cell.toString().trim()) {
        const cellStr = cell.toString().trim();
        
        // Check if it's a valid date (1-31)
        if (/^\d{1,2}$/.test(cellStr)) {
          const dayNum = parseInt(cellStr);
          if (dayNum >= 1 && dayNum <= 31) {
            consecutiveDates++;
            validDates.push(dayNum);
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
    console.log(`  Sample dates: [${validDates.slice(0, 10).join(', ')}${validDates.length > 10 ? '...' : ''}]`);
    
    // If we found enough dates, this is our date row
    if (validDates.length >= 8 && maxConsecutive >= 5) {
      dateRow = row;
      console.log(`✅ Date row found at ${row}`);
      break;
    }
  }
  
  // Step 3: Find jam masuk/pulang rows
  if (dateRow !== -1) {
    console.log('\n=== 📋 Step 3: Finding jam masuk/pulang rows ===');
    
    // Look around the date row for time-related labels
    for (let searchRow = dateRow - 3; searchRow <= dateRow + 5; searchRow++) {
      if (searchRow < 0 || searchRow >= data.length || searchRow === dateRow) continue;
      
      const searchRowData = data[searchRow] || [];
      
      // Check first few columns for labels
      for (let searchCol = 0; searchCol < Math.min(10, searchRowData.length); searchCol++) {
        const searchCell = searchRowData[searchCol];
        if (searchCell && searchCell.toString().trim()) {
          const searchStr = searchCell.toString().toLowerCase().trim();
          
          if ((searchStr.includes('masuk') || searchStr.includes('in')) && jamMasukRow === -1) {
            jamMasukRow = searchRow;
            console.log(`✅ Found jam masuk at row ${searchRow} (label: "${searchCell}")`);
          } else if ((searchStr.includes('pulang') || searchStr.includes('out')) && jamPulangRow === -1) {
            jamPulangRow = searchRow;
            console.log(`✅ Found jam pulang at row ${searchRow} (label: "${searchCell}")`);
          }
        }
      }
    }
    
    // If not found by labels, use default positions
    if (jamMasukRow === -1) {
      jamMasukRow = dateRow + 1;
      console.log(`📍 Setting default jam masuk row to ${jamMasukRow}`);
    }
    if (jamPulangRow === -1) {
      jamPulangRow = dateRow + 2;
      console.log(`📍 Setting default jam pulang row to ${jamPulangRow}`);
    }
  }
  
  console.log(`\n🎉 FINAL RESULT:`);
  console.log(`📅 Date row: ${dateRow}`);
  console.log(`⏰ Jam masuk row: ${jamMasukRow}`);
  console.log(`🏃 Jam pulang row: ${jamPulangRow}`);
  console.log(`👥 Employee columns: ${employeeColumns.length} found - [${employeeColumns.join(', ')}]`);
  
  return { dateRow, jamMasukRow, jamPulangRow, employeeColumns };
};
