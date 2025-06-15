
export const findEmployeeInfo = (data: any[][]): { nama: string; status: string } | null => {
  console.log('🔍 Looking for employee info in card structure...');
  console.log('📋 Sheet data preview (first 20 rows, first 15 cols):');
  
  // Print a preview of the data to understand the structure
  for (let i = 0; i < Math.min(data.length, 20); i++) {
    const row = data[i] || [];
    const preview = row.slice(0, 15).map((cell, idx) => `[${idx}]${cell || 'null'}`).join(' | ');
    console.log(`Row ${i}: ${preview}`);
  }
  
  let nama = '';
  let departemen = '';
  
  // Look for employee cards in the first 15 rows
  for (let row = 0; row < Math.min(data.length, 15); row++) {
    const rowData = data[row] || [];
    
    // Look for "Nama" text in any column of this row
    for (let col = 0; col < Math.min(rowData.length, 30); col++) {
      const cell = rowData[col];
      if (cell && cell.toString().toLowerCase().trim() === 'nama') {
        console.log(`✅ Found "Nama" label at [${row}][${col}]`);
        
        // Look for the actual name in nearby cells (same row, next columns)
        for (let nameCol = col + 1; nameCol < Math.min(rowData.length, col + 5); nameCol++) {
          const nameCell = rowData[nameCol];
          if (nameCell && nameCell.toString().trim()) {
            const nameStr = nameCell.toString().trim();
            console.log(`🔍 Checking potential name: "${nameStr}" at [${row}][${nameCol}]`);
            
            // Check if this looks like a person's name
            if (nameStr.length >= 2 && 
                nameStr.length <= 30 && 
                !nameStr.toLowerCase().includes('departemen') &&
                !nameStr.toLowerCase().includes('nama') &&
                !nameStr.toLowerCase().includes('tanggal') &&
                !nameStr.toLowerCase().includes('periode') &&
                !nameStr.toLowerCase().includes('jam') &&
                !nameStr.toLowerCase().includes('masuk') &&
                !nameStr.toLowerCase().includes('pulang') &&
                !nameStr.toLowerCase().includes('tgl') &&
                !nameStr.toLowerCase().includes('hari') &&
                !nameStr.match(/^\d+$/) &&
                !nameStr.match(/^\d{2}:\d{2}/)) {
              
              nama = nameStr.toLowerCase();
              console.log(`✅ Found employee name: "${nama}"`);
              
              // Now look for "Departemen" in nearby rows to find department info
              for (let deptSearchRow = Math.max(0, row - 3); deptSearchRow < Math.min(data.length, row + 5); deptSearchRow++) {
                const deptRowData = data[deptSearchRow] || [];
                
                for (let deptCol = 0; deptCol < Math.min(deptRowData.length, 30); deptCol++) {
                  const deptLabelCell = deptRowData[deptCol];
                  if (deptLabelCell && deptLabelCell.toString().toLowerCase().includes('departemen')) {
                    console.log(`✅ Found "Departemen" label at [${deptSearchRow}][${deptCol}]`);
                    
                    // Look for department value in nearby cells
                    for (let deptValueCol = deptCol + 1; deptValueCol < Math.min(deptRowData.length, deptCol + 5); deptValueCol++) {
                      const deptValueCell = deptRowData[deptValueCol];
                      if (deptValueCell && deptValueCell.toString().trim()) {
                        const deptStr = deptValueCell.toString().toUpperCase().trim();
                        console.log(`🔍 Checking department value: "${deptStr}" at [${deptSearchRow}][${deptValueCol}]`);
                        
                        if (deptStr.includes('RND') || deptStr.includes('R&D')) {
                          departemen = 'RND';
                          console.log(`✅ Department: RND found`);
                        } else if (deptStr.includes('OFFICE')) {
                          departemen = 'OFFICE';
                          console.log(`✅ Department: OFFICE found`);
                        }
                        
                        if (departemen) break;
                      }
                    }
                    if (departemen) break;
                  }
                }
                if (departemen) break;
              }
              
              if (nama && departemen) break;
            }
          }
        }
        if (nama && departemen) break;
      }
    }
    if (nama && departemen) break;
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
