
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Briefcase } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const UserProfile: React.FC = () => {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const { data: userAbsensi } = useQuery({
    queryKey: ['userProfileData', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      
      // Extract nama from email (before @)
      const nama = user.email.split('@')[0];
      
      const { data, error } = await supabase
        .from('absensi')
        .select('nama, status')
        .ilike('nama', `%${nama}%`)
        .limit(1)
        .single();

      if (error) return null;
      return data;
    },
    enabled: !!user?.email,
  });

  const getStatusDisplay = (status: string) => {
    if (status === 'Karyawan') return 'Karyawan Tetap';
    if (status === 'Magang') return 'Karyawan Magang';
    return status;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-800 mb-2">Profile Saya</h1>
        <p className="text-blue-600">Informasi personal dan status karyawan</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informasi Personal */}
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <User className="h-5 w-5" />
              Informasi Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600">Nama</p>
                <p className="font-medium text-blue-800">
                  {userAbsensi?.nama || user?.email?.split('@')[0] || 'User'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600">Email</p>
                <p className="font-medium text-blue-800">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Karyawan */}
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Briefcase className="h-5 w-5" />
              Status Karyawan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Briefcase className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-green-600">Status</p>
                <p className="font-medium text-green-800">
                  {userAbsensi?.status ? getStatusDisplay(userAbsensi.status) : 'Belum Diketahui'}
                </p>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-white/50 rounded-lg">
              <p className="text-sm text-green-700">
                {userAbsensi?.status === 'Karyawan' && 'Anda adalah karyawan tetap perusahaan.'}
                {userAbsensi?.status === 'Magang' && 'Anda sedang menjalani program magang.'}
                {!userAbsensi?.status && 'Status akan diperbarui setelah data absensi tersedia.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informasi Tambahan */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-blue-800">Informasi Tambahan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-blue-600 font-medium">ID User</p>
              <p className="text-gray-700 font-mono text-xs">{user?.id}</p>
            </div>
            <div>
              <p className="text-blue-600 font-medium">Tanggal Bergabung</p>
              <p className="text-gray-700">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
