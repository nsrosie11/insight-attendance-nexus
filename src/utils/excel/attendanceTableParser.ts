
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
  
  // Look for the header row with "Tgl/Hari", "Jam Kerja 1", "Jam Kerja 2"
  let headerRow = -1;
  for (let row = tableStartRow + 1; row < Math.min(data.length, tableStartRow + 5); row++) {
    const rowData = data[row] || [];
    console.log(`Checking row ${row} for headers:`, rowData.slice(0, 15));
    
    // Look for pattern: Tgl/Hari, Jam Kerja 1, Jam Kerja 2
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
      console.log(`Found complete header row at ${row}`);
      break;
    }
  }
  
  if (headerRow === -1) {
    console.log('Could not find header row with Tgl/Hari and Jam Kerja');
    return { dateRow, jamMasukRow, jamPulangRow, dateColumns };
  }
  
  // Look for sub-header row with "Msuk" and "Kluar"
  let subHeaderRow = -1;
  for (let row = headerRow + 1; row < Math.min(data.length, headerRow + 3); row++) {
    const rowData = data[row] || [];
    console.log(`Checking row ${row} for sub-headers:`, rowData.slice(0, 15));
    
    let foundMsuk = false;
    let foundKluar = false;
    
    for (let col = 0; col < rowData.length; col++) {
      const cell = rowData[col];
      if (cell) {
        const cellStr = cell.toString().toLowerCase();
        if (cellStr.includes('msuk')) {
          foundMsuk = true;
          console.log(`Found Msuk at [${row}][${col}]`);
        }
        if (cellStr.includes('kluar')) {
          foundKluar = true;
          console.log(`Found Kluar at [${row}][${col}]`);
        }
      }
    }
    
    if (foundMsuk && foundKluar) {
      subHeaderRow = row;
      console.log(`Found sub-header row at ${row}`);
      break;
    }
  }
  
  if (subHeaderRow === -1) {
    console.log('Could not find sub-header row with Msuk/Kluar');
    return { dateRow, jamMasukRow, jamPulangRow, dateColumns };
  }
  
  // Now find the actual date row (should be right after sub-header)
  // Look more broadly in the next several rows after sub-header
  console.log(`Searching for date row starting from row ${subHeaderRow + 1}`);
  
  for (let row = subHeaderRow + 1; row < Math.min(data.length, subHeaderRow + 20); row++) {
    const rowData = data[row] || [];
    console.log(`Checking row ${row} for dates:`, rowData.slice(0, 20));
    
    let foundDatesInRow = 0;
    const tempDateColumns: Array<{ col: number; day: number }> = [];
    
    for (let col = 0; col < rowData.length; col++) {
      const cell = rowData[col];
      if (cell) {
        const cellStr = cell.toString().trim();
        console.log(`Checking cell [${row}][${col}]: "${cellStr}"`);
        
        // Look for date patterns - be more flexible
        // Try patterns like "01 Ka", "1 Se", "02 Ju", etc.
        let dayMatch = cellStr.match(/^(\d{1,2})\s*[A-Za-z]{0,2}$/);
        
        // Also try just pure numbers
        if (!dayMatch && /^\d{1,2}$/.test(cellStr)) {
          dayMatch = [cellStr, cellStr];
        }
        
        // Also try pattern like "01Ka" without space
        if (!dayMatch) {
          dayMatch = cellStr.match(/^(\d{1,2})[A-Za-z]{0,2}$/);
        }
        
        if (dayMatch) {
          const day = parseInt(dayMatch[1]);
          if (day >= 1 && day <= 31) {
            tempDateColumns.push({ col, day });
            foundDatesInRow++;
            console.log(`Found date: day ${day} at [${row}][${col}] from "${cellStr}"`);
          }
        }
      }
    }
    
    // If we found at least 3 dates, it's probably the date row
    if (foundDatesInRow >= 3) {
      dateRow = row;
      dateColumns.push(...tempDateColumns);
      console.log(`Found date row at ${row} with ${foundDatesInRow} dates`);
      break;
    }
  }
  
  if (dateRow === -1) {
    console.log('Could not find date row - trying alternative approach');
    
    // Alternative: look for any row with multiple number patterns
    for (let row = subHeaderRow + 1; row < Math.min(data.length, subHeaderRow + 20); row++) {
      const rowData = data[row] || [];
      let numberCount = 0;
      const tempDateColumns: Array<{ col: number; day: number }> = [];
      
      for (let col = 0; col < rowData.length; col++) {
        const cell = rowData[col];
        if (cell) {
          const cellStr = cell.toString().trim();
          // Look for any 1-2 digit numbers
          if (/^\d{1,2}/.test(cellStr)) {
            const num = parseInt(cellStr.match(/^(\d{1,2})/)[1]);
            if (num >= 1 && num <= 31) {
              tempDateColumns.push({ col, day: num });
              numberCount++;
              console.log(`Alternative: Found potential date ${num} at [${row}][${col}]`);
            }
          }
        }
      }
      
      if (numberCount >= 3) {
        dateRow = row;
        dateColumns.push(...tempDateColumns);
        console.log(`Alternative: Found date row at ${row} with ${numberCount} dates`);
        break;
      }
    }
  }
  
  if (dateRow === -1) {
    console.log('Still could not find date row');
    return { dateRow, jamMasukRow, jamPulangRow, dateColumns };
  }
  
  // Set jam masuk and jam pulang rows to be the same as date row
  // since data is in the same rows as dates, just different columns
  jamMasukRow = dateRow;
  jamPulangRow = dateRow;
  
  console.log(`Final structure: dateRow=${dateRow}, jamMasukRow=${jamMasukRow}, jamPulangRow=${jamPulangRow}, dateColumns=${dateColumns.length}`);
  console.log('Date columns found:', dateColumns);
  return { dateRow, jamMasukRow, jamPulangRow, dateColumns };
};
