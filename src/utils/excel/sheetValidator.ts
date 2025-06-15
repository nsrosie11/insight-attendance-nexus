
export const shouldProcessSheet = (sheetName: string, allSheetNames: string[]): boolean => {
  console.log(`Checking if sheet "${sheetName}" should be processed`);
  
  // Skip "Log" sheet
  if (sheetName.toLowerCase().includes('log')) {
    console.log(`Skipping sheet "${sheetName}" - contains "log"`);
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
  
  // Also process sheets that might contain employee names (fallback)
  if (sheetName.length > 2 && sheetName.length < 20 && 
      sheetName.match(/^[a-zA-Z\s]+$/) && 
      !sheetName.toLowerCase().includes('sheet')) {
    console.log(`Processing potential employee sheet "${sheetName}"`);
    return true;
  }
  
  console.log(`Skipping sheet "${sheetName}" - doesn't match criteria`);
  return false;
};
