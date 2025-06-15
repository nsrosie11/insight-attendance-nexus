
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
  
  // Step 1: Find employee columns by scanning for name + department patterns
  console.log('\n=== 📋 Step 1: Finding employee columns ===');
  
  // Check columns A-Z (0-25) for employee cards
  for (let col = 0; col < 26; col++) {
    let hasValidName = false;
    let hasDepartment = false;
    let nameRowFound = -1;
    let deptRowFound = -1;
    
    // Look in first 15 rows for employee card pattern
    for (let row = 0; row < Math.min(data.length, 15); row++) {
      const rowData = data[row] || [];
      const cell = rowData[col];
      
      if (cell && cell.toString().trim()) {
        const cellStr = cell.toString().trim();
        const cellLower = cellStr.toLowerCase();
        const cellUpper = cellStr.toUpperCase();
        
        // Check for department indicators
        if (cellUpper.includes('RND') || cellUpper.includes('R&D') || cellUpper.includes('OFFICE')) {
          hasDepartment = true;
          deptRowFound = row;
          console.log(`  🏢 Found department "${cellStr}" at [${row}][${col}]`);
        }
        
        // Check for valid employee name
        if (!hasValidName && 
            cellStr.length >= 3 && 
            cellStr.length <= 25 &&
            !cellLower.includes('nama') &&
            !cellLower.includes('employee') &&
            !cellLower.includes('karyawan') &&
            !cellLower.includes('jam') &&
            !cellLower.includes('masuk') &&
            !cellLower.includes('pulang') &&
            !cellLower.includes('tanggal') &&
            !cellLower.includes('department') &&
            !cellLower.includes('rnd') &&
            !cellLower.includes('office') &&
            !cellStr.match(/^\d+$/) &&
            !cellStr.match(/\d{1,2}:\d{2}/) &&
            !cellStr.match(/^\d{1,2}$/) &&
            cellStr !== '-' &&
            /[a-zA-Z]/.test(cellStr) &&
            cellStr !== cellUpper) {
          
          hasValidName = true;
          nameRowFound = row;
          console.log(`  👤 Found potential name "${cellStr}" at [${row}][${col}]`);
        }
      }
    }
    
    // If we found both name and department in this column, it's an employee column
    if (hasValidName && hasDepartment) {
      employeeColumns.push(col);
      console.log(`✅ Employee column confirmed at ${col} (name row: ${nameRowFound}, dept row: ${deptRowFound})`);
    }
  }
  
  console.log(`Found ${employeeColumns.length} employee columns:`, employeeColumns);
  
  // Step 2: Find date row (should be after employee cards, around row 15-30)
  console.log('\n=== 📋 Step 2: Finding date row ===');
  
  for (let row = 10; row < Math.min(data.length, 35); row++) {
    const rowData = data[row] || [];
    let dateCount = 0;
    let validDates = [];
    
    // Check first 50 columns for date pattern
    for (let col = 0; col < Math.min(rowData.length, 50); col++) {
      const cell = rowData[col];
      if (cell && cell.toString().trim()) {
        const cellStr = cell.toString().trim();
        
        // Look for dates (numbers 1-31)
        if (/^\d{1,2}$/.test(cellStr)) {
          const dayNum = parseInt(cellStr);
          if (dayNum >= 1 && dayNum <= 31) {
            dateCount++;
            validDates.push(dayNum);
          }
        }
      }
    }
    
    // If we found at least 10 valid dates in sequence, this is likely our date row
    if (dateCount >= 10) {
      dateRow = row;
      console.log(`✅ Found date row at ${row} with ${dateCount} dates: [${validDates.slice(0, 10).join(', ')}...]`);
      break;
    }
  }
  
  // Step 3: Find jam masuk and jam pulang rows (should be right after date row)
  if (dateRow !== -1) {
    console.log('\n=== 📋 Step 3: Finding jam masuk/pulang rows ===');
    
    // Look for jam masuk row (usually right after date row)
    jamMasukRow = dateRow + 1;
    console.log(`📍 Setting jam masuk row to ${jamMasukRow} (date row + 1)`);
    
    // Look for jam pulang row (usually after jam masuk)
    jamPulangRow = dateRow + 2;
    console.log(`📍 Setting jam pulang row to ${jamPulangRow} (date row + 2)`);
    
    // Try to find actual labels to confirm
    for (let searchRow = dateRow - 2; searchRow <= dateRow + 5; searchRow++) {
      if (searchRow < 0 || searchRow >= data.length) continue;
      
      const searchRowData = data[searchRow] || [];
      for (let searchCol = 0; searchCol < Math.min(searchRowData.length, 10); searchCol++) {
        const searchCell = searchRowData[searchCol];
        if (searchCell && searchCell.toString().trim()) {
          const searchStr = searchCell.toString().toLowerCase().trim();
          
          if (searchStr.includes('masuk') || searchStr.includes('in')) {
            jamMasukRow = searchRow;
            console.log(`✅ Found jam masuk label at row ${searchRow}, updating jam masuk row`);
          } else if (searchStr.includes('pulang') || searchStr.includes('out')) {
            jamPulangRow = searchRow;
            console.log(`✅ Found jam pulang label at row ${searchRow}, updating jam pulang row`);
          }
        }
      }
    }
  }
  
  console.log(`\n🎉 FINAL ATTENDANCE TABLE STRUCTURE:`);
  console.log(`📅 Date row: ${dateRow}`);
  console.log(`⏰ Jam masuk row: ${jamMasukRow}`);
  console.log(`🏃 Jam pulang row: ${jamPulangRow}`);
  console.log(`👥 Employee columns: ${employeeColumns.length} found - [${employeeColumns.join(', ')}]`);
  
  return { dateRow, jamMasukRow, jamPulangRow, employeeColumns };
};
