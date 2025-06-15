
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
  
  console.log('Looking for attendance table structure...');
  console.log('Sheet has', data.length, 'rows');
  
  // First, find the "Tgl/Hari" header
  let dateHeaderRow = -1;
  let dateHeaderCol = -1;
  
  for (let row = 0; row < data.length; row++) {
    for (let col = 0; col < (data[row] || []).length; col++) {
      const cell = data[row] && data[row][col];
      if (cell) {
        const cellStr = cell.toString().toLowerCase().trim();
        if (cellStr.includes('tgl') && cellStr.includes('hari')) {
          dateHeaderRow = row;
          dateHeaderCol = col;
          console.log(`Found "Tgl/Hari" header at [${row}][${col}]`);
          break;
        }
      }
    }
    if (dateHeaderRow !== -1) break;
  }
  
  if (dateHeaderRow === -1) {
    console.log('Could not find "Tgl/Hari" header');
    return { dateRow, jamMasukRow, jamPulangRow, dateColumns };
  }
  
  // Look for the actual date row - should be 1-2 rows after the header
  console.log(`Looking for date row starting from row ${dateHeaderRow + 1}`);
  
  for (let row = dateHeaderRow + 1; row < Math.min(data.length, dateHeaderRow + 5); row++) {
    const rowData = data[row] || [];
    console.log(`\n=== Checking row ${row} for dates ===`);
    console.log(`Row ${row} data:`, rowData.slice(0, 30));
    
    let foundDatesInRow = 0;
    const tempDateColumns: Array<{ col: number; day: number }> = [];
    
    // Start checking from the same column as the header
    for (let col = dateHeaderCol; col < Math.min(rowData.length, dateHeaderCol + 35); col++) {
      const cell = rowData[col];
      if (cell) {
        const cellStr = cell.toString().trim();
        console.log(`  Cell [${row}][${col}]: "${cellStr}"`);
        
        // Look for date patterns like "01 Ka", "02 Se", "03 Ra", etc.
        let dayMatch = null;
        
        // Pattern 1: "01 Ka" format (day + day abbreviation)
        dayMatch = cellStr.match(/^(\d{1,2})\s*[A-Za-z]{0,2}$/);
        
        // Pattern 2: Just numbers
        if (!dayMatch && /^\d{1,2}$/.test(cellStr)) {
          dayMatch = [cellStr, cellStr];
        }
        
        // Pattern 3: "01Ka" without space
        if (!dayMatch) {
          dayMatch = cellStr.match(/^(\d{1,2})[A-Za-z]{0,2}$/);
        }
        
        if (dayMatch) {
          const day = parseInt(dayMatch[1]);
          console.log(`    Parsed day: ${day} from "${cellStr}"`);
          
          if (day >= 1 && day <= 31) {
            tempDateColumns.push({ col, day });
            foundDatesInRow++;
            console.log(`    ✓ Valid date found: day ${day} at column ${col}`);
          }
        }
      }
    }
    
    console.log(`Row ${row}: Found ${foundDatesInRow} dates`);
    
    // If we found at least 5 dates, it's likely the date row
    if (foundDatesInRow >= 5) {
      dateRow = row;
      dateColumns.push(...tempDateColumns);
      console.log(`✓ DATE ROW FOUND at row ${row} with ${foundDatesInRow} dates`);
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
  
  console.log(`\n=== FINAL RESULT ===`);
  console.log(`Date row: ${dateRow}`);
  console.log(`Total date columns found: ${dateColumns.length}`);
  console.log(`Date columns:`, dateColumns.slice(0, 10));
  
  return { dateRow, jamMasukRow, jamPulangRow, dateColumns };
};
