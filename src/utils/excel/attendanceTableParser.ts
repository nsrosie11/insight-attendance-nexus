
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
  
  // Find date row (look for patterns like "01 Ka", "02 Ju", etc.)
  for (let row = 0; row < data.length; row++) {
    let foundDatesInRow = 0;
    const tempDateColumns: Array<{ col: number; day: number }> = [];
    
    console.log(`Checking row ${row} for dates:`, data[row]);
    
    for (let col = 0; col < (data[row] || []).length; col++) {
      const cell = data[row] && data[row][col];
      if (cell) {
        const cellStr = cell.toString().trim();
        console.log(`  Cell [${row}][${col}]: "${cellStr}"`);
        
        // Look for date pattern like "01 Ka", "02 Ju", etc.
        const dayMatch = cellStr.match(/^(\d{1,2})\s*[A-Za-z]{2}/);
        if (dayMatch) {
          const day = parseInt(dayMatch[1]);
          console.log(`    Found date pattern: day ${day}`);
          if (day >= 1 && day <= 31) {
            tempDateColumns.push({ col, day });
            foundDatesInRow++;
          }
        }
      }
    }
    
    console.log(`Row ${row} has ${foundDatesInRow} dates`);
    
    // If we found multiple dates in this row, it's probably the date row
    if (foundDatesInRow >= 2) {
      dateRow = row;
      dateColumns.push(...tempDateColumns);
      console.log(`Found date row at ${row} with ${foundDatesInRow} dates`);
      break;
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
          if (cellStr.includes('masuk') && !jamMasukRow) {
            jamMasukRow = row;
            console.log(`Found potential jam masuk row at ${row} (alternative pattern)`);
          }
          
          if (cellStr.includes('pulang') && !jamPulangRow) {
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
