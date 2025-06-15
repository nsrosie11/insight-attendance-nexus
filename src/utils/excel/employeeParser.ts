
export const findEmployeeInfo = (data: any[][]): { nama: string; status: string } | null => {
  let nama = '';
  let departemen = '';
  
  console.log('🔍 Looking for employee info in sheet...');
  console.log('📋 First 15 rows of data:', data.slice(0, 15));
  
  // Look for nama pattern in first 20 rows and first 25 columns
  for (let row = 0; row < Math.min(data.length, 20); row++) {
    for (let col = 0; col < Math.min((data[row] || []).length, 25); col++) {
      const cell = data[row] && data[row][col];
      if (cell) {
        const cellStr = cell.toString().trim();
        console.log(`🔍 Checking cell [${row}][${col}]: "${cellStr}"`);
        
        // Look for "Nama" keyword (case insensitive)
        if (cellStr.toLowerCase().includes('nama')) {
          console.log(`✅ Found "Nama" keyword at [${row}][${col}]`);
          
          // Check adjacent cells for the actual name - expanded search
          const adjacentCells = [
            { r: row, c: col + 1 }, // right
            { r: row + 1, c: col }, // below
            { r: row, c: col + 2 }, // 2 columns right
            { r: row + 1, c: col + 1 }, // diagonal down-right
            { r: row, c: col + 3 }, // 3 columns right
            { r: row + 2, c: col }, // 2 rows below
            { r: row - 1, c: col + 1 }, // diagonal up-right
            { r: row + 1, c: col - 1 } // diagonal down-left
          ];
          
          for (const adj of adjacentCells) {
            if (adj.r >= data.length || adj.c >= (data[adj.r] || []).length) continue;
            
            const adjCell = data[adj.r] && data[adj.r][adj.c];
            if (adjCell && adjCell.toString().trim()) {
              const adjStr = adjCell.toString().trim();
              console.log(`🔍 Checking adjacent cell [${adj.r}][${adj.c}]: "${adjStr}"`);
              
              // Enhanced name validation - accept shorter names and more patterns
              if (!adjStr.toLowerCase().includes('nama') && 
                  !adjStr.toLowerCase().includes('dept') &&
                  !adjStr.toLowerCase().includes('office') &&
                  !adjStr.toLowerCase().includes('rnd') &&
                  !adjStr.toLowerCase().includes('departemen') &&
                  !adjStr.toLowerCase().includes('tanggal') &&
                  !adjStr.toLowerCase().includes('hari') &&
                  !adjStr.toLowerCase().includes('no') &&
                  !adjStr.toLowerCase().includes('tgl') &&
                  !adjStr.toLowerCase().includes('jam') &&
                  !adjStr.toLowerCase().includes('masuk') &&
                  !adjStr.toLowerCase().includes('pulang') &&
                  !adjStr.toLowerCase().includes('kerja') &&
                  !adjStr.toLowerCase().includes('absen') &&
                  adjStr.length >= 2 && adjStr.length < 50 &&
                  // Accept names with letters, spaces, and some special characters
                  adjStr.match(/^[a-zA-Z\s\-\.]+$/)) {
                nama = adjStr.toLowerCase(); // Convert to lowercase as per requirement
                console.log(`✅ Found employee name: ${nama}`);
                break;
              }
            }
          }
          
          if (nama) break;
        }
        
        // Look for department patterns - more flexible search
        if (cellStr.toLowerCase().includes('dept') || 
            cellStr.toLowerCase().includes('departemen') ||
            cellStr.toLowerCase().includes('divisi') ||
            cellStr.toLowerCase().includes('bagian') ||
            cellStr.toLowerCase().includes('unit')) {
          console.log(`✅ Found department keyword at [${row}][${col}]`);
          
          // Check adjacent cells for department value - expanded search
          const adjacentCells = [
            { r: row, c: col + 1 }, // right
            { r: row + 1, c: col }, // below
            { r: row, c: col + 2 }, // 2 columns right
            { r: row + 1, c: col + 1 }, // diagonal
            { r: row, c: col - 1 }, // left
            { r: row - 1, c: col }, // above
            { r: row, c: col + 3 }, // 3 columns right
            { r: row + 2, c: col } // 2 rows below
          ];
          
          for (const adj of adjacentCells) {
            if (adj.r >= data.length || adj.c >= (data[adj.r] || []).length) continue;
            
            const adjCell = data[adj.r] && data[adj.r][adj.c];
            if (adjCell) {
              const adjStr = adjCell.toString().toUpperCase().trim();
              console.log(`🔍 Checking department value: "${adjStr}"`);
              if (adjStr.includes('RND') || adjStr.includes('R&D') || adjStr.includes('R & D')) {
                departemen = 'RND';
                console.log(`✅ Department: RND found`);
                break;
              } else if (adjStr.includes('OFFICE') || adjStr.includes('KANTOR') || adjStr.includes('ADMIN')) {
                departemen = 'OFFICE';
                console.log(`✅ Department: OFFICE found`);
                break;
              }
            }
          }
        }
      }
    }
    
    if (nama && departemen) break;
  }
  
  // Alternative approach: scan entire sheet for potential names if not found with "Nama" keyword
  if (!nama) {
    console.log('❌ No employee name found with "Nama" keyword, trying comprehensive scan...');
    
    for (let row = 0; row < Math.min(data.length, 15); row++) {
      for (let col = 0; col < Math.min((data[row] || []).length, 20); col++) {
        const cell = data[row] && data[row][col];
        if (cell) {
          const cellStr = cell.toString().trim();
          
          // Look for potential names - more inclusive criteria
          if (cellStr.length >= 3 && 
              cellStr.length <= 25 && 
              cellStr.match(/^[a-zA-Z\s\-\.]+$/) &&
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
              !cellStr.toLowerCase().includes('divisi') &&
              !cellStr.toLowerCase().includes('total') &&
              !cellStr.toLowerCase().includes('standar') &&
              !cellStr.toLowerCase().includes('aktual') &&
              !cellStr.toLowerCase().includes('kali') &&
              !cellStr.toLowerCase().includes('mnt') &&
              !cellStr.toLowerCase().includes('hadir') &&
              !cellStr.toLowerCase().includes('rekap') &&
              // Check if it's not a number or date
              !cellStr.match(/^\d+$/) &&
              !cellStr.match(/^\d{2,4}\/\d{1,2}\/\d{1,2}/) &&
              !cellStr.match(/^\d{1,2}:\d{2}/)) {
            
            nama = cellStr.toLowerCase(); // Convert to lowercase as per requirement
            console.log(`✅ Found potential employee name: ${nama} at [${row}][${col}]`);
            break;
          }
        }
      }
      
      if (nama) break;
    }
  }
  
  // Alternative department search - scan for standalone RND/Office patterns
  if (!departemen) {
    console.log('❌ No department found with keyword, scanning for RND/Office patterns...');
    
    for (let row = 0; row < Math.min(data.length, 20); row++) {
      for (let col = 0; col < Math.min((data[row] || []).length, 25); col++) {
        const cell = data[row] && data[row][col];
        if (cell) {
          const cellStr = cell.toString().toUpperCase().trim();
          if (cellStr === 'RND' || cellStr === 'R&D' || cellStr === 'R & D') {
            departemen = 'RND';
            console.log(`✅ Found department: RND at [${row}][${col}]`);
            break;
          } else if (cellStr === 'OFFICE' || cellStr === 'KANTOR' || cellStr === 'ADMIN') {
            departemen = 'OFFICE';
            console.log(`✅ Found department: OFFICE at [${row}][${col}]`);
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
