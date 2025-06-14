
export const findEmployeeInfo = (data: any[][]): { nama: string; status: string } | null => {
  let nama = '';
  let status = 'karyawan'; // default
  
  console.log('Looking for employee info in sheet...');
  console.log('First 10 rows of data:', data.slice(0, 10));
  
  // Look for nama pattern in first 20 rows
  for (let row = 0; row < Math.min(data.length, 20); row++) {
    for (let col = 0; col < Math.min((data[row] || []).length, 10); col++) {
      const cell = data[row] && data[row][col];
      if (cell) {
        const cellStr = cell.toString().trim();
        console.log(`Checking cell [${row}][${col}]: "${cellStr}"`);
        
        // Look for nama pattern - more flexible matching
        if (cellStr.toLowerCase().includes('nama')) {
          console.log(`Found "nama" in cell [${row}][${col}]: "${cellStr}"`);
          
          // Try different patterns for name extraction
          let nameMatch;
          
          // Pattern 1: "Nama: neila" format
          nameMatch = cellStr.match(/nama\s*:\s*(.+)/i);
          if (nameMatch && nameMatch[1].trim()) {
            nama = nameMatch[1].trim();
            console.log(`Found employee name (pattern 1): ${nama}`);
          } else {
            // Pattern 2: Check adjacent cells
            const adjacentCells = [
              data[row] && data[row][col + 1] && data[row][col + 1].toString(), // right
              data[row + 1] && data[row + 1][col] && data[row + 1][col].toString(), // below
              data[row + 1] && data[row + 1][col + 1] && data[row + 1][col + 1].toString() // diagonal
            ];
            
            for (const adjCell of adjacentCells) {
              if (adjCell && adjCell.trim() && !adjCell.toLowerCase().includes('nama')) {
                nama = adjCell.trim();
                console.log(`Found employee name (adjacent cell): ${nama}`);
                break;
              }
            }
          }
          
          // If we found a name, break out of the inner loop
          if (nama) break;
        }
        
        // Look for departemen pattern
        if (cellStr.toLowerCase().includes('dept') || cellStr.toLowerCase().includes('departemen')) {
          console.log(`Found department keyword in cell [${row}][${col}]: "${cellStr}"`);
          
          // Look for department value in adjacent cells or same cell
          const adjacentCells = [
            cellStr, // same cell
            data[row] && data[row][col + 1] && data[row][col + 1].toString(), // right
            data[row + 1] && data[row + 1][col] && data[row + 1][col].toString(), // below
            data[row + 1] && data[row + 1][col + 1] && data[row + 1][col + 1].toString() // diagonal
          ];
          
          for (const adjCell of adjacentCells) {
            if (adjCell) {
              const adjStr = adjCell.toUpperCase().trim();
              console.log(`Checking department adjacent cell: "${adjStr}"`);
              if (adjStr.includes('RND')) {
                status = 'magang';
                console.log(`Found department: RND - status set to magang`);
                break;
              } else if (adjStr.includes('OFFICE')) {
                status = 'karyawan';
                console.log(`Found department: OFFICE - status set to karyawan`);
                break;
              }
            }
          }
        }
      }
    }
    
    // If we found a name, break out of the outer loop
    if (nama) break;
  }
  
  // If still no name found, try looking for any text that could be a name
  if (!nama) {
    console.log('No name found with "nama" keyword, looking for potential names...');
    
    for (let row = 0; row < Math.min(data.length, 15); row++) {
      for (let col = 0; col < Math.min((data[row] || []).length, 8); col++) {
        const cell = data[row] && data[row][col];
        if (cell) {
          const cellStr = cell.toString().trim();
          
          // Look for cells that might contain names (non-empty, not numbers, not common keywords)
          if (cellStr.length > 2 && 
              cellStr.length < 30 && 
              !cellStr.match(/^\d+$/) && // not just numbers
              !cellStr.toLowerCase().includes('nama') &&
              !cellStr.toLowerCase().includes('dept') &&
              !cellStr.toLowerCase().includes('office') &&
              !cellStr.toLowerCase().includes('rnd') &&
              !cellStr.toLowerCase().includes('jam') &&
              !cellStr.toLowerCase().includes('tabel') &&
              !cellStr.toLowerCase().includes('kehadiran') &&
              !cellStr.match(/^\d{1,2}\s*[a-z]{2}$/i) && // not date format like "01 Ka"
              cellStr.match(/^[a-zA-Z\s]+$/)) { // only letters and spaces
            
            nama = cellStr;
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
  
  console.log(`Final employee info: ${nama} with status: ${status}`);
  return { nama, status };
};
