
const isNumericSheetName = (sheetName: string): boolean => {
  // Check if sheet name contains only numbers and dots (like 14.15.17)
  return /^[\d.]+$/.test(sheetName);
};

export const shouldProcessSheet = (sheetName: string, allSheetNames: string[]): boolean => {
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
