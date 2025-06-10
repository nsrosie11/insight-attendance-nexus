
export interface ExcelData {
  nama: string;
  status: string;
  tanggal: string;
  jam_masuk: string | null;
  jam_pulang: string | null;
  terlambat: boolean;
  pulang_tercatat: boolean;
}

export interface EmployeeInfo {
  nama: string;
  dept: string;
  rowIndex: number;
}
