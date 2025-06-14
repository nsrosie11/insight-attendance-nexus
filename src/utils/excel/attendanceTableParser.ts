
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
  
  // First, find where "Tabel Kehadiran" appears
  let tableStartRow = -1;
  for (let row = 0; row < data.length; row++) {
    for (let col = 0; col < (data[row] || []).length; col++) {
      const cell = data[row] && data[row][col];
      if (cell && cell.toString().toLowerCase().includes('tabel kehadiran')) {
        tableStartRow = row;
        console.log(`Found "Tabel Kehadiran" at row ${row}`);
        break;
      }
    }
    if (tableStartRow !== -1) break;
  }
  
  if (tableStartRow === -1) {
    console.log('Could not find "Tabel Kehadiran" header');
    return { dateRow, jamMasukRow, jamPulangRow, dateColumns };
  }
  
  // Look for the main header row (Tgl/Hari, Jam Kerja 1, Jam Kerja 2)
  let headerRow = -1;
  for (let row = tableStartRow + 1; row < Math.min(data.length, tableStartRow + 10); row++) {
    const rowData = data[row] || [];
    console.log(`Checking row ${row} for main headers:`, rowData.slice(0, 20));
    
    let foundTglHari = false;
    let foundJamKerja = false;
    
    for (let col = 0; col < rowData.length; col++) {
      const cell = rowData[col];
      if (cell) {
        const cellStr = cell.toString().toLowerCase();
        if (cellStr.includes('tgl') && cellStr.includes('hari')) {
          foundTglHari = true;
          console.log(`Found Tgl/Hari header at [${row}][${col}]`);
        }
        if (cellStr.includes('jam kerja')) {
          foundJamKerja = true;
          console.log(`Found Jam Kerja header at [${row}][${col}]`);
        }
      }
    }
    
    if (foundTglHari && foundJamKerja) {
      headerRow = row;
      console.log(`Found main header row at ${row}`);
      break;
    }
  }
  
  if (headerRow === -1) {
    console.log('Could not find main header row');
    return { dateRow, jamMasukRow, jamPulangRow, dateColumns };
  }
  
  // Look for sub-header row (Msuk/Kluar) - should be right after main header
  let subHeaderRow = headerRow + 1;
  const subHeaderData = data[subHeaderRow] || [];
  console.log(`Checking sub-header row ${subHeaderRow}:`, subHeaderData.slice(0, 20));
  
  // Now look for the actual date row - should be after sub-header
  console.log(`Looking for date row starting from row ${subHeaderRow + 1}`);
  
  for (let row = subHeaderRow + 1; row < Math.min(data.length, subHeaderRow + 10); row++) {
    const rowData = data[row] || [];
    console.log(`\n=== Checking row ${row} for dates ===`);
    console.log(`Row ${row} data:`, rowData.slice(0, 30));
    
    let foundDatesInRow = 0;
    const tempDateColumns: Array<{ col: number; day: number }> = [];
    
    // Check each cell in this row for date patterns
    for (let col = 0; col < rowData.length; col++) {
      const cell = rowData[col];
      if (cell) {
        const cellStr = cell.toString().trim();
        console.log(`  Cell [${row}][${col}]: "${cellStr}"`);
        
        // Look for date patterns like "01 Ka", "02 Se", "03 Ra", etc.
        // Also try patterns like "1", "2", "3" or "01", "02", "03"
        let dayMatch = null;
        
        // Pattern 1: "01 Ka" format
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
      console.log(`Date columns:`, tempDateColumns.slice(0, 10));
      break;
    }
  }
  
  if (dateRow === -1) {
    console.log('❌ Could not find date row after extensive search');
    // Let's try one more approach - look for any row with multiple small numbers
    console.log('Trying fallback approach...');
    
    for (let row = subHeaderRow + 1; row < Math.min(data.length, subHeaderRow + 15); row++) {
      const rowData = data[row] || [];
      let numberCount = 0;
      const tempDateColumns: Array<{ col: number; day: number }> = [];
      
      for (let col = 0; col < Math.min(rowData.length, 40); col++) {
        const cell = rowData[col];
        if (cell) {
          const cellStr = cell.toString().trim();
          // Look for any small numbers that could be dates
          if (/^\d{1,2}/.test(cellStr)) {
            const numMatch = cellStr.match(/^(\d{1,2})/);
            if (numMatch) {
              const num = parseInt(numMatch[1]);
              if (num >= 1 && num <= 31) {
                tempDateColumns.push({ col, day: num });
                numberCount++;
              }
            }
          }
        }
      }
      
      if (numberCount >= 5) {
        dateRow = row;
        dateColumns.push(...tempDateColumns);
        console.log(`✓ FALLBACK: Found date row at ${row} with ${numberCount} dates`);
        break;
      }
    }
  }
  
  if (dateRow === -1) {
    console.log('❌ FAILED: Still could not find date row');
    return { dateRow, jamMasukRow, jamPulangRow, dateColumns };
  }
  
  // Set jam masuk and jam pulang rows
  jamMasukRow = dateRow;
  jamPulangRow = dateRow;
  
  console.log(`\n=== FINAL RESULT ===`);
  console.log(`Date row: ${dateRow}`);
  console.log(`Jam masuk row: ${jamMasukRow}`);
  console.log(`Jam pulang row: ${jamPulangRow}`);
  console.log(`Total date columns found: ${dateColumns.length}`);
  console.log(`First 10 date columns:`, dateColumns.slice(0, 10));
  
  return { dateRow, jamMasukRow, jamPulangRow, dateColumns };
};
