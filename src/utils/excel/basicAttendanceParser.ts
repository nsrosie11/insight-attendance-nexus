
export const parseBasicAttendance = (data: any[][], sheetName: string, selectedMonth: number, selectedYear: number) => {
  console.log(`\n🔥 ========== BASIC PARSER FOR SHEET: ${sheetName} ==========`);
  
  const results: any[] = [];
  
  // Step 1: Tampilkan struktur sheet secara detail
  console.log(`\n📋 RAW SHEET DATA (showing all rows with content):`);
  for (let row = 0; row < Math.min(25, data.length); row++) {
    const rowData = data[row] || [];
    if (rowData.some(cell => cell && cell.toString().trim())) {
      const cellsInfo = [];
      for (let col = 0; col < Math.min(20, rowData.length); col++) {
        const cell = rowData[col];
        if (cell && cell.toString().trim()) {
          cellsInfo.push(`Col${col}:"${cell.toString().trim()}"`);
        }
      }
      console.log(`Row${row}: ${cellsInfo.join(' | ')}`);
    }
  }
  
  // Step 2: Cari baris tanggal (cari angka 1-31 berurutan)
  let dateRow = -1;
  let dateColumns: number[] = [];
  
  console.log(`\n🗓️ SEARCHING FOR DATE ROW...`);
  for (let row = 0; row < Math.min(20, data.length); row++) {
    const rowData = data[row] || [];
    const foundDates: {num: number, col: number}[] = [];
    
    for (let col = 0; col < Math.min(35, rowData.length); col++) {
      const cell = rowData[col];
      if (cell) {
        const str = cell.toString().trim();
        // Harus persis angka 1-31
        if (/^\d{1,2}$/.test(str)) {
          const num = parseInt(str);
          if (num >= 1 && num <= 31) {
            foundDates.push({num, col});
          }
        }
      }
    }
    
    console.log(`Row ${row}: Found ${foundDates.length} dates: ${foundDates.map(d => `${d.num}@col${d.col}`).join(', ')}`);
    
    // Kalau ada minimal 10 tanggal, ini kemungkinan baris tanggal
    if (foundDates.length >= 10) {
      dateRow = row;
      dateColumns = foundDates.map(d => d.col);
      console.log(`✅ DATE ROW FOUND at row ${row}!`);
      break;
    }
  }
  
  if (dateRow === -1) {
    console.log(`❌ No date row found in ${sheetName}`);
    return results;
  }
  
  // Step 3: Cari nama karyawan - yang paling sederhana
  console.log(`\n👥 SEARCHING FOR EMPLOYEE NAMES...`);
  const employees: Array<{name: string, row: number, col: number}> = [];
  
  // Cari di area sebelum baris tanggal, fokus di kolom 0-4
  for (let col = 0; col < 5; col++) {
    console.log(`\nChecking column ${col}:`);
    
    for (let row = 0; row < dateRow; row++) {
      const cell = data[row] && data[row][col];
      if (cell) {
        const str = cell.toString().trim();
        console.log(`  [${row}][${col}]: "${str}"`);
        
        // Cek apakah ini nama yang valid
        if (isSimpleName(str)) {
          employees.push({
            name: str,
            row: row,
            col: col
          });
          console.log(`    ✅ EMPLOYEE FOUND: "${str}"`);
        }
      }
    }
  }
  
  console.log(`\n📊 TOTAL EMPLOYEES: ${employees.length}`);
  employees.forEach((emp, idx) => {
    console.log(`  ${idx + 1}. "${emp.name}" at [${emp.row}][${emp.col}]`);
  });
  
  if (employees.length === 0) {
    console.log(`❌ No employees found in ${sheetName}`);
    return results;
  }
  
  // Step 4: Ambil data absensi untuk setiap karyawan
  console.log(`\n⏰ EXTRACTING ATTENDANCE DATA...`);
  
  for (const employee of employees) {
    console.log(`\n👤 Processing: ${employee.name}`);
    
    // Cari data waktu di baris setelah baris tanggal
    for (let timeRowOffset = 1; timeRowOffset <= 5; timeRowOffset++) {
      const timeRow = dateRow + timeRowOffset;
      if (timeRow >= data.length) break;
      
      console.log(`  Checking time row ${timeRow}...`);
      const timeRowData = data[timeRow] || [];
      
      // Cek apakah ada data waktu di baris ini
      let hasTimeInThisRow = false;
      for (let checkCol of dateColumns.slice(0, 10)) {
        const cell = timeRowData[checkCol];
        if (cell && hasTimePattern(cell.toString().trim())) {
          hasTimeInThisRow = true;
          break;
        }
      }
      
      if (hasTimeInThisRow) {
        console.log(`    ✅ Found time data in row ${timeRow}`);
        
        // Proses setiap kolom tanggal
        for (let i = 0; i < Math.min(dateColumns.length, 31); i++) {
          const dateCol = dateColumns[i];
          const dateCell = data[dateRow][dateCol];
          const timeCell = timeRowData[dateCol];
          
          if (dateCell && timeCell) {
            const day = parseInt(dateCell.toString().trim());
            const timeStr = timeCell.toString().trim();
            
            if (day >= 1 && day <= 31 && timeStr && timeStr !== '-') {
              const tanggal = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
              
              // Parse waktu sederhana
              const jamMasuk = parseSimpleTime(timeStr);
              
              if (jamMasuk) {
                results.push({
                  nama: employee.name,
                  status: 'Magang', // Default untuk sekarang
                  tanggal,
                  jam_masuk: jamMasuk,
                  jam_pulang: null,
                  terlambat: jamMasuk > '10:00:00',
                  pulang_tercatat: false
                });
                
                console.log(`      📅 ${tanggal}: ${jamMasuk}`);
              }
            }
          }
        }
        
        break; // Cukup satu baris waktu per karyawan
      }
    }
  }
  
  console.log(`\n🎉 SHEET ${sheetName} RESULT: ${results.length} records`);
  return results;
};

