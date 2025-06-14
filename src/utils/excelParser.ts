
import * as XLSX from 'xlsx';
import { ExcelData } from '@/types/excel';
import { shouldProcessSheet } from './excel/sheetValidator';
import { parseSheetData } from './excel/sheetDataParser';

export const parseExcelData = (workbook: XLSX.WorkBook, selectedMonth: number, selectedYear: number): ExcelData[] => {
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
      const sheetData = parseSheetData(data, sheetName, selectedMonth, selectedYear);
      
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

// Re-export parseTime for backward compatibility
export { parseTime } from './excel/timeParser';
