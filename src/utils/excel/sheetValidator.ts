
export const shouldProcessSheet = (sheetName: string, allSheetNames: string[]): boolean => {
  console.log(`Checking if sheet "${sheetName}" should be processed`);
  
  // Skip "Rekap" and "Log" sheets
  if (sheetName.toLowerCase().includes('rekap') || sheetName.toLowerCase().includes('log')) {
    console.log(`Skipping sheet "${sheetName}" - summary/log sheet`);
    return false;
  }
  
  // Check if it's a numeric sheet name starting from 14.15.17
  const numericPattern = /^\d+(\.\d+)*$/;
  
  if (numericPattern.test(sheetName)) {
    // Parse the sheet number for comparison
    const sheetNumber = parseFloat(sheetName.replace(/\./g, ''));
    const minimumNumber = parseFloat('141517');
    
    if (sheetNumber >= minimumNumber) {
      console.log(`Processing numeric sheet "${sheetName}" - valid number`);
      return true;
    } else {
      console.log(`Skipping sheet "${sheetName}" - number too low`);
      return false;
    }
  }
  
  console.log(`Skipping sheet "${sheetName}" - doesn't match criteria`);
  return false;
};
