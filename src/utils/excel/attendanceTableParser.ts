
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
  
  console.log('Looking for attendance table (Tabel Kehadiran)...');
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
  
  // Look for date row after the table header (usually the next row or within next 5 rows)
  for (let row = tableStartRow + 1; row < Math.min(data.length, tableStartRow + 10); row++) {
    let foundDatesInRow = 0;
    const tempDateColumns: Array<{ col: number; day: number }> = [];
    
    console.log(`Checking row ${row} for dates:`, data[row]);
    
    for (let col = 0; col < (data[row] || []).length; col++) {
      const cell = data[row] && data[row][col];
      if (cell) {
        const cellStr = cell.toString().trim();
        console.log(`  Cell [${row}][${col}]: "${cellStr}"`);
        
        // Look for various date patterns
        let dayMatch = null;
        
        // Pattern 1: "01 Ka", "02 Ju", etc.
        dayMatch = cellStr.match(/^(\d{1,2})\s*[A-Za-z]{2}/);
        
        // Pattern 2: Just numbers "01", "02", etc.
        if (!dayMatch) {
          dayMatch = cellStr.match(/^(\d{1,2})$/);
        }
        
        // Pattern 3: Date with slashes like "01/05" or similar
        if (!dayMatch) {
          dayMatch = cellStr.match(/^(\d{1,2})[\/\-]/);
        }
        
        if (dayMatch) {
          const day = parseInt(dayMatch[1]);
          console.log(`    Found date pattern: day ${day} in "${cellStr}"`);
          if (day >= 1 && day <= 31) {
            tempDateColumns.push({ col, day });
            foundDatesInRow++;
          }
        }
        
        // Also check for "Tgl/Hari" header which might indicate this is the header row
        if (cellStr.toLowerCase().includes('tgl') || cellStr.toLowerCase().includes('hari')) {
          console.log(`    Found date header: "${cellStr}"`);
          // This might be the header row, dates should be in the next row
          continue;
        }
      }
    }
    
    console.log(`Row ${row} has ${foundDatesInRow} dates`);
    
    // If we found at least 1 date (being less strict), it's probably the date row
    if (foundDatesInRow >= 1) {
      dateRow = row;
      dateColumns.push(...tempDateColumns);
      console.log(`Found date row at ${row} with ${foundDatesInRow} dates`);
      break;
    }
  }
  
  // If still no date row found, try a different approach - look for any row with numeric patterns
  if (dateRow === -1) {
    console.log('Primary date detection failed, trying alternative approach...');
    
    for (let row = tableStartRow + 1; row < Math.min(data.length, tableStartRow + 15); row++) {
      let numberCount = 0;
      const tempDateColumns: Array<{ col: number; day: number }> = [];
      
      for (let col = 0; col < (data[row] || []).length; col++) {
        const cell = data[row] && data[row][col];
        if (cell) {
          const cellStr = cell.toString().trim();
          
          // Look for any numbers that could be days
          if (cellStr.match(/^\d{1,2}$/) && parseInt(cellStr) >= 1 && parseInt(cellStr) <= 31) {
            const day = parseInt(cellStr);
            tempDateColumns.push({ col, day });
            numberCount++;
            console.log(`    Alternative: Found potential day ${day} at [${row}][${col}]`);
          }
        }
      }
      
      if (numberCount >= 1) {
        dateRow = row;
        dateColumns.push(...tempDateColumns);
        console.log(`Alternative: Found date row at ${row} with ${numberCount} potential dates`);
        break;
      }
    }
  }
  
  // Find jam masuk and jam pulang rows after date row
  if (dateRow !== -1) {
    console.log(`Looking for jam masuk/pulang rows after date row ${dateRow}...`);
    
    for (let row = dateRow + 1; row < Math.min(data.length, dateRow + 20); row++) {
      console.log(`Checking row ${row}:`, data[row]);
      
      for (let col = 0; col < (data[row] || []).length; col++) {
        const cell = data[row] && data[row][col];
        if (cell) {
          const cellStr = cell.toString().toLowerCase();
          console.log(`  Cell [${row}][${col}]: "${cellStr}"`);
          
          // Look for "Jam Kerja 1" and "Masuk" pattern for jam masuk
          if ((cellStr.includes('jam kerja 1') || cellStr.includes('jam kerja1')) && cellStr.includes('masuk')) {
            jamMasukRow = row;
            console.log(`Found jam masuk row at ${row}`);
          }
          
          // Look for "Jam Kerja 2" and "Masuk" pattern for jam pulang
          if ((cellStr.includes('jam kerja 2') || cellStr.includes('jam kerja2')) && cellStr.includes('masuk')) {
            jamPulangRow = row;
            console.log(`Found jam pulang row at ${row}`);
          }
          
          // Alternative patterns for jam masuk/pulang
          if (cellStr.includes('masuk') && jamMasukRow === -1) {
            jamMasukRow = row;
            console.log(`Found potential jam masuk row at ${row} (alternative pattern)`);
          }
          
          if (cellStr.includes('pulang') && jamPulangRow === -1) {
            jamPulangRow = row;
            console.log(`Found potential jam pulang row at ${row} (alternative pattern)`);
          }
        }
      }
    }
  }
  
  console.log(`Attendance table structure: dateRow=${dateRow}, jamMasukRow=${jamMasukRow}, jamPulangRow=${jamPulangRow}, dateColumns=${dateColumns.length}`);
  return { dateRow, jamMasukRow, jamPulangRow, dateColumns };
};
