
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
  
  // First, find the "Tgl/Hari" header or similar patterns
  let dateHeaderRow = -1;
  let dateHeaderCol = -1;
  
  for (let row = 0; row < Math.min(data.length, 20); row++) {
    for (let col = 0; col < Math.min((data[row] || []).length, 50); col++) {
      const cell = data[row] && data[row][col];
      if (cell) {
        const cellStr = cell.toString().toLowerCase().trim();
        
        // Look for various date header patterns
        if ((cellStr.includes('tgl') && cellStr.includes('hari')) ||
            cellStr.includes('tanggal') ||
            (cellStr.includes('tgl') && cellStr.length < 10)) {
          dateHeaderRow = row;
          dateHeaderCol = col;
          console.log(`📅 Found date header "${cell}" at [${row}][${col}]`);
          break;
        }
      }
    }
    if (dateHeaderRow !== -1) break;
  }
  
  if (dateHeaderRow === -1) {
    console.log('❌ Could not find date header');
    return { dateRow, jamMasukRow, jamPulangRow, dateColumns };
  }
  
  // Look for the actual date row - should be 1-3 rows after the header
  console.log(`🔍 Looking for date row starting from row ${dateHeaderRow + 1}`);
  
  for (let row = dateHeaderRow + 1; row < Math.min(data.length, dateHeaderRow + 6); row++) {
    const rowData = data[row] || [];
    console.log(`\n=== 📋 Checking row ${row} for dates ===`);
    console.log(`Row ${row} data (first 15):`, rowData.slice(0, 15));
    
    let foundDatesInRow = 0;
    const tempDateColumns: Array<{ col: number; day: number }> = [];
    
    // Start checking from the same column as the header, extend search range
    for (let col = Math.max(0, dateHeaderCol - 2); col < Math.min(rowData.length, dateHeaderCol + 40); col++) {
      const cell = rowData[col];
      if (cell !== null && cell !== undefined && cell !== '') {
        const cellStr = cell.toString().trim();
        console.log(`  🔍 Cell [${row}][${col}]: "${cellStr}"`);
        
        let dayMatch = null;
        let day = null;
        
        // Pattern 1: "01 Ka" format (day + day abbreviation)
        dayMatch = cellStr.match(/^(\d{1,2})\s*[A-Za-z]{0,3}$/);
        if (dayMatch) {
          day = parseInt(dayMatch[1]);
        }
        
        // Pattern 2: Just numbers "01", "1", etc
        if (!dayMatch && /^\d{1,2}$/.test(cellStr)) {
          day = parseInt(cellStr);
        }
        
        // Pattern 3: "01Ka" without space
        if (!dayMatch) {
          dayMatch = cellStr.match(/^(\d{1,2})[A-Za-z]{0,3}$/);
          if (dayMatch) {
            day = parseInt(dayMatch[1]);
          }
        }
        
        // Pattern 4: Mixed format like "1Se", "2Sel", etc
        if (!dayMatch) {
          dayMatch = cellStr.match(/^(\d{1,2})[A-Za-z]+$/);
          if (dayMatch) {
            day = parseInt(dayMatch[1]);
          }
        }
        
        if (day !== null) {
          console.log(`    📅 Parsed day: ${day} from "${cellStr}"`);
          
          if (day >= 1 && day <= 31) {
            tempDateColumns.push({ col, day });
            foundDatesInRow++;
            console.log(`    ✅ Valid date found: day ${day} at column ${col}`);
          } else {
            console.log(`    ❌ Invalid day: ${day}`);
          }
        }
      }
    }
    
    console.log(`📊 Row ${row}: Found ${foundDatesInRow} dates`);
    
    // If we found at least 3 dates, it's likely the date row
    if (foundDatesInRow >= 3) {
      dateRow = row;
      dateColumns.push(...tempDateColumns);
      console.log(`✅ DATE ROW FOUND at row ${row} with ${foundDatesInRow} dates`);
      break;
    }
  }
  
  if (dateRow === -1) {
    console.log('❌ Could not find date row');
    return { dateRow, jamMasukRow, jamPulangRow, dateColumns };
  }
  
  // Set jam masuk and jam pulang rows (data will be in rows after the date row)
  jamMasukRow = dateRow;
  jamPulangRow = dateRow;
  
  console.log(`\n🎉 FINAL RESULT:`);
  console.log(`📅 Date row: ${dateRow}`);
  console.log(`📊 Total date columns found: ${dateColumns.length}`);
  console.log(`📋 Date columns (first 10):`, dateColumns.slice(0, 10));
  
  return { dateRow, jamMasukRow, jamPulangRow, dateColumns };
};
