
import * as XLSX from 'xlsx';
import { ExcelData, EmployeeInfo } from '@/types/excel';

export const parseTime = (timeStr: string): string | null => {
  if (!timeStr) return null;
  
  // Bersihkan string dari karakter yang tidak perlu
  const cleanTimeStr = timeStr.toString().trim();
  
  // Handle format HH:MM atau HH:MM:SS
  const timeMatch = cleanTimeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (timeMatch) {
    const hours = timeMatch[1].padStart(2, '0');
    const minutes = timeMatch[2];
    const seconds = timeMatch[3] || '00';
    return `${hours}:${minutes}:${seconds}`;
  }
  
  // Handle format jam biasa (misal: 8, 9, 10)
  const hourMatch = cleanTimeStr.match(/^\d{1,2}$/);
  if (hourMatch) {
    const hour = hourMatch[0].padStart(2, '0');
    return `${hour}:00:00`;
  }
  
  return null;
};

const isNumericSheetName = (sheetName: string): boolean => {
  // Check if sheet name contains only numbers and dots (like 14.15.17)
  return /^[\d.]+$/.test(sheetName);
};

const shouldProcessSheet = (sheetName: string, allSheetNames: string[]): boolean => {
  // Skip if not numeric sheet name
  if (!isNumericSheetName(sheetName)) {
    return false;
  }
  
  // Find index of sheet 14.15.17
  const startSheetIndex = allSheetNames.findIndex(name => name === '14.15.17');
  const currentSheetIndex = allSheetNames.indexOf(sheetName);
  
  // If 14.15.17 exists, process from that sheet onwards
  if (startSheetIndex !== -1) {
    return currentSheetIndex >= startSheetIndex;
  }
  
  // If 14.15.17 doesn't exist, process all numeric sheets
  return true;
};

const findEmployeesInSheet = (data: any[][]): EmployeeInfo[] => {
  const employees: EmployeeInfo[] = [];
  
  console.log('Looking for employees in sheet data...');
  
  // Look for "Nama" pattern to find employee names
  for (let row = 0; row < data.length; row++) {
    for (let col = 0; col < (data[row] || []).length; col++) {
      const cell = data[row] && data[row][col];
      if (cell && cell.toString().toLowerCase().includes('nama')) {
        // Look for name in the next column
        const nameCell = data[row] && data[row][col + 1];
        if (nameCell && nameCell.toString().trim()) {
          const nama = nameCell.toString().trim();
          
          // Look for department (Dept) information nearby
          let status = 'Karyawan'; // default
          
          // Search in surrounding area for "Dept" keyword
          for (let searchRow = Math.max(0, row - 3); searchRow <= Math.min(data.length - 1, row + 3); searchRow++) {
            for (let searchCol = Math.max(0, col - 2); searchCol <= Math.min((data[searchRow] || []).length - 1, col + 4); searchCol++) {
              const searchCell = data[searchRow] && data[searchRow][searchCol];
              if (searchCell && searchCell.toString().toLowerCase().includes('dept')) {
                // Look for department value in adjacent cells
                const deptValueCells = [
                  data[searchRow] && data[searchRow][searchCol + 1], // right
                  data[searchRow + 1] && data[searchRow + 1][searchCol], // below
                  data[searchRow + 1] && data[searchRow + 1][searchCol + 1] // diagonal
                ];
                
                for (const deptCell of deptValueCells) {
                  if (deptCell) {
                    const deptStr = deptCell.toString().toUpperCase().trim();
                    console.log(`Found dept value: "${deptStr}" for ${nama}`);
                    if (deptStr.includes('RND')) {
                      status = 'Magang';
                      break;
                    } else if (deptStr.includes('OFFICE')) {
                      status = 'Karyawan';
                      break;
                    }
                  }
                }
                if (status !== 'Karyawan') break;
              }
            }
            if (status !== 'Karyawan') break;
          }
          
          console.log(`Found employee: ${nama} with status: ${status}`);
          employees.push({ nama, dept: status, rowIndex: row });
        }
      }
    }
  }
  
  return employees;
};

const findDateRowAndColumns = (data: any[][]): { dateRow: number; dateColumns: Array<{ col: number; day: number }> } => {
  let dateRow = -1;
  const dateColumns: Array<{ col: number; day: number }> = [];
  
  console.log('Looking for date row...');
  
  // Find date row (look for patterns like "01 Ka", "02 Ju", etc.)
  for (let row = 0; row < data.length; row++) {
    let foundDatesInRow = 0;
    const tempDateColumns: Array<{ col: number; day: number }> = [];
    
    for (let col = 0; col < (data[row] || []).length; col++) {
      const cell = data[row] && data[row][col];
      if (cell) {
        const cellStr = cell.toString().trim();
        // Look for date pattern like "01 Ka", "02 Ju", etc.
        const dayMatch = cellStr.match(/^(\d{1,2})\s*[A-Za-z]{2}/);
        if (dayMatch) {
          const day = parseInt(dayMatch[1]);
          tempDateColumns.push({ col, day });
          foundDatesInRow++;
        }
      }
    }
    
    // If we found multiple dates in this row, it's probably the date row
    if (foundDatesInRow >= 2) {
      dateRow = row;
      dateColumns.push(...tempDateColumns);
      console.log(`Found date row at ${row} with ${foundDatesInRow} dates`);
      break;
    }
  }
  
  return { dateRow, dateColumns };
};

