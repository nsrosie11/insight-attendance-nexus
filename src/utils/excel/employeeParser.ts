
export const findEmployeeInfo = (data: any[][], columnIndex: number): { nama: string; status: string } | null => {
  console.log(`\n🔍 Looking for employee info at column ${columnIndex}...`);
  
  // Look for employee cards in the first 20 rows
  for (let row = 0; row < Math.min(data.length, 20); row++) {
    const rowData = data[row] || [];
    
    // Check if this cell contains a potential employee name
    const nameCell = rowData[columnIndex];
    if (nameCell && nameCell.toString().trim()) {
      const nameStr = nameCell.toString().trim().toLowerCase();
      
      // Skip if it's clearly not a name (contains numbers, dates, or common non-name words)
      if (nameStr.match(/^\d+$/) || // just numbers
          nameStr.match(/\d{1,2}:\d{2}/) || // time format
          nameStr.match(/^\d{1,2}$/) || // single/double digits (dates)
          nameStr.includes('jam') ||
          nameStr.includes('masuk') ||
          nameStr.includes('pulang') ||
          nameStr.includes('tanggal') ||
          nameStr.includes('hari') ||
          nameStr.includes('tgl') ||
          nameStr === '' ||
          nameStr === '-' ||
          nameStr.length < 2 ||
          nameStr.length > 25) {
        continue;
      }
      
      console.log(`🔍 Potential name found: "${nameStr}" at [${row}][${columnIndex}]`);
      
      // Look for department info in the next few rows in the same column
      let departemen = '';
      for (let deptRow = row + 1; deptRow < Math.min(data.length, row + 10); deptRow++) {
        const deptRowData = data[deptRow] || [];
        const deptCell = deptRowData[columnIndex];
        
        if (deptCell && deptCell.toString().trim()) {
          const deptStr = deptCell.toString().toUpperCase().trim();
          console.log(`🔍 Checking dept at [${deptRow}][${columnIndex}]: "${deptStr}"`);
          
          if (deptStr.includes('RND') || deptStr.includes('R&D')) {
            departemen = 'RND';
            console.log(`✅ Found RND department for ${nameStr}`);
            break;
          } else if (deptStr.includes('OFFICE')) {
            departemen = 'OFFICE';
            console.log(`✅ Found OFFICE department for ${nameStr}`);
            break;
          }
        }
      }
      
      // If we found a name and department, determine status
      if (departemen) {
        const status = departemen === 'RND' ? 'Magang' : 'Karyawan';
        console.log(`✅ Employee found: ${nameStr} (${departemen}) -> ${status}`);
        return { nama: nameStr, status };
      }
    }
  }
  
  console.log(`❌ No employee info found at column ${columnIndex}`);
  return null;
};
