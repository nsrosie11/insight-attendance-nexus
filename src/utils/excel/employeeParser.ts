
export const findEmployeeInfo = (data: any[][], columnIndex: number): { nama: string; status: string } | null => {
  console.log(`\n🔍 Looking for employee info at column ${columnIndex}...`);
  
  let employeeName = '';
  let department = '';
  
  // Look for employee name and department in the first 15 rows
  for (let row = 0; row < Math.min(data.length, 15); row++) {
    const rowData = data[row] || [];
    const cell = rowData[columnIndex];
    
    if (cell && cell.toString().trim()) {
      const cellStr = cell.toString().trim();
      const cellLower = cellStr.toLowerCase();
      const cellUpper = cellStr.toUpperCase();
      
      console.log(`  📋 Checking [${row}][${columnIndex}]: "${cellStr}"`);
      
      // Check for department first (RND or OFFICE)
      if (cellUpper.includes('RND') || cellUpper.includes('R&D')) {
        department = 'RND';
        console.log(`    ✅ Found RND department at [${row}][${columnIndex}]`);
        continue;
      } else if (cellUpper.includes('OFFICE')) {
        department = 'OFFICE';
        console.log(`    ✅ Found OFFICE department at [${row}][${columnIndex}]`);
        continue;
      }
      
      // Check for employee name (avoid header text, numbers, times, etc.)
      if (!employeeName && 
          cellStr.length >= 3 && 
          cellStr.length <= 25 &&
          !cellLower.includes('nama') &&
          !cellLower.includes('employee') &&
          !cellLower.includes('karyawan') &&
          !cellLower.includes('jam') &&
          !cellLower.includes('masuk') &&
          !cellLower.includes('pulang') &&
          !cellLower.includes('tanggal') &&
          !cellLower.includes('hari') &&
          !cellLower.includes('tgl') &&
          !cellLower.includes('date') &&
          !cellStr.match(/^\d+$/) && // not just numbers
          !cellStr.match(/\d{1,2}:\d{2}/) && // not time format
          !cellStr.match(/^\d{1,2}$/) && // not single/double digits
          cellStr !== '-' &&
          cellStr !== '' &&
          // Must contain at least one letter
          /[a-zA-Z]/.test(cellStr) &&
          // Should not be all uppercase (likely headers)
          cellStr !== cellUpper) {
        
        employeeName = cellStr;
        console.log(`    ✅ Found potential employee name: "${employeeName}" at [${row}][${columnIndex}]`);
      }
    }
  }
  
  // If we found both name and department, return the result
  if (employeeName && department) {
    const status = department === 'RND' ? 'Magang' : 'Karyawan';
    console.log(`✅ Employee found: ${employeeName} (${department}) -> ${status}`);
    return { nama: employeeName, status };
  }
  
  console.log(`❌ No complete employee info found at column ${columnIndex} (name: ${employeeName}, dept: ${department})`);
  return null;
};
