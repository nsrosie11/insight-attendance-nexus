
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
    
    // Validate hours and minutes
    if (hours >= 24 || hours < 0 || minutes >= 60 || minutes < 0) {
      console.log(`    ❌ Invalid Excel time conversion: ${hours}:${minutes}`);
      return null;
    }
    
    const result = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    console.log(`    ✅ Parsed Excel decimal time: ${result}`);
    return result;
  }
  
  // Handle format HH:MM or HH:MM:SS
  const timeMatch = cleanTimeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const seconds = timeMatch[3] ? parseInt(timeMatch[3]) : 0;
    
    // Validate time components
    if (hours >= 24 || hours < 0 || minutes >= 60 || minutes < 0 || seconds >= 60 || seconds < 0) {
      console.log(`    ❌ Invalid time format: ${hours}:${minutes}:${seconds}`);
      return null;
    }
    
    const result = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    console.log(`    ✅ Parsed time format HH:MM: ${result}`);
    return result;
  }
  
  // Handle decimal time format (8.45 = 08:45, 8.5 = 08:30)
  const decimalMatch = cleanTimeStr.match(/^(\d{1,2})\.(\d{1,2})$/);
  if (decimalMatch) {
    const hours = parseInt(decimalMatch[1]);
    let minutes = parseInt(decimalMatch[2]);
    
    // Validate hours
    if (hours >= 24 || hours < 0) {
      console.log(`    ❌ Invalid decimal time hours: ${hours}`);
      return null;
    }
    
    // Convert decimal minutes properly
    if (decimalMatch[2].length === 1) {
      minutes = minutes * 6; // .5 = 30 minutes, .3 = 18 minutes
    }
    
    // Validate minutes
    if (minutes >= 60 || minutes < 0) {
      console.log(`    ❌ Invalid decimal time minutes: ${minutes}`);
      return null;
    }
    
    const result = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    console.log(`    ✅ Parsed decimal time: ${result}`);
    return result;
  }
  
  // Handle simple hour format (8, 9, 10)
  const hourMatch = cleanTimeStr.match(/^\d{1,2}$/);
  if (hourMatch) {
    const hour = parseInt(hourMatch[0]);
    
    // Validate hour
    if (hour >= 24 || hour < 0) {
      console.log(`    ❌ Invalid hour format: ${hour}`);
      return null;
    }
    
    const result = `${hour.toString().padStart(2, '0')}:00:00`;
    console.log(`    ✅ Parsed hour format: ${result}`);
    return result;
  }
  
  // Handle time with text (8:30AM, 16:45PM, etc) - remove AM/PM and convert if needed
  const timeWithTextMatch = cleanTimeStr.match(/(\d{1,2}):(\d{2})\s*([AP]M?)/i);
  if (timeWithTextMatch) {
    let hours = parseInt(timeWithTextMatch[1]);
    const minutes = parseInt(timeWithTextMatch[2]);
    const period = timeWithTextMatch[3].toUpperCase();
    
    // Validate base values
    if (minutes >= 60 || minutes < 0) {
      console.log(`    ❌ Invalid AM/PM time minutes: ${minutes}`);
      return null;
    }
    
    // Convert 12-hour to 24-hour format
    if (period.includes('P') && hours !== 12) {
      hours += 12;
    } else if (period.includes('A') && hours === 12) {
      hours = 0;
    }
    
    // Validate final hours
    if (hours >= 24 || hours < 0) {
      console.log(`    ❌ Invalid AM/PM time hours after conversion: ${hours}`);
      return null;
    }
    
    const result = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    console.log(`    ✅ Parsed time with AM/PM: ${result}`);
    return result;
  }
  
  // Handle format with spaces or dots (8 . 30, 8 : 30)
  const spacedTimeMatch = cleanTimeStr.match(/(\d{1,2})\s*[.:]\s*(\d{2})/);
  if (spacedTimeMatch) {
    const hours = parseInt(spacedTimeMatch[1]);
    const minutes = parseInt(spacedTimeMatch[2]);
    
    // Validate time components
    if (hours >= 24 || hours < 0 || minutes >= 60 || minutes < 0) {
      console.log(`    ❌ Invalid spaced time format: ${hours}:${minutes}`);
      return null;
    }
    
    const result = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    console.log(`    ✅ Parsed spaced time format: ${result}`);
    return result;
  }
  
  console.log(`    ❌ Could not parse time: "${cleanTimeStr}"`);
  return null;
};