// Validasi nama yang sangat sederhana
const isSimpleName = (str: string): boolean => {
  // Harus ada huruf
  if (!/[a-zA-Z]/.test(str)) return false;
  
  // Panjang wajar
  if (str.length < 2 || str.length > 25) return false;
  
  // Bukan angka doang
  if (/^\d+$/.test(str)) return false;
  
  // Bukan waktu
  if (/^\d{1,2}:\d{2}/.test(str)) return false;
  
  // Bukan kata kunci sistem
  const blacklist = [
    'nama', 'name', 'karyawan', 'employee', 'dept', 'departemen',
    'absen', 'absensi', 'jam', 'waktu', 'masuk', 'pulang',
    'tanggal', 'hari', 'bulan', 'tahun', 'total', 'jumlah',
    'laporan', 'rekap', 'periode', 'rnd', 'office', 'kantor'
  ];
  
  const lower = str.toLowerCase();
  return !blacklist.some(word => lower.includes(word));
};

// Cek apakah string mengandung pola waktu
const hasTimePattern = (str: string): boolean => {
  if (!str || str === '-') return false;
  
  // Cari pola waktu atau angka
  return /\d/.test(str) && (
    /\d{1,2}:\d{2}/.test(str) ||  // 08:30
    /^\d{1,2}$/.test(str) ||      // 8
    /^0\.\d+$/.test(str)          // 0.354167 (Excel decimal time)
  );
};

// Parse waktu super sederhana
const parseSimpleTime = (timeStr: string): string | null => {
  if (!timeStr || timeStr === '-') return null;
  
  const str = timeStr.trim();
  
  // Format HH:MM
  const timeMatch = str.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    if (hours < 24 && minutes < 60) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    }
  }
  
  // Excel decimal time
  if (/^0\.\d+$/.test(str)) {
    const decimal = parseFloat(str);
    const totalMinutes = Math.round(decimal * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours < 24 && minutes < 60) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    }
  }
  
  // Jam saja
  if (/^\d{1,2}$/.test(str)) {
    const hour = parseInt(str);
    if (hour < 24) {
      return `${hour.toString().padStart(2, '0')}:00:00`;
    }
  }
  
  return null;
};
