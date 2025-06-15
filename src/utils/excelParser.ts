
import * as XLSX from 'xlsx';
import { ExcelData } from '@/types/excel';
import { shouldProcessSheet } from './excel/sheetValidator';
import { parseBasicAttendance } from './excel/basicAttendanceParser';

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
        // Use standard parsing
        data = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' }) as any[][];
        console.log(`📊 Parsed ${data.length} rows`);
      } catch (error) {
        console.log('❌ Parsing failed:', error);
        continue;
      }
      
      // Filter out completely empty rows
      data = data.filter(row => row && row.some(cell => cell && cell.toString().trim() !== ''));
      console.log(`📊 After filtering: ${data.length} rows`);
      
      if (data.length < 3) {
        console.log(`❌ Sheet ${sheetName} has insufficient data`);
        continue;
      }
      
      // Use basic parser
      const sheetData = parseBasicAttendance(data, sheetName, selectedMonth, selectedYear);
      
      if (sheetData.length > 0) {
        allParsedData.push(...sheetData);
        console.log(`✅ Successfully parsed ${sheetData.length} records from ${sheetName}`);
      } else {
        console.log(`⚠️ No valid attendance data found in ${sheetName}`);
      }
      
    } catch (error) {
      console.error(`❌ Error parsing sheet ${sheetName}:`, error);
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
