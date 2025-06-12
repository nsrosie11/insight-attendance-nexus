
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

export const useAbsensiStats = () => {
  return useQuery({
    queryKey: ['absensi-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('absensi')
        .select('status');

      if (error) {
        throw error;
      }

      const karyawanCount = data?.filter(item => item.status === 'Karyawan').length || 0;
      const magangCount = data?.filter(item => item.status === 'Magang').length || 0;

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
      // Untuk sementara kita gunakan data simulasi berdasarkan nama
      // Dalam implementasi nyata, Anda mungkin perlu menambah kolom gender di database
      const { data, error } = await supabase
        .from('absensi')
        .select('nama, status');

      if (error) {
        throw error;
      }

      // Simulasi gender berdasarkan nama (ini hanya contoh)
      const femaleNames = ['Siti Nurhaliza', 'Maya Sari', 'Rina Sari'];
      
      const karyawanMale = data?.filter(item => 
        item.status === 'Karyawan' && !femaleNames.includes(item.nama)
      ).length || 0;
      
      const karyawanFemale = data?.filter(item => 
        item.status === 'Karyawan' && femaleNames.includes(item.nama)
      ).length || 0;
      
      const magangMale = data?.filter(item => 
        item.status === 'Magang' && !femaleNames.includes(item.nama)
      ).length || 0;
      
      const magangFemale = data?.filter(item => 
        item.status === 'Magang' && femaleNames.includes(item.nama)
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
