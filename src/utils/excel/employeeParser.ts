
export const findEmployeeInfo = (data: any[][]): { nama: string; status: string } | null => {
  let nama = '';
  let departemen = '';
  
  console.log('Looking for employee info in sheet...');
  console.log('First 10 rows of data:', data.slice(0, 10));
  
  // Look for nama pattern in first 15 rows and first 20 columns
  for (let row = 0; row < Math.min(data.length, 15); row++) {
    for (let col = 0; col < Math.min((data[row] || []).length, 20); col++) {
      const cell = data[row] && data[row][col];
      if (cell) {
        const cellStr = cell.toString().trim();
        console.log(`Checking cell [${row}][${col}]: "${cellStr}"`);
        
        // Look for "Nama" keyword (case insensitive)
        if (cellStr.toLowerCase().includes('nama')) {
          console.log(`Found "Nama" keyword at [${row}][${col}]`);
          
          // Check adjacent cells for the actual name
          const adjacentCells = [
            { r: row, c: col + 1 }, // right
            { r: row + 1, c: col }, // below
            { r: row, c: col + 2 }, // 2 columns right
            { r: row + 1, c: col + 1 }, // diagonal
            { r: row, c: col + 3 } // 3 columns right
          ];
          
          for (const adj of adjacentCells) {
            if (adj.r >= data.length || adj.c >= (data[adj.r] || []).length) continue;
            
            const adjCell = data[adj.r] && data[adj.r][adj.c];
            if (adjCell && adjCell.toString().trim()) {
              const adjStr = adjCell.toString().trim();
              console.log(`Checking adjacent cell [${adj.r}][${adj.c}]: "${adjStr}"`);
              
              // Skip if it's a header or common keywords
              if (!adjStr.toLowerCase().includes('nama') && 
                  !adjStr.toLowerCase().includes('dept') &&
                  !adjStr.toLowerCase().includes('office') &&
                  !adjStr.toLowerCase().includes('rnd') &&
                  !adjStr.toLowerCase().includes('departemen') &&
                  !adjStr.toLowerCase().includes('tanggal') &&
                  !adjStr.toLowerCase().includes('hari') &&
                  !adjStr.toLowerCase().includes('no') &&
                  !adjStr.toLowerCase().includes('tgl') &&
                  adjStr.length > 2 && adjStr.length < 50 &&
                  adjStr.match(/^[a-zA-Z\s]+$/)) {
                nama = adjStr; // Keep original case for full name
                console.log(`Found employee name: ${nama}`);
                break;
              }
            }
          }
          
          if (nama) break;
        }
        
        // Look for department patterns - more flexible
        if (cellStr.toLowerCase().includes('dept') || 
            cellStr.toLowerCase().includes('departemen') ||
            cellStr.toLowerCase().includes('divisi') ||
            cellStr.toLowerCase().includes('bagian')) {
          console.log(`Found department keyword at [${row}][${col}]`);
          
          // Check adjacent cells for department value
          const adjacentCells = [
            { r: row, c: col + 1 },
            { r: row + 1, c: col },
            { r: row, c: col + 2 },
            { r: row + 1, c: col + 1 },
            { r: row, c: col - 1 }, // also check left
            { r: row - 1, c: col } // and above
          ];
          
          for (const adj of adjacentCells) {
            if (adj.r >= data.length || adj.c >= (data[adj.r] || []).length) continue;
            
            const adjCell = data[adj.r] && data[adj.r][adj.c];
            if (adjCell) {
              const adjStr = adjCell.toString().toUpperCase().trim();
              console.log(`Checking department value: "${adjStr}"`);
              if (adjStr.includes('RND') || adjStr.includes('R&D')) {
                departemen = 'RND';
                console.log(`Department: RND found`);
                break;
              } else if (adjStr.includes('OFFICE') || adjStr.includes('KANTOR')) {
                departemen = 'OFFICE';
                console.log(`Department: OFFICE found`);
                break;
              }
            }
          }
        }
      }
    }
    
    if (nama && departemen) break;
  }
  
  // Alternative approach: look for potential names in specific patterns
  if (!nama) {
    console.log('No employee name found with "Nama" keyword, trying alternative approach...');
    
    for (let row = 0; row < Math.min(data.length, 12); row++) {
      for (let col = 0; col < Math.min((data[row] || []).length, 15); col++) {
        const cell = data[row] && data[row][col];
        if (cell) {
          const cellStr = cell.toString().trim();
          
          // Look for potential names (letters only, reasonable length)
          if (cellStr.length >= 3 && 
              cellStr.length <= 30 && 
              cellStr.match(/^[a-zA-Z\s]+$/) &&
              !cellStr.toLowerCase().includes('nama') &&
              !cellStr.toLowerCase().includes('dept') &&
              !cellStr.toLowerCase().includes('office') &&
              !cellStr.toLowerCase().includes('rnd') &&
              !cellStr.toLowerCase().includes('tanggal') &&
              !cellStr.toLowerCase().includes('hari') &&
              !cellStr.toLowerCase().includes('jam') &&
              !cellStr.toLowerCase().includes('masuk') &&
              !cellStr.toLowerCase().includes('pulang') &&
              !cellStr.toLowerCase().includes('kerja') &&
              !cellStr.toLowerCase().includes('absen') &&
              !cellStr.toLowerCase().includes('tgl') &&
              !cellStr.toLowerCase().includes('no') &&
              !cellStr.toLowerCase().includes('departemen') &&
              !cellStr.toLowerCase().includes('divisi')) {
            
            nama = cellStr; // Keep original case for full name
            console.log(`Found potential employee name: ${nama} at [${row}][${col}]`);
            break;
          }
        }
      }
      
      if (nama) break;
    }
  }
  
  // Alternative department search - look for standalone RND/Office
  if (!departemen) {
    console.log('No department found with keyword, scanning for RND/Office patterns...');
    
    for (let row = 0; row < Math.min(data.length, 15); row++) {
      for (let col = 0; col < Math.min((data[row] || []).length, 20); col++) {
        const cell = data[row] && data[row][col];
        if (cell) {
          const cellStr = cell.toString().toUpperCase().trim();
          if (cellStr === 'RND' || cellStr === 'R&D' || cellStr === 'R & D') {
            departemen = 'RND';
            console.log(`Found department: RND at [${row}][${col}]`);
            break;
          } else if (cellStr === 'OFFICE' || cellStr === 'KANTOR' || cellStr === 'ADMIN') {
            departemen = 'OFFICE';
            console.log(`Found department: OFFICE at [${row}][${col}]`);
            break;
          }
        }
      }
      
      if (departemen) break;
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