const findTimeRows = (data: any[][], startRow: number): { jamMasukRow: number; jamPulangRow: number } => {
  let jamMasukRow = -1;
  let jamPulangRow = -1;
  
  console.log('Looking for time rows starting from row', startRow);
  
  // Look for "Jam Kerja 1" and "Jam Kerja 2" rows
  for (let row = startRow; row < Math.min(data.length, startRow + 10); row++) {
    for (let col = 0; col < (data[row] || []).length; col++) {
      const cell = data[row] && data[row][col];
      if (cell) {
        const cellStr = cell.toString().toLowerCase();
        if (cellStr.includes('jam kerja 1') && cellStr.includes('masuk')) {
          jamMasukRow = row;
          console.log(`Found jam masuk row at ${row}`);
        } else if (cellStr.includes('jam kerja 2') && cellStr.includes('masuk')) {
          jamPulangRow = row;
          console.log(`Found jam pulang row at ${row}`);
        }
      }
    }
  }
  
  return { jamMasukRow, jamPulangRow };
};

const parseSheetData = (data: any[][], sheetName: string): ExcelData[] => {
  const parsedData: ExcelData[] = [];
  
  console.log(`Processing sheet: ${sheetName}`);
  
  // Find employees
  const employees = findEmployeesInSheet(data);
  
  if (employees.length === 0) {
    console.log(`No employees found in sheet ${sheetName}`);
    return parsedData;
  }
  
  // Find date row and columns
  const { dateRow, dateColumns } = findDateRowAndColumns(data);
  
  if (dateRow === -1 || dateColumns.length === 0) {
    console.log(`No date row found in sheet ${sheetName}`);
    return parsedData;
  }
  
  // Find time rows
  const { jamMasukRow, jamPulangRow } = findTimeRows(data, dateRow + 1);
  
  console.log(`Time rows - Masuk: ${jamMasukRow}, Pulang: ${jamPulangRow}`);
  
  // Process each date and employee combination
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  for (const { col, day } of dateColumns) {
    const tanggal = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    console.log(`Processing date ${tanggal} in column ${col}`);
    
    for (const employee of employees) {
      let jamMasuk: string | null = null;
      let jamPulang: string | null = null;
      
      // Get jam masuk from the jam masuk row
      if (jamMasukRow !== -1) {
        const jamMasukCell = data[jamMasukRow] && data[jamMasukRow][col];
        if (jamMasukCell && jamMasukCell.toString().trim()) {
          jamMasuk = parseTime(jamMasukCell.toString().trim());
        }
      }
      
      // Get jam pulang from the jam pulang row
      if (jamPulangRow !== -1) {
        const jamPulangCell = data[jamPulangRow] && data[jamPulangRow][col];
        if (jamPulangCell && jamPulangCell.toString().trim()) {
          jamPulang = parseTime(jamPulangCell.toString().trim());
        }
      }
      
      // Calculate status
      const terlambat = jamMasuk ? jamMasuk > '10:00:00' : false;
      const pulang_tercatat = jamPulang ? 
        (jamPulang >= '15:00:00' && jamPulang <= '17:00:00') : false;
      
      const formattedData: ExcelData = {
        nama: employee.nama,
        status: employee.dept, // Use the department status directly
        tanggal,
        jam_masuk: jamMasuk,
        jam_pulang: jamPulang,
        terlambat,
        pulang_tercatat
      };
      
      console.log(`Data for ${employee.nama} on ${tanggal}:`, formattedData);
      parsedData.push(formattedData);
    }
  }
  
  return parsedData;
};

export const parseExcelData = (workbook: XLSX.WorkBook): ExcelData[] => {
  const allParsedData: ExcelData[] = [];
  
  console.log('Available sheets:', workbook.SheetNames);
  
  // Filter and process only numeric sheets starting from 14.15.17
  const sheetsToProcess = workbook.SheetNames.filter(sheetName => 
    shouldProcessSheet(sheetName, workbook.SheetNames)
  );
  
  console.log('Sheets to process:', sheetsToProcess);
  
  if (sheetsToProcess.length === 0) {
    throw new Error('Tidak ditemukan sheet dengan nama angka yang valid (mulai dari 14.15.17)');
  }
  
  for (const sheetName of sheetsToProcess) {
    try {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;
      
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      const sheetData = parseSheetData(data, sheetName);
      
      allParsedData.push(...sheetData);
      
    } catch (error) {
      console.log(`Error parsing sheet ${sheetName}:`, error);
      continue;
    }
  }
  
  if (allParsedData.length === 0) {
    throw new Error('Tidak ada data valid yang ditemukan dalam sheet yang diproses');
  }
  
  console.log('Total parsed data:', allParsedData);
  return allParsedData;
};
