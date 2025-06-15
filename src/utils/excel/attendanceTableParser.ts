
export const findAttendanceTable = (data: any[][]): { 
  dateRow: number; 
  jamMasukRow: number; 
  jamPulangRow: number; 
  dateColumns: Array<{ col: number; day: number }> 
} => {
  let dateRow = -1;
  let jamMasukRow = -1;
  let jamPulangRow = -1;
  const dateColumns: Array<{ col: number; day: number }> = [];
  
  console.log('🔍 Looking for attendance table structure...');
  console.log('📊 Sheet has', data.length, 'rows');
  
  // Look for date row first - scan more broadly for date patterns
  for (let row = 0; row < Math.min(data.length, 25); row++) {
    const rowData = data[row] || [];
    console.log(`\n=== 📋 Scanning row ${row} for dates ===`);
    
    let datesFoundInRow = 0;
    const tempDateColumns: Array<{ col: number; day: number }> = [];
    
    // Scan all columns in this row for date patterns
    for (let col = 0; col < Math.min(rowData.length, 35); col++) {
      const cell = rowData[col];
      if (cell !== null && cell !== undefined && cell !== '') {
        const cellStr = cell.toString().trim();
        
        // Look for day patterns (1, 2, 3, ... 31) or (01, 02, 03)
        let day = null;
        
        // Pattern 1: Just numbers "1", "2", "01", "02", etc
        if (/^\d{1,2}$/.test(cellStr)) {
          const dayNum = parseInt(cellStr);
          if (dayNum >= 1 && dayNum <= 31) {
            day = dayNum;
          }
        }
        
        if (day !== null) {
          tempDateColumns.push({ col, day });
          datesFoundInRow++;
          console.log(`✅ Found date ${day} at [${row}][${col}]`);
        }
      }
    }
    
    // If we found multiple dates in this row, it's likely our date row
    if (datesFoundInRow >= 3) {
      console.log(`✅ Row ${row} contains ${datesFoundInRow} dates - this is our date row!`);
      dateRow = row;
      dateColumns.push(...tempDateColumns);
      
      // Look for jam masuk and jam pulang rows around this date row
      for (let searchRow = row - 5; searchRow <= row + 10; searchRow++) {
        if (searchRow < 0 || searchRow >= data.length) continue;
        
        const searchRowData = data[searchRow] || [];
        for (let searchCol = 0; searchCol < Math.min(searchRowData.length, 10); searchCol++) {
          const searchCell = searchRowData[searchCol];
          if (searchCell && searchCell.toString().trim()) {
            const searchStr = searchCell.toString().toLowerCase().trim();
            
            if ((searchStr.includes('jam') && searchStr.includes('masuk')) || 
                searchStr.includes('masuk')) {
              jamMasukRow = searchRow;
              console.log(`✅ Found jam masuk row at ${searchRow}`);
            } else if ((searchStr.includes('jam') && searchStr.includes('pulang')) || 
                       searchStr.includes('pulang')) {
              jamPulangRow = searchRow;
              console.log(`✅ Found jam pulang row at ${searchRow}`);
            }
          }
        }
      }
      
      break; // Found our date row, stop searching
    }
  }
  
  // If we didn't find jam masuk/pulang rows, use the date row itself
  if (dateRow !== -1 && jamMasukRow === -1) {
    jamMasukRow = dateRow + 1; // Assume next row has jam masuk
    console.log(`📍 Using row ${jamMasukRow} as jam masuk row (fallback)`);
  }
  if (dateRow !== -1 && jamPulangRow === -1) {
    jamPulangRow = dateRow + 2; // Assume row after that has jam pulang
    console.log(`📍 Using row ${jamPulangRow} as jam pulang row (fallback)`);
  }
  
  console.log(`\n🎉 FINAL RESULT:`);
  console.log(`📅 Date row: ${dateRow}`);
  console.log(`⏰ Jam masuk row: ${jamMasukRow}`);
  console.log(`🏃 Jam pulang row: ${jamPulangRow}`);
  console.log(`📊 Total date entries found: ${dateColumns.length}`);
  console.log(`📋 Date entries (first 10):`, dateColumns.slice(0, 10));
  
  return { dateRow, jamMasukRow, jamPulangRow, dateColumns };
};
