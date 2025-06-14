
export const findEmployeeInfo = (data: any[][]): { nama: string; status: string } | null => {
  let nama = '';
  let status = 'karyawan'; // default
  
  console.log('Looking for employee info in sheet...');
  
  // Look for "Nama:" pattern in first 20 rows
  for (let row = 0; row < Math.min(data.length, 20); row++) {
    for (let col = 0; col < Math.min((data[row] || []).length, 10); col++) {
      const cell = data[row] && data[row][col];
      if (cell) {
        const cellStr = cell.toString().trim();
        
        // Look for nama pattern
        if (cellStr.toLowerCase().includes('nama') && cellStr.includes(':')) {
          // Extract name from "Nama: neila" format
          const nameMatch = cellStr.match(/nama\s*:\s*(.+)/i);
          if (nameMatch && nameMatch[1].trim()) {
            nama = nameMatch[1].trim();
            console.log(`Found employee name: ${nama}`);
          }
        }
        
        // Look for departemen pattern
        if (cellStr.toLowerCase().includes('dept') || cellStr.toLowerCase().includes('departemen')) {
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
  }
  
  if (!nama) {
    console.log('No employee name found in sheet');
    return null;
  }
  
  console.log(`Final employee info: ${nama} with status: ${status}`);
  return { nama, status };
};
