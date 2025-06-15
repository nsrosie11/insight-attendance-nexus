
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
      
      // Parse sheet data with multiple methods for robustness
      let data: any[][] = [];
      try {
        // Method 1: Standard parsing
        data = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' }) as any[][];
        console.log(`📊 Method 1: Parsed ${data.length} rows`);
      } catch (error) {
        console.log('❌ Method 1 failed, trying alternative parsing:', error);
        try {
          // Method 2: Raw parsing
          data = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '' }) as any[][];
          console.log(`📊 Method 2: Parsed ${data.length} rows`);
        } catch (error2) {
          console.log('❌ Method 2 also failed:', error2);
          continue;
        }
      }
      
      // Ensure we have meaningful data
      if (data.length === 0) {
        console.log(`❌ No data found in sheet ${sheetName}`);
        continue;
      }
      
      // Filter out completely empty rows
      data = data.filter(row => row && row.some(cell => cell && cell.toString().trim() !== ''));
      
      console.log(`📊 After filtering empty rows: ${data.length} rows`);
      
      // Show sample of parsed data for debugging
      console.log('\n=== 📋 PARSED DATA SAMPLE ===');
      for (let row = 0; row < Math.min(8, data.length); row++) {
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
      
      if (data.length < 3) {
        console.log(`❌ Sheet ${sheetName} has insufficient data (${data.length} rows)`);
        continue;
      }
      
      // Use flexible parser
      const sheetData = parseFlexibleAttendance(data, sheetName, selectedMonth, selectedYear);
      
      if (sheetData.length > 0) {
        allParsedData.push(...sheetData);
        console.log(`✅ Successfully parsed ${sheetData.length} records from ${sheetName}`);
      } else {
        console.log(`⚠️ No valid attendance data found in ${sheetName}`);
      }
      
    } catch (error) {
      console.error(`❌ Error parsing sheet ${sheetName}:`, error);
      // Continue with next sheet instead of stopping completely
      continue;
    }
  }
  
  console.log(`\n🎉 FINAL RESULT: ${allParsedData.length} total records from ${sheetsToProcess.length} sheets`);
  
  if (allParsedData.length === 0) {
    throw new Error('Tidak ada data valid yang ditemukan dalam sheet yang diproses. Pastikan format Excel sesuai dengan struktur yang diharapkan.');
  }
  
  return allParsedData;
};

// Re-export parseTime for backward compatibility
export { parseTime } from './excel/timeParser';
