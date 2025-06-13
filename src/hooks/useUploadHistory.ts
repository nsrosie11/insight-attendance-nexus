
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UploadHistoryRecord {
  id: string;
  admin_user_id: string;
  filename: string;
  upload_month: number;
  upload_year: number;
  upload_date: string;
  records_count: number;
  created_at: string;
}

export const useUploadHistory = () => {
  return useQuery({
    queryKey: ['upload-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('upload_history')
        .select('*')
        .order('upload_date', { ascending: false });

      if (error) {
        console.error('Error fetching upload history:', error);
        throw error;
      }

      return data as UploadHistoryRecord[];
    },
  });
};

export const useUploadHistoryByPeriod = (year?: number, month?: number) => {
  return useQuery({
    queryKey: ['upload-history-period', year, month],
    queryFn: async () => {
      if (!year || !month) return [];

      const { data, error } = await supabase
        .from('upload_history')
        .select('*')
        .eq('upload_year', year)
        .eq('upload_month', month)
        .order('upload_date', { ascending: false });

      if (error) {
        console.error('Error fetching upload history by period:', error);
        throw error;
      }

      return data as UploadHistoryRecord[];
    },
    enabled: !!year && !!month,
  });
};

export const useCreateUploadHistory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      filename: string;
      upload_month: number;
      upload_year: number;
      records_count: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User tidak ditemukan');
      }

      const { data: result, error } = await supabase
        .from('upload_history')
        .insert({
          admin_user_id: user.id,
          filename: data.filename,
          upload_month: data.upload_month,
          upload_year: data.upload_year,
          records_count: data.records_count,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upload-history'] });
      queryClient.invalidateQueries({ queryKey: ['upload-history-period'] });
      toast({
        title: "Riwayat upload berhasil disimpan",
        description: "Data upload telah tercatat dalam riwayat",
      });
    },
    onError: (error: any) => {
      console.error('Error creating upload history:', error);
      toast({
        title: "Gagal menyimpan riwayat",
        description: error.message || "Terjadi kesalahan saat menyimpan riwayat upload",
        variant: "destructive"
      });
    },
  });
};
