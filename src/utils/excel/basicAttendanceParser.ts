
export const parseBasicAttendance = (data: any[][], sheetName: string, selectedMonth: number, selectedYear: number) => {
  console.log(`\n🔥 ========== BASIC PARSER FOR SHEET: ${sheetName} ==========`);
  
  const results: any[] = [];
  
  // Step 1: Tampilkan ALL data yang ada di sheet, tidak hanya 25 baris
  console.log(`\n📋 COMPLETE RAW SHEET DATA (${data.length} total rows):`);
  for (let row = 0; row < Math.min(50, data.length); row++) {
    const rowData = data[row] || [];
    if (rowData.length > 0) {
      const cellsInfo = [];
      for (let col = 0; col < Math.min(25, rowData.length); col++) {
        const cell = rowData[col];
        if (cell !== null && cell !== undefined && cell.toString().trim() !== '') {
          cellsInfo.push(`[${col}]:"${cell.toString().trim()}"`);
        }
      }
      if (cellsInfo.length > 0) {
        console.log(`Row${row.toString().padStart(2, '0')}: ${cellsInfo.join(' | ')}`);
      } else {
        console.log(`Row${row.toString().padStart(2, '0')}: (empty row)`);
      }
    }
  }
  
  console.log(`\n📊 SHEET STATISTICS:`);
  console.log(`- Total rows: ${data.length}`);
  console.log(`- Non-empty rows: ${data.filter(row => row && row.some(cell => cell && cell.toString().trim())).length}`);
  console.log(`- Max columns: ${Math.max(...data.map(row => (row || []).length))}`);
  
  // Step 2: Cari baris tanggal dengan cara yang lebih fleksibel
  let dateRow = -1;
  let dateColumns: number[] = [];
  
  console.log(`\n🗓️ SEARCHING FOR DATE ROW (checking all possible patterns)...`);
  for (let row = 0; row < Math.min(30, data.length); row++) {
    const rowData = data[row] || [];
    const foundDates: {num: number, col: number}[] = [];
    
    for (let col = 0; col < Math.min(40, rowData.length); col++) {
      const cell = rowData[col];
      if (cell !== null && cell !== undefined) {
        const str = cell.toString().trim();
        
        // Cek berbagai format tanggal
        if (/^\d{1,2}$/.test(str)) {
          const num = parseInt(str);
          if (num >= 1 && num <= 31) {
            foundDates.push({num, col});
          }
        }
      }
    }
    
    console.log(`Row ${row}: Found ${foundDates.length} potential dates: ${foundDates.slice(0, 15).map(d => `${d.num}@C${d.col}`).join(', ')}`);
    
    // Jika ada minimal 5 tanggal (lebih permisif)
    if (foundDates.length >= 5) {
      dateRow = row;
      dateColumns = foundDates.map(d => d.col);
      console.log(`✅ DATE ROW FOUND at row ${row} with ${foundDates.length} dates!`);
      break;
    }
  }
  
  if (dateRow === -1) {
    console.log(`❌ No date row found in ${sheetName} - trying alternative approach`);
    
    // Coba cari kata "tanggal" atau angka berurutan
    console.log(`\n🔍 ALTERNATIVE SEARCH - Looking for date indicators...`);
    for (let row = 0; row < Math.min(20, data.length); row++) {
      const rowData = data[row] || [];
      for (let col = 0; col < Math.min(20, rowData.length); col++) {
        const cell = rowData[col];
        if (cell) {
          const str = cell.toString().toLowerCase().trim();
          if (str.includes('tanggal') || str.includes('date') || str.includes('hari')) {
            console.log(`📅 Found date indicator "${cell}" at [${row}][${col}]`);
            // Cek baris selanjutnya untuk angka
            if (row + 1 < data.length) {
              const nextRowData = data[row + 1] || [];
              const nextCell = nextRowData[col];
              if (nextCell && /^\d{1,2}$/.test(nextCell.toString().trim())) {
                dateRow = row + 1;
                console.log(`✅ Found date row at ${dateRow} below indicator`);
                break;
              }
            }
          }
        }
      }
      if (dateRow !== -1) break;
    }
  }
  
  // Step 3: Cari nama karyawan dengan kriteria yang lebih ketat
  console.log(`\n👥 SEARCHING FOR EMPLOYEE NAMES...`);
  const employees: Array<{name: string, row: number, col: number}> = [];
  
  // Cari di area yang masuk akal (baris 0-20, kolom 0-10)
  for (let row = 0; row < Math.min(20, data.length); row++) {
    const rowData = data[row] || [];
    for (let col = 0; col < Math.min(10, rowData.length); col++) {
      const cell = rowData[col];
      if (cell !== null && cell !== undefined) {
        const str = cell.toString().trim();
        
        console.log(`Checking [${row}][${col}]: "${str}"`);
        
        if (isValidEmployeeName(str)) {
          employees.push({
            name: str,
            row: row,
            col: col
          });
          console.log(`    ✅ VALID EMPLOYEE: "${str}"`);
        } else {
          console.log(`    ❌ Rejected: "${str}" (${getRejectReason(str)})`);
        }
      }
    }
  }
  
  console.log(`\n📊 EMPLOYEE SUMMARY: ${employees.length} found`);
  employees.forEach((emp, idx) => {
    console.log(`  ${idx + 1}. "${emp.name}" at [${emp.row}][${emp.col}]`);
  });
  
  // Step 4: Jika tidak ada yang ditemukan, tampilkan contoh data untuk debugging
  if (dateRow === -1 || employees.length === 0) {
    console.log(`\n🚨 DEBUGGING INFO:`);
    console.log(`Date row found: ${dateRow !== -1 ? 'YES' : 'NO'}`);
    console.log(`Employees found: ${employees.length}`);
    
    console.log(`\n📋 SAMPLE CELLS FOR MANUAL INSPECTION:`);
    for (let r = 0; r < Math.min(10, data.length); r++) {
      for (let c = 0; c < Math.min(10, (data[r] || []).length); c++) {
        const cell = data[r] && data[r][c];
        if (cell && cell.toString().trim()) {
          console.log(`[${r}][${c}] = "${cell.toString().trim()}"`);
        }
      }
    }
    
    return results;
  }
  
  // Step 5: Proses absensi jika struktur ditemukan
  console.log(`\n⏰ PROCESSING ATTENDANCE...`);
  
  for (const employee of employees) {
    console.log(`\n👤 Processing: ${employee.name}`);
    
    // Cari data waktu di baris sekitar dateRow
    const searchRows = [];
    if (dateRow !== -1) {
      for (let offset = -2; offset <= 5; offset++) {
        const checkRow = dateRow + offset;
        if (checkRow >= 0 && checkRow < data.length && checkRow !== dateRow) {
          searchRows.push(checkRow);
        }
      }
    }
    
    for (const timeRow of searchRows) {
      const timeRowData = data[timeRow] || [];
      console.log(`  Checking time row ${timeRow}...`);
      
      // Cek apakah ada data waktu
      let foundTimeData = false;
      for (let checkCol of dateColumns.slice(0, 10)) {
        const timeCell = timeRowData[checkCol];
        if (timeCell && hasTimeData(timeCell.toString().trim())) {
          foundTimeData = true;
          break;
        }
      }
      
      if (foundTimeData) {
        console.log(`    ✅ Found time data in row ${timeRow}`);
        
        // Proses setiap tanggal
        for (let i = 0; i < Math.min(dateColumns.length, 31); i++) {
          const dateCol = dateColumns[i];
          const dateCell = data[dateRow] && data[dateRow][dateCol];
          const timeCell = timeRowData[dateCol];
          
          if (dateCell && timeCell) {
            const day = parseInt(dateCell.toString().trim());
            const timeStr = timeCell.toString().trim();
            
            if (day >= 1 && day <= 31 && timeStr && timeStr !== '-') {
              const tanggal = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
              const jamMasuk = parseSimpleTime(timeStr);
              
              if (jamMasuk) {
                results.push({
                  nama: employee.name,
                  status: 'Magang',
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
        break;
      }
    }
  }
  
  console.log(`\n🎉 FINAL RESULT: ${results.length} records from ${sheetName}`);
  return results;
};

// Validasi nama yang lebih ketat
const isValidEmployeeName = (str: string): boolean => {
  if (!str || str.length < 2 || str.length > 30) return false;
  
  // Harus ada huruf
  if (!/[a-zA-Z]/.test(str)) return false;
  
  // Tidak boleh pure angka atau waktu
  if (/^\d+$/.test(str) || /^\d{1,2}:\d{2}/.test(str)) return false;
  
  const lower = str.toLowerCase();
  
  // Daftar kata yang pasti bukan nama
  const blacklist = [
    'laporan', 'kehadiran', 'absen', 'nama', 'tanggal', 'jam', 'masuk', 'pulang',
    'departemen', 'bagian', 'rnd', 'office', 'total', 'jumlah', 'bulan', 'tahun'
  ];
  
  return !blacklist.some(word => lower.includes(word));
};

const getRejectReason = (str: string): string => {
  if (!str || str.length < 2) return 'too short';
  if (str.length > 30) return 'too long';
  if (!/[a-zA-Z]/.test(str)) return 'no letters';
  if (/^\d+$/.test(str)) return 'pure number';
  if (/^\d{1,2}:\d{2}/.test(str)) return 'time format';
  
  const lower = str.toLowerCase();
  const blacklist = ['laporan', 'kehadiran', 'absen', 'nama', 'tanggal', 'jam', 'masuk', 'pulang'];
  for (const word of blacklist) {
    if (lower.includes(word)) return `contains '${word}'`;
  }
  
  return 'unknown';
};

const hasTimeData = (str: string): boolean => {
  if (!str || str === '-') return false;
  return /\d/.test(str) && (
    /\d{1,2}:\d{2}/.test(str) ||
    /^\d{1,2}$/.test(str) ||
    /^0\.\d+$/.test(str)
  );
};

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
  
  // Excel decimal
  if (/^0\.\d+$/.test(str)) {
    const decimal = parseFloat(str);
    const totalMinutes = Math.round(decimal * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours < 24) {
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
