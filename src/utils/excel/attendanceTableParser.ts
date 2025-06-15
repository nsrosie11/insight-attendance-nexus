
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
  
  // First, find employee columns by looking for employee cards (names + departments)
  console.log('\n=== 📋 Step 1: Finding employee columns ===');
  for (let col = 0; col < 50; col++) { // Check first 50 columns
    let hasName = false;
    let hasDepartment = false;
    
    // Look for name and department pattern in first 20 rows
    for (let row = 0; row < Math.min(data.length, 20); row++) {
      const rowData = data[row] || [];
      const cell = rowData[col];
      
      if (cell && cell.toString().trim()) {
        const cellStr = cell.toString().trim().toLowerCase();
        
        // Check if this looks like a person's name
        if (cellStr.length >= 3 && cellStr.length <= 20 && 
            !cellStr.match(/^\d+$/) && 
            !cellStr.includes('jam') && 
            !cellStr.includes('tanggal') && 
            !cellStr.includes('hari') &&
            !cellStr.match(/\d{1,2}:\d{2}/)) {
          hasName = true;
        }
        
        // Check if this looks like a department
        const cellUpper = cellStr.toUpperCase();
        if (cellUpper.includes('RND') || cellUpper.includes('OFFICE') || cellUpper.includes('R&D')) {
          hasDepartment = true;
        }
      }
    }
    
    // If we found both name and department in this column, it's an employee column
    if (hasName && hasDepartment) {
      employeeColumns.push(col);
      console.log(`✅ Found employee column at ${col}`);
    }
  }
  
  console.log(`Found ${employeeColumns.length} employee columns:`, employeeColumns);
  
  // Now look for the attendance table (dates row)
  console.log('\n=== 📋 Step 2: Finding date row ===');
  for (let row = 15; row < Math.min(data.length, 40); row++) { // Start from row 15 (after employee cards)
    const rowData = data[row] || [];
    let dateCount = 0;
    
    // Check if this row contains multiple dates
    for (let col = 0; col < Math.min(rowData.length, 50); col++) {
      const cell = rowData[col];
      if (cell && cell.toString().trim()) {
        const cellStr = cell.toString().trim();
        
        // Look for date patterns (1-31)
        if (/^\d{1,2}$/.test(cellStr)) {
          const dayNum = parseInt(cellStr);
          if (dayNum >= 1 && dayNum <= 31) {
            dateCount++;
          }
        }
      }
    }
    
    // If we found multiple dates (at least 5), this is likely our date row
    if (dateCount >= 5) {
      dateRow = row;
      console.log(`✅ Found date row at ${row} with ${dateCount} dates`);
      break;
    }
  }
  
  // Look for jam masuk and jam pulang rows around the date row
  if (dateRow !== -1) {
    console.log('\n=== 📋 Step 3: Finding jam masuk/pulang rows ===');
    
    // Look in rows around the date row for time indicators
    for (let searchRow = dateRow - 5; searchRow <= dateRow + 10; searchRow++) {
      if (searchRow < 0 || searchRow >= data.length) continue;
      
      const searchRowData = data[searchRow] || [];
      for (let searchCol = 0; searchCol < Math.min(searchRowData.length, 10); searchCol++) {
        const searchCell = searchRowData[searchCol];
        if (searchCell && searchCell.toString().trim()) {
          const searchStr = searchCell.toString().toLowerCase().trim();
          
          if ((searchStr.includes('jam') && searchStr.includes('masuk')) || 
              searchStr === 'masuk') {
            jamMasukRow = searchRow;
            console.log(`✅ Found jam masuk row at ${searchRow}`);
          } else if ((searchStr.includes('jam') && searchStr.includes('pulang')) || 
                     searchStr === 'pulang') {
            jamPulangRow = searchRow;
            console.log(`✅ Found jam pulang row at ${searchRow}`);
          }
        }
      }
    }
    
    // If we didn't find specific jam masuk/pulang rows, use reasonable defaults
    if (jamMasukRow === -1) {
      jamMasukRow = dateRow + 1;
      console.log(`📍 Using row ${jamMasukRow} as jam masuk row (default)`);
    }
    if (jamPulangRow === -1) {
      jamPulangRow = dateRow + 2;
      console.log(`📍 Using row ${jamPulangRow} as jam pulang row (default)`);
    }
  }
  
  console.log(`\n🎉 FINAL ATTENDANCE TABLE STRUCTURE:`);
  console.log(`📅 Date row: ${dateRow}`);
  console.log(`⏰ Jam masuk row: ${jamMasukRow}`);
  console.log(`🏃 Jam pulang row: ${jamPulangRow}`);
  console.log(`👥 Employee columns: ${employeeColumns.length} found`);
  
  return { dateRow, jamMasukRow, jamPulangRow, employeeColumns };
};
