
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
  
  // Look for "Tgl/Hari" column or similar date indicators
  let dateColumnIndex = -1;
  let tableStartRow = -1;
  
  for (let row = 0; row < Math.min(data.length, 15); row++) {
    const rowData = data[row] || [];
    
    for (let col = 0; col < Math.min(rowData.length, 10); col++) {
      const cell = rowData[col];
      if (cell) {
        const cellStr = cell.toString().toLowerCase().trim();
        
        // Look for date column indicators
        if ((cellStr.includes('tgl') && cellStr.includes('hari')) ||
            cellStr.includes('tanggal') ||
            (cellStr.includes('tgl') && cellStr.length < 8)) {
          dateColumnIndex = col;
          tableStartRow = row;
          console.log(`📅 Found date column "${cell}" at [${row}][${col}]`);
          break;
        }
      }
    }
    
    if (dateColumnIndex !== -1) break;
  }
  
  if (dateColumnIndex === -1) {
    console.log('❌ Could not find date column');
    return { dateRow, jamMasukRow, jamPulangRow, dateColumns };
  }
  
  // Now scan down from the table start to find actual date entries
  console.log(`🔍 Scanning for date entries starting from row ${tableStartRow + 1}`);
  
  for (let row = tableStartRow + 1; row < Math.min(data.length, tableStartRow + 40); row++) {
    const rowData = data[row] || [];
    const dateCell = rowData[dateColumnIndex];
    
    if (dateCell !== null && dateCell !== undefined && dateCell !== '') {
      const cellStr = dateCell.toString().trim();
      console.log(`🔍 Checking date cell [${row}][${dateColumnIndex}]: "${cellStr}"`);
      
      // Look for day patterns (01 Ka, 02 Ju, etc.)
      let dayMatch = null;
      let day = null;
      
      // Pattern 1: "01 Ka", "02 Ju" format
      dayMatch = cellStr.match(/^(\d{1,2})\s*[A-Za-z]{0,3}$/);
      if (dayMatch) {
        day = parseInt(dayMatch[1]);
      }
      
      // Pattern 2: Just numbers "01", "1", etc
      if (!dayMatch && /^\d{1,2}$/.test(cellStr)) {
        day = parseInt(cellStr);
      }
      
      if (day !== null && day >= 1 && day <= 31) {
        console.log(`✅ Found valid date entry: day ${day} at row ${row}`);
        
        // This row contains date data, so we found our date structure
        if (dateRow === -1) {
          dateRow = row;
          jamMasukRow = row;
          jamPulangRow = row;
        }
        
        // Add this as a date "column" (though it's actually a row in this format)
        dateColumns.push({ col: dateColumnIndex, day });
      }
    }
  }
  
  console.log(`\n🎉 FINAL RESULT:`);
  console.log(`📅 Date row: ${dateRow}`);
  console.log(`📊 Total date entries found: ${dateColumns.length}`);
  console.log(`📋 Date entries (first 10):`, dateColumns.slice(0, 10));
  
  return { dateRow, jamMasukRow, jamPulangRow, dateColumns };
};
