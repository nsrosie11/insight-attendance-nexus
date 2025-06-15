
export const parseTime = (timeStr: string): string | null => {
  if (!timeStr) return null;
  
  // Clean the string from unnecessary characters
  const cleanTimeStr = timeStr.toString().trim();
  
  // Skip if contains absence indicators
  const lowerStr = cleanTimeStr.toLowerCase();
  if (lowerStr.includes('absen') || lowerStr.includes('ijin') || 
      lowerStr.includes('sakit') || lowerStr.includes('cuti') ||
      lowerStr.includes('libur') || lowerStr === '-' ||
      lowerStr.includes('tidak') || lowerStr.includes('kosong')) {
    return null;
  }
  
  console.log(`    🕐 Parsing time: "${cleanTimeStr}"`);
  
  // Handle Excel time format (decimal like 0.354166667 = 8:30)
  const excelTimeMatch = cleanTimeStr.match(/^0\.(\d+)$/);
  if (excelTimeMatch) {
    const decimal = parseFloat(cleanTimeStr);
    const totalMinutes = Math.round(decimal * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const result = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    console.log(`    ✅ Parsed Excel decimal time: ${result}`);
    return result;
  }
  
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
  
  // Handle decimal time format (8.45 = 08:45, 8.5 = 08:30)
  const decimalMatch = cleanTimeStr.match(/^(\d{1,2})\.(\d{1,2})$/);
  if (decimalMatch) {
    const hours = decimalMatch[1].padStart(2, '0');
    let minutes = decimalMatch[2];
    
    // Convert decimal minutes properly
    if (minutes.length === 1) {
      minutes = (parseInt(minutes) * 6).toString(); // .5 = 30 minutes, .3 = 18 minutes
    }
    minutes = minutes.padStart(2, '0');
    
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
  
  // Handle time with text (8:30AM, 16:45PM, etc) - remove AM/PM and convert if needed
  const timeWithTextMatch = cleanTimeStr.match(/(\d{1,2}):(\d{2})\s*([AP]M?)/i);
  if (timeWithTextMatch) {
    let hours = parseInt(timeWithTextMatch[1]);
    const minutes = timeWithTextMatch[2];
    const period = timeWithTextMatch[3].toUpperCase();
    
    // Convert 12-hour to 24-hour format
    if (period.includes('P') && hours !== 12) {
      hours += 12;
    } else if (period.includes('A') && hours === 12) {
      hours = 0;
    }
    
    const result = `${hours.toString().padStart(2, '0')}:${minutes}:00`;
    console.log(`    ✅ Parsed time with AM/PM: ${result}`);
    return result;
  }
  
  // Handle format with spaces or dots (8 . 30, 8 : 30)
  const spacedTimeMatch = cleanTimeStr.match(/(\d{1,2})\s*[.:]\s*(\d{2})/);
  if (spacedTimeMatch) {
    const hours = spacedTimeMatch[1].padStart(2, '0');
    const minutes = spacedTimeMatch[2];
    const result = `${hours}:${minutes}:00`;
    console.log(`    ✅ Parsed spaced time format: ${result}`);
    return result;
  }
  
  console.log(`    ❌ Could not parse time: "${cleanTimeStr}"`);
  return null;
};
