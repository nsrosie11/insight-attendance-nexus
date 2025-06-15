
export const findEmployeeInfo = (data: any[][]): { nama: string; status: string } | null => {
  let nama = '';
  let departemen = '';
  
  console.log('Looking for employee info in sheet...');
  console.log('First 10 rows of data:', data.slice(0, 10));
  
  // Look for nama pattern in first 10 rows and first 15 columns
  for (let row = 0; row < Math.min(data.length, 10); row++) {
    for (let col = 0; col < Math.min((data[row] || []).length, 15); col++) {
      const cell = data[row] && data[row][col];
      if (cell) {
        const cellStr = cell.toString().trim();
        console.log(`Checking cell [${row}][${col}]: "${cellStr}"`);
        
        // Look for "Nama" keyword
        if (cellStr.toLowerCase() === 'nama') {
          console.log(`Found "Nama" keyword at [${row}][${col}]`);
          
          // Check adjacent cells for the actual name
          const adjacentCells = [
            { r: row, c: col + 1 }, // right
            { r: row + 1, c: col }, // below
            { r: row, c: col + 2 }, // 2 columns right
            { r: row + 1, c: col + 1 } // diagonal
          ];
          
          for (const adj of adjacentCells) {
            const adjCell = data[adj.r] && data[adj.r][adj.c];
            if (adjCell && adjCell.toString().trim()) {
              const adjStr = adjCell.toString().trim();
              console.log(`Checking adjacent cell [${adj.r}][${adj.c}]: "${adjStr}"`);
              
              // Skip if it's a header or common keywords
              if (!adjStr.toLowerCase().includes('nama') && 
                  !adjStr.toLowerCase().includes('dept') &&
                  !adjStr.toLowerCase().includes('office') &&
                  !adjStr.toLowerCase().includes('rnd') &&
                  adjStr.length > 2 && adjStr.length < 30 &&
                  adjStr.match(/^[a-zA-Z\s]+$/)) {
                nama = adjStr.toLowerCase(); // Convert to lowercase for consistency
                console.log(`Found employee name: ${nama}`);
                break;
              }
            }
          }
          
          if (nama) break;
        }
        
        // Look for department
        if (cellStr.toLowerCase().includes('dept') || cellStr.toLowerCase() === 'departemen') {
          console.log(`Found department keyword at [${row}][${col}]`);
          
          // Check adjacent cells for department value
          const adjacentCells = [
            data[row] && data[row][col + 1] && data[row][col + 1].toString(),
            data[row + 1] && data[row + 1][col] && data[row + 1][col].toString(),
            data[row] && data[row][col + 2] && data[row][col + 2].toString()
          ];
          
          for (const adjCell of adjacentCells) {
            if (adjCell) {
              const adjStr = adjCell.toUpperCase().trim();
              console.log(`Checking department value: "${adjStr}"`);
              if (adjStr.includes('RND')) {
                departemen = 'RND';
                console.log(`Department: RND found`);
                break;
              } else if (adjStr.includes('OFFICE')) {
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
  
  if (!nama) {
    console.log('No employee name found, trying alternative approach...');
    
    // Alternative: look for names in specific positions
    for (let row = 0; row < Math.min(data.length, 8); row++) {
      for (let col = 8; col < Math.min((data[row] || []).length, 15); col++) {
        const cell = data[row] && data[row][col];
        if (cell) {
          const cellStr = cell.toString().trim();
          
          // Look for potential names (letters only, reasonable length)
          if (cellStr.length > 2 && 
              cellStr.length < 20 && 
              cellStr.match(/^[a-zA-Z\s]+$/) &&
              !cellStr.toLowerCase().includes('nama') &&
              !cellStr.toLowerCase().includes('dept') &&
              !cellStr.toLowerCase().includes('office') &&
              !cellStr.toLowerCase().includes('rnd') &&
              !cellStr.toLowerCase().includes('tanggal') &&
              !cellStr.toLowerCase().includes('no')) {
            
            nama = cellStr.toLowerCase();
            console.log(`Found potential employee name: ${nama} at [${row}][${col}]`);
            break;
          }
        }
      }
      
      if (nama) break;
    }
  }
  
  if (!nama) {
    console.log('No employee name found in sheet');
    return null;
  }
  
  // Convert department to status
  let status = 'Karyawan'; // default
  if (departemen === 'RND') {
    status = 'Magang';
  } else if (departemen === 'OFFICE') {
    status = 'Karyawan';
  }
  
  console.log(`Final employee info: ${nama} with department: ${departemen} -> status: ${status}`);
  return { nama, status };
};
