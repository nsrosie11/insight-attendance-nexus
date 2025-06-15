
import * as XLSX from 'xlsx';
import { ExcelData } from '@/types/excel';
import { shouldProcessSheet } from './excel/sheetValidator';
import { parseFlexibleAttendance } from './excel/flexibleAttendanceParser';

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
      
      // Parse sheet data
      let data: any[][] = [];
      try {
        data = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' }) as any[][];
        console.log(`📊 Parsed ${data.length} rows x ${(data[0] || []).length} columns`);
      } catch (error) {
        console.log('❌ Failed to parse sheet:', error);
        continue;
      }
      
      // Show sample of parsed data
      console.log('\n=== 📋 PARSED DATA SAMPLE ===');
      for (let row = 0; row < Math.min(5, data.length); row++) {
        const rowData = data[row] || [];
        if (rowData.length > 0) {
          const cellsInfo = [];
          for (let col = 0; col < Math.min(15, rowData.length); col++) {
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
      
      // Use flexible parser
      const sheetData = parseFlexibleAttendance(data, sheetName, selectedMonth, selectedYear);
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
