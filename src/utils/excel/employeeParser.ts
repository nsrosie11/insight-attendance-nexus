
export const findEmployeeInfo = (data: any[][]): { nama: string; status: string } | null => {
  let nama = '';
  let departemen = '';
  
  console.log('🔍 Looking for employee info in header structure...');
  console.log('📋 First 10 rows of data:', data.slice(0, 10));
  
  // Look for header structure in first 10 rows
  for (let row = 0; row < Math.min(data.length, 10); row++) {
    const rowData = data[row] || [];
    console.log(`\n=== 📋 Checking row ${row} for employee header ===`);
    console.log(`Row ${row} data:`, rowData.slice(0, 20));
    
    // Look for "Nama" header first to find the right row
    let namaHeaderCol = -1;
    for (let col = 0; col < Math.min(rowData.length, 30); col++) {
      const cell = rowData[col];
      if (cell && cell.toString().toLowerCase().trim() === 'nama') {
        namaHeaderCol = col;
        console.log(`✅ Found "Nama" header at [${row}][${col}]`);
        break;
      }
    }
    
    if (namaHeaderCol !== -1) {
      // Look for employee name in columns after the "Nama" header
      for (let col = namaHeaderCol + 1; col < Math.min(rowData.length, namaHeaderCol + 10); col++) {
        const nameCell = rowData[col];
        if (nameCell && nameCell.toString().trim()) {
          const nameStr = nameCell.toString().trim();
          console.log(`🔍 Checking potential name: "${nameStr}" at [${row}][${col}]`);
          
          // Check if this looks like a name (not departemen or other text)
          if (nameStr.length >= 3 && 
              nameStr.length <= 25 && 
              nameStr.match(/^[a-zA-Z\s\-\.]+$/) &&
              !nameStr.toUpperCase().includes('RND') &&
              !nameStr.toUpperCase().includes('OFFICE') &&
              !nameStr.toLowerCase().includes('depart') &&
              !nameStr.toLowerCase().includes('tanggal') &&
              !nameStr.toLowerCase().includes('periode')) {
            
            nama = nameStr.toLowerCase();
            console.log(`✅ Found employee name: "${nama}"`);
            
            // Look for department in the next row, same column
            const deptRow = row + 1;
            if (deptRow < data.length) {
              const deptCell = data[deptRow] && data[deptRow][col];
              if (deptCell) {
                const deptStr = deptCell.toString().toUpperCase().trim();
                console.log(`🔍 Checking department at [${deptRow}][${col}]: "${deptStr}"`);
                
                if (deptStr.includes('RND') || deptStr.includes('R&D')) {
                  departemen = 'RND';
                  console.log(`✅ Department: RND found`);
                } else if (deptStr.includes('OFFICE')) {
                  departemen = 'OFFICE';
                  console.log(`✅ Department: OFFICE found`);
                }
              }
            }
            
            // If we found both name and department, we're done
            if (nama && departemen) {
              break;
            }
          }
        }
      }
      
      if (nama && departemen) {
        break;
      }
    }
  }
  
  // Alternative search: look for potential names in header-like positions (first few rows)
  if (!nama) {
    console.log('❌ No employee name found with "Nama" keyword, trying header scan...');
    
    for (let row = 0; row < Math.min(data.length, 8); row++) {
      const rowData = data[row] || [];
      
      for (let col = 5; col < Math.min(rowData.length, 25); col++) {
        const cell = rowData[col];
        if (cell && cell.toString().trim()) {
          const cellStr = cell.toString().trim();
          
          // Look for potential names in header positions
          if (cellStr.length >= 3 && 
              cellStr.length <= 20 && 
              cellStr.match(/^[a-zA-Z\s\-\.]+$/) &&
              !cellStr.toUpperCase().includes('RND') &&
              !cellStr.toUpperCase().includes('OFFICE') &&
              !cellStr.toLowerCase().includes('nama') &&
              !cellStr.toLowerCase().includes('depart') &&
              !cellStr.toLowerCase().includes('tanggal') &&
              !cellStr.toLowerCase().includes('periode') &&
              !cellStr.toLowerCase().includes('masuk') &&
              !cellStr.toLowerCase().includes('pulang') &&
              !cellStr.toLowerCase().includes('jam') &&
              !cellStr.toLowerCase().includes('lembur') &&
              !cellStr.toLowerCase().includes('terlambat') &&
              !cellStr.toLowerCase().includes('absen') &&
              !cellStr.toLowerCase().includes('ijin') &&
              !cellStr.toLowerCase().includes('tgl') &&
              !cellStr.toLowerCase().includes('hari') &&
              !cellStr.match(/^\d+$/) &&
              !cellStr.match(/^\d{2}:\d{2}/)) {
            
            nama = cellStr.toLowerCase();
            console.log(`✅ Found potential employee name: "${nama}" at [${row}][${col}]`);
            
            // Look for department in the next row, same column
            const deptRow = row + 1;
            if (deptRow < data.length) {
              const deptCell = data[deptRow] && data[deptRow][col];
              if (deptCell) {
                const deptStr = deptCell.toString().toUpperCase().trim();
                console.log(`🔍 Checking department at [${deptRow}][${col}]: "${deptStr}"`);
                
                if (deptStr.includes('RND') || deptStr.includes('R&D')) {
                  departemen = 'RND';
                  console.log(`✅ Department: RND found`);
                } else if (deptStr.includes('OFFICE')) {
                  departemen = 'OFFICE';
                  console.log(`✅ Department: OFFICE found`);
                }
              }
            }
            
            // If we found both name and department, we're done
            if (nama && departemen) {
              break;
            }
          }
        }
      }
      
      if (nama && departemen) {
        break;
      }
    }
  }
  
  if (!nama) {
    console.log('❌ No employee name found in sheet');
    return null;
  }
  
  // Convert department to status with proper logic
  let status = 'Karyawan'; // default
  if (departemen === 'RND') {
    status = 'Magang';
  } else if (departemen === 'OFFICE') {
    status = 'Karyawan';
  }
  
  console.log(`✅ Final employee info: "${nama}" with department: ${departemen} -> status: ${status}`);
  return { nama, status };
};
