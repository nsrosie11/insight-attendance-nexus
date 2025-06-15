
export const findEmployeeInfo = (data: any[][], columnIndex: number): { nama: string; status: string } | null => {
  console.log(`\n🔍 Looking for employee info at column ${columnIndex}...`);
  
  let employeeName = '';
  let department = '';
  
  // Look for employee name and department in the first 20 rows
  for (let row = 0; row < Math.min(data.length, 20); row++) {
    const rowData = data[row] || [];
    const cell = rowData[columnIndex];
    
    if (cell && cell.toString().trim()) {
      const cellStr = cell.toString().trim();
      const cellLower = cellStr.toLowerCase();
      const cellUpper = cellStr.toUpperCase();
      
      console.log(`  📋 [${row}][${columnIndex}]: "${cellStr}"`);
      
      // Check for department first
      if (cellUpper.includes('RND') || cellUpper.includes('R&D')) {
        department = 'RND';
        console.log(`    ✅ Found RND department`);
        continue;
      } else if (cellUpper.includes('OFFICE')) {
        department = 'OFFICE';
        console.log(`    ✅ Found OFFICE department`);
        continue;
      }
      
      // Check for employee name
      if (!employeeName && 
          cellStr.length >= 2 && 
          cellStr.length <= 20 &&
          !cellLower.includes('nama') &&
          !cellLower.includes('name') &&
          !cellLower.includes('employee') &&
          !cellLower.includes('karyawan') &&
          !cellLower.includes('jam') &&
          !cellLower.includes('masuk') &&
          !cellLower.includes('pulang') &&
          !cellLower.includes('tanggal') &&
          !cellLower.includes('date') &&
          !cellLower.includes('hari') &&
          !cellLower.includes('department') &&
          !cellLower.includes('rnd') &&
          !cellLower.includes('office') &&
          !cellStr.match(/^\d+$/) &&
          !cellStr.match(/\d{1,2}:\d{2}/) &&
          !cellStr.match(/^\d{1,2}$/) &&
          cellStr !== '-' &&
          cellStr !== '' &&
          /[a-zA-Z]/.test(cellStr) &&
          cellStr !== cellUpper) {
        
        employeeName = cellStr;
        console.log(`    ✅ Found employee name: "${employeeName}"`);
      }
    }
  }
  
  // Determine status based on department
  if (employeeName && department) {
    const status = department === 'RND' ? 'Magang' : 'Karyawan';
    console.log(`✅ Employee found: ${employeeName} (${department}) -> ${status}`);
    return { nama: employeeName, status };
  }
  
  console.log(`❌ Incomplete employee info at column ${columnIndex} - name: "${employeeName}", dept: "${department}"`);
  return null;
};
