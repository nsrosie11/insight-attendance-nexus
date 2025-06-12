
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

const ProfilePage: React.FC = () => {
  const [userInfo, setUserInfo] = useState<{
    email: string;
    name: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    const getUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Get user info from absensi table (assuming nama field represents the user)
        const { data: absensiData } = await supabase
          .from('absensi')
          .select('nama, status')
          .limit(1);

        setUserInfo({
          email: user.email || '',
          name: absensiData?.[0]?.nama || 'User',
          status: absensiData?.[0]?.status || 'Karyawan'
        });
      }
    };

    getUserInfo();
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="bg-white/90 backdrop-blur-sm border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-blue-800 text-2xl">Profil Saya</CardTitle>
          <CardDescription className="text-blue-600">
            Informasi pribadi dan status karyawan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
            <div className="bg-blue-500 p-3 rounded-full">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-700">Nama</label>
              <p className="text-lg font-semibold text-blue-900">{userInfo?.name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
            <div className="bg-green-500 p-3 rounded-full">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-green-700">Email</label>
              <p className="text-lg font-semibold text-green-900">{userInfo?.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-orange-50 rounded-lg">
            <div className="bg-orange-500 p-3 rounded-full">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-orange-700">Status Karyawan</label>
              <p className="text-lg font-semibold text-orange-900">
                {userInfo?.status === 'Magang' ? 'Karyawan Magang' : 'Karyawan Tetap'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/90 backdrop-blur-sm border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-blue-800">Informasi Akun</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-blue-100">
              <span className="text-blue-700 font-medium">Role:</span>
              <span className="text-blue-900">Karyawan</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-blue-100">
              <span className="text-blue-700 font-medium">Status Akun:</span>
              <span className="text-green-600 font-medium">Aktif</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
