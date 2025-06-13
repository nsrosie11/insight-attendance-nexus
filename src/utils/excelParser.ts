
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

const findDataInSheet = (data: any[][], searchText: string): { row: number; col: number } | null => {
  for (let row = 0; row < data.length; row++) {
    for (let col = 0; col < (data[row] || []).length; col++) {
      const cell = data[row] && data[row][col];
      if (cell && cell.toString().toLowerCase().includes(searchText.toLowerCase())) {
        return { row, col };
      }
    }
  }
  return null;
};

const parseSheetData = (data: any[][], sheetName: string): ExcelData[] => {
  const parsedData: ExcelData[] = [];
  
  console.log(`Processing sheet: ${sheetName}`);
  console.log('Sheet data:', data);
  
  // Find employee info
  const employees: EmployeeInfo[] = [];
  
  // Look for "Nama" and "Departemen" in the sheet
  for (let row = 0; row < data.length; row++) {
    for (let col = 0; col < (data[row] || []).length; col++) {
      const cell = data[row] && data[row][col];
      if (cell && cell.toString().toLowerCase().includes('nama')) {
        // Look for name in adjacent cells
        const nameCell = data[row] && data[row][col + 1];
        if (nameCell && nameCell.toString().trim()) {
          const nama = nameCell.toString().trim();
          
          // Look for department info nearby
          let dept = 'Karyawan'; // default
          for (let searchRow = Math.max(0, row - 2); searchRow <= Math.min(data.length - 1, row + 2); searchRow++) {
            for (let searchCol = Math.max(0, col - 2); searchCol <= Math.min((data[searchRow] || []).length - 1, col + 2); searchCol++) {
              const deptCell = data[searchRow] && data[searchRow][searchCol];
              if (deptCell) {
                const deptStr = deptCell.toString().toUpperCase();
                if (deptStr.includes('RND')) {
                  dept = 'Magang';
                  break;
                } else if (deptStr.includes('OFFICE')) {
                  dept = 'Karyawan';
                  break;
                }
              }
            }
          }
          
          employees.push({ nama, dept, rowIndex: row });
        }
      }
    }
  }
  
  console.log(`Found employees in ${sheetName}:`, employees);
  
  if (employees.length === 0) {
    console.log(`No employees found in sheet ${sheetName}`);
    return parsedData;
  }
  
  // Find date headers and time data
  const jamKerja1Pos = findDataInSheet(data, 'Jam Kerja 1');
  const jamKerja2Pos = findDataInSheet(data, 'Jam Kerja 2');
  
  console.log(`Jam Kerja positions in ${sheetName}:`, { jamKerja1Pos, jamKerja2Pos });
  
  // Find date row (look for patterns like "01 Ka", "02 Ju", etc.)
  let dateRow = -1;
  let dateStartCol = -1;
  
  for (let row = 0; row < data.length; row++) {
    for (let col = 0; col < (data[row] || []).length; col++) {
      const cell = data[row] && data[row][col];
      if (cell) {
        const cellStr = cell.toString().trim();
        // Look for date pattern like "01 Ka", "02 Ju", etc.
        if (/^\d{1,2}\s*[A-Za-z]{2}/.test(cellStr)) {
          dateRow = row;
          dateStartCol = col;
          break;
        }
      }
    }
    if (dateRow !== -1) break;
  }
  
  console.log(`Date row in ${sheetName}:`, dateRow, 'starting at col:', dateStartCol);
  
  if (dateRow === -1) {
    console.log(`No date row found in sheet ${sheetName}`);
    return parsedData;
  }
  
  // Process each date column
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  for (let col = dateStartCol; col < (data[dateRow] || []).length; col++) {
    const dateCell = data[dateRow] && data[dateRow][col];
    if (!dateCell || dateCell.toString().trim() === '') continue;
    
    const dateCellStr = dateCell.toString().trim();
    
    // Parse date from format like "01 Ka", "02 Ju"
    const dayMatch = dateCellStr.match(/^(\d{1,2})/);
    if (!dayMatch) continue;
    
    const day = parseInt(dayMatch[1]);
    const tanggal = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    console.log(`Processing date ${tanggal} from cell ${dateCellStr} in column ${col}`);
    
    // For each employee, find their attendance data for this date
    for (const employee of employees) {
      let jamMasuk: string | null = null;
      let jamPulang: string | null = null;
      
      // Look for time data in rows below the date
      for (let timeRow = dateRow + 1; timeRow < data.length; timeRow++) {
        const timeCell = data[timeRow] && data[timeRow][col];
        if (timeCell && timeCell.toString().trim() !== '') {
          const timeCellStr = timeCell.toString().trim();
          
          // Check if this row contains "Jam Kerja 1" or "Jam Kerja 2" indicator
          const rowLabel = data[timeRow] && data[timeRow][0] ? data[timeRow][0].toString() : '';
          
          if (rowLabel.toLowerCase().includes('jam kerja 1') || 
              rowLabel.toLowerCase().includes('masuk')) {
            jamMasuk = parseTime(timeCellStr);
          } else if (rowLabel.toLowerCase().includes('jam kerja 2') || 
                     rowLabel.toLowerCase().includes('pulang')) {
            jamPulang = parseTime(timeCellStr);
          } else {
            // If no clear label, try to parse as time and assign based on pattern
            const parsedTime = parseTime(timeCellStr);
            if (parsedTime) {
              if (!jamMasuk) {
                jamMasuk = parsedTime;
              } else if (!jamPulang) {
                jamPulang = parsedTime;
              }
            }
          }
        }
      }
      
      // Calculate status
      const terlambat = jamMasuk ? jamMasuk > '10:00:00' : false;
      const pulang_tercatat = jamPulang ? 
        (jamPulang >= '15:00:00' && jamPulang <= '17:00:00') : false;
      
      const formattedData: ExcelData = {
        nama: employee.nama,
        status: employee.dept,
        tanggal,
        jam_masuk: jamMasuk,
        jam_pulang: jamPulang,
        terlambat,
        pulang_tercatat
      };
      
      console.log(`Data for ${employee.nama} on ${tanggal} in ${sheetName}:`, formattedData);
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
