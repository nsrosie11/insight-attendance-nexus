
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AbsensiData {
  id: string;
  nama: string;
  status: string;
  tanggal: string;
  jam_masuk: string | null;
  jam_pulang: string | null;
  terlambat: boolean | null;
  pulang_tercatat: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface EmployeeData {
  nama: string;
  status: string;
  totalHadir: number;
  totalAbsen: number;
  totalTerlambat: number;
}

export const useAbsensi = () => {
  return useQuery({
    queryKey: ['absensi'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('absensi')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data as AbsensiData[];
    },
  });
};

export const useEmployeeList = () => {
  return useQuery({
    queryKey: ['employee-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('absensi')
        .select('nama, status')
        .order('nama');

      if (error) {
        throw error;
      }

      // Group by employee name and get unique employees
      const uniqueEmployees = data?.reduce((acc: EmployeeData[], curr) => {
        const existing = acc.find(emp => emp.nama === curr.nama);
        if (!existing) {
          acc.push({
            nama: curr.nama,
            status: curr.status,
            totalHadir: 0,
            totalAbsen: 0,
            totalTerlambat: 0
          });
        }
        return acc;
      }, []) || [];

      return uniqueEmployees;
    },
  });
};

export const useEmployeeAttendance = (employeeName: string) => {
  return useQuery({
    queryKey: ['employee-attendance', employeeName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('absensi')
        .select('*')
        .eq('nama', employeeName)
        .order('tanggal', { ascending: true });

      if (error) {
        throw error;
      }

      return data as AbsensiData[];
    },
    enabled: !!employeeName,
  });
};

export const useAbsensiStats = () => {
  return useQuery({
    queryKey: ['absensi-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('absensi')
        .select('nama, status');

      if (error) {
        throw error;
      }

      // Get unique employees and their counts
      const uniqueEmployees = data?.reduce((acc: any[], curr) => {
        const existing = acc.find(emp => emp.nama === curr.nama);
        if (!existing) {
          acc.push(curr);
        }
        return acc;
      }, []) || [];

      const karyawanCount = uniqueEmployees.filter(item => item.status === 'Karyawan').length || 0;
      const magangCount = uniqueEmployees.filter(item => item.status === 'Magang').length || 0;

      return {
        karyawan: karyawanCount,
        magang: magangCount,
        total: karyawanCount + magangCount
      };
    },
  });
};

export const useGenderStats = () => {
  return useQuery({
    queryKey: ['gender-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('absensi')
        .select('nama, status');

      if (error) {
        throw error;
      }

      // Get unique employees
      const uniqueEmployees = data?.reduce((acc: any[], curr) => {
        const existing = acc.find(emp => emp.nama === curr.nama);
        if (!existing) {
          acc.push(curr);
        }
        return acc;
      }, []) || [];

      // Predefined female names for demo (you might want to add gender field to database)
      const femaleNames = ['Siti Nurhaliza', 'Maya Sari', 'Rina Sari', 'Anisa', 'Devi', 'Putri'];
      
      const karyawanMale = uniqueEmployees.filter(item => 
        item.status === 'Karyawan' && !femaleNames.some(name => item.nama.toLowerCase().includes(name.toLowerCase()))
      ).length || 0;
      
      const karyawanFemale = uniqueEmployees.filter(item => 
        item.status === 'Karyawan' && femaleNames.some(name => item.nama.toLowerCase().includes(name.toLowerCase()))
      ).length || 0;
      
      const magangMale = uniqueEmployees.filter(item => 
        item.status === 'Magang' && !femaleNames.some(name => item.nama.toLowerCase().includes(name.toLowerCase()))
      ).length || 0;
      
      const magangFemale = uniqueEmployees.filter(item => 
        item.status === 'Magang' && femaleNames.some(name => item.nama.toLowerCase().includes(name.toLowerCase()))
      ).length || 0;

      return {
        karyawan: {
          male: karyawanMale,
          female: karyawanFemale
        },
        magang: {
          male: magangMale,
          female: magangFemale
        }
      };
    },
  });
};

export const useAttendanceStats = () => {
  return useQuery({
    queryKey: ['attendance-stats'],
    queryFn: async () => {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const { data, error } = await supabase
        .from('absensi')
        .select('jam_masuk, jam_pulang, terlambat')
        .gte('tanggal', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('tanggal', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

      if (error) {
        throw error;
      }

      const tepatWaktu = data?.filter(item => 
        item.jam_masuk && !item.terlambat
      ).length || 0;
      
      const terlambat = data?.filter(item => 
        item.jam_masuk && item.terlambat
      ).length || 0;

      return {
        tepatWaktu,
        terlambat,
        total: tepatWaktu + terlambat
      };
    },
  });
};
