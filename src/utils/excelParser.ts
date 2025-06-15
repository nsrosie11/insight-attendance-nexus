
import * as XLSX from 'xlsx';
import { ExcelData } from '@/types/excel';
import { shouldProcessSheet } from './excel/sheetValidator';
import { parseSheetData } from './excel/sheetDataParser';

export const parseExcelData = (workbook: XLSX.WorkBook, selectedMonth: number, selectedYear: number): ExcelData[] => {
  const allParsedData: ExcelData[] = [];
  
  console.log('📊 Available sheets:', workbook.SheetNames);
  
  // Filter and process only numeric sheets starting from 14.15.17
  const sheetsToProcess = workbook.SheetNames.filter(sheetName => 
    shouldProcessSheet(sheetName, workbook.SheetNames)
  );
  
  console.log('✅ Sheets to process:', sheetsToProcess);
  
  if (sheetsToProcess.length === 0) {
    throw new Error('Tidak ditemukan sheet dengan nama angka yang valid (mulai dari 14.15.17)');
  }
  
  for (const sheetName of sheetsToProcess) {
    try {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) {
        console.log(`❌ Sheet ${sheetName} not found in workbook`);
        continue;
      }
      
      console.log(`\n🔍 ========== Processing sheet: ${sheetName} ==========`);
      
      // Try multiple parsing methods to handle different Excel formats
      let data: any[][] = [];
      
      // Method 1: Standard parsing with header: 1
      try {
        data = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' }) as any[][];
        console.log(`📊 Method 1 - Standard parsing: ${data.length} rows x ${(data[0] || []).length} columns`);
      } catch (error) {
        console.log('❌ Method 1 failed:', error);
      }
      
      // Method 2: If data is too narrow, try different parsing options
      if (data.length === 0 || (data[0] && data[0].length < 5)) {
        try {
          data = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null }) as any[][];
          console.log(`📊 Method 2 - Raw parsing: ${data.length} rows x ${(data[0] || []).length} columns`);
        } catch (error) {
          console.log('❌ Method 2 failed:', error);
        }
      }
      
      // Method 3: Try parsing without defval
      if (data.length === 0 || (data[0] && data[0].length < 5)) {
        try {
          data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
          console.log(`📊 Method 3 - Basic parsing: ${data.length} rows x ${(data[0] || []).length} columns`);
        } catch (error) {
          console.log('❌ Method 3 failed:', error);
        }
      }
      
      // Method 4: Direct sheet range parsing
      if (data.length === 0 || (data[0] && data[0].length < 5)) {
        try {
          const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:Z50');
          console.log(`📊 Sheet range: ${sheet['!ref']}, decoded:`, range);
          
          // Parse manually from the range
          const manualData: any[][] = [];
          for (let row = range.s.r; row <= Math.min(range.e.r, 50); row++) {
            const rowData: any[] = [];
            for (let col = range.s.c; col <= Math.min(range.e.c, 25); col++) {
              const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
              const cell = sheet[cellAddress];
              rowData.push(cell ? (cell.w || cell.v || '') : '');
            }
            manualData.push(rowData);
          }
          data = manualData;
          console.log(`📊 Method 4 - Manual parsing: ${data.length} rows x ${(data[0] || []).length} columns`);
        } catch (error) {
          console.log('❌ Method 4 failed:', error);
        }
      }
      
      // Show sample of parsed data
      console.log('\n=== 📋 PARSED DATA SAMPLE ===');
      for (let row = 0; row < Math.min(10, data.length); row++) {
        const rowData = data[row] || [];
        if (rowData.length > 0) {
          const cellsInfo = [];
          for (let col = 0; col < Math.min(20, rowData.length); col++) {
            const cell = rowData[col];
            if (cell && cell.toString().trim()) {
              cellsInfo.push(`[${col}]:"${cell.toString().trim()}"`);
            }
          }
          if (cellsInfo.length > 0) {
            console.log(`Row ${row.toString().padStart(2, '0')}: ${cellsInfo.join(', ')}`);
          }
        }
      }
      
      if (data.length === 0) {
        console.log(`❌ No data found in sheet ${sheetName}`);
        continue;
      }
      
      if (data[0] && data[0].length < 5) {
        console.log(`⚠️ Sheet ${sheetName} has very few columns (${data[0].length}), might be incorrectly parsed`);
      }
      
      const sheetData = parseSheetData(data, sheetName, selectedMonth, selectedYear);
      allParsedData.push(...sheetData);
      
    } catch (error) {
      console.error(`❌ Error parsing sheet ${sheetName}:`, error);
      continue;
    }
  }
  
  if (allParsedData.length === 0) {
    throw new Error('Tidak ada data valid yang ditemukan dalam sheet yang diproses. Pastikan format Excel sesuai dengan struktur yang diharapkan.');
  }
  
  console.log(`\n🎉 Total parsed data: ${allParsedData.length} records`);
  return allParsedData;
};

// Re-export parseTime for backward compatibility
export { parseTime } from './excel/timeParser';
