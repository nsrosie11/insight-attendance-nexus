
export const parseTime = (timeStr: string): string | null => {
  if (!timeStr) return null;
  
  // Bersihkan string dari karakter yang tidak perlu
  const cleanTimeStr = timeStr.toString().trim();
  
  // Skip jika berisi "Absen"
  if (cleanTimeStr.toLowerCase().includes('absen')) {
    return null;
  }
  
  // Handle format HH:MM atau HH:MM:SS
  const timeMatch = cleanTimeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (timeMatch) {
    const hours = timeMatch[1].padStart(2, '0');
    const minutes = timeMatch[2];
    const seconds = timeMatch[3] || '00';
    return `${hours}:${minutes}:${seconds}`;
  }
  
  // Handle format jam biasa (misal: 8, 9, 10)
  const hourMatch = cleanTimeStr.match(/^\d{1,2}$/);
  if (hourMatch) {
    const hour = hourMatch[0].padStart(2, '0');
    return `${hour}:00:00`;
  }
  
  return null;
};
