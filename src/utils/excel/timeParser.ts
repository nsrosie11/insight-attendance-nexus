
export const parseTime = (timeStr: string): string | null => {
  if (!timeStr) return null;
  
  // Clean the string from unnecessary characters
  const cleanTimeStr = timeStr.toString().trim();
  
  // Skip if contains absence indicators
  const lowerStr = cleanTimeStr.toLowerCase();
  if (lowerStr.includes('absen') || lowerStr.includes('ijin') || 
      lowerStr.includes('sakit') || lowerStr.includes('cuti') ||
      lowerStr.includes('libur') || lowerStr === '-') {
    return null;
  }
  
  console.log(`    🕐 Parsing time: "${cleanTimeStr}"`);
  
  // Handle format HH:MM or HH:MM:SS
  const timeMatch = cleanTimeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (timeMatch) {
    const hours = timeMatch[1].padStart(2, '0');
    const minutes = timeMatch[2];
    const seconds = timeMatch[3] || '00';
    const result = `${hours}:${minutes}:${seconds}`;
    console.log(`    ✅ Parsed time format HH:MM: ${result}`);
    return result;
  }
  
  // Handle decimal time format (8.45 = 08:45)
  const decimalMatch = cleanTimeStr.match(/^(\d{1,2})\.(\d{1,2})$/);
  if (decimalMatch) {
    const hours = decimalMatch[1].padStart(2, '0');
    const minutes = decimalMatch[2].padEnd(2, '0'); // Handle single digit minutes
    const result = `${hours}:${minutes}:00`;
    console.log(`    ✅ Parsed decimal time: ${result}`);
    return result;
  }
  
  // Handle simple hour format (8, 9, 10)
  const hourMatch = cleanTimeStr.match(/^\d{1,2}$/);
  if (hourMatch) {
    const hour = hourMatch[0].padStart(2, '0');
    const result = `${hour}:00:00`;
    console.log(`    ✅ Parsed hour format: ${result}`);
    return result;
  }
  
  // Handle time with text (8:30AM, 16:45PM, etc) - remove AM/PM
  const timeWithTextMatch = cleanTimeStr.match(/(\d{1,2}):(\d{2})\s*[AP]?M?/i);
  if (timeWithTextMatch) {
    const hours = timeWithTextMatch[1].padStart(2, '0');
    const minutes = timeWithTextMatch[2];
    const result = `${hours}:${minutes}:00`;
    console.log(`    ✅ Parsed time with AM/PM: ${result}`);
    return result;
  }
  
  console.log(`    ❌ Could not parse time: "${cleanTimeStr}"`);
  return null;
};
