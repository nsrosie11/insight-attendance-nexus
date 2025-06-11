
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, User, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const UserAbsensiView: React.FC = () => {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const { data: absensiData, isLoading } = useQuery({
    queryKey: ['userAbsensi', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      
      // Extract nama from email (before @)
      const nama = user.email.split('@')[0];
      
      const { data, error } = await supabase
        .from('absensi')
        .select('*')
        .ilike('nama', `%${nama}%`)
        .order('tanggal', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.email,
  });

  const stats = React.useMemo(() => {
    if (!absensiData) return { hadir: 0, terlambat: 0, tidakHadir: 0 };
    
    const hadir = absensiData.filter(item => item.jam_masuk).length;
    const terlambat = absensiData.filter(item => item.terlambat).length;
    const tidakHadir = absensiData.filter(item => !item.jam_masuk).length;
    
    return { hadir, terlambat, tidakHadir };
  }, [absensiData]);

  const getStatusColor = (item: any) => {
    if (!item.jam_masuk) return 'bg-gray-800'; // Tidak hadir
    if (item.terlambat) return 'bg-red-500'; // Terlambat
    return 'bg-blue-500'; // Hadir tepat waktu
  };

  const getStatusText = (item: any) => {
    if (!item.jam_masuk) return 'Tidak Hadir';
    if (item.terlambat) return 'Terlambat';
    return 'Hadir';
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-800 mb-2">Info Absensi Saya</h1>
        <p className="text-blue-600">Ringkasan kehadiran dan detail absensi</p>
      </div>

      {/* Statistik Kehadiran */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Hadir</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{stats.hadir}</div>
            <p className="text-xs text-green-600">Total hari hadir</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Terlambat</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats.terlambat}</div>
            <p className="text-xs text-red-600">Total hari terlambat</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-800">Tidak Hadir</CardTitle>
            <XCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-700">{stats.tidakHadir}</div>
            <p className="text-xs text-gray-600">Total hari tidak hadir</p>
          </CardContent>
        </Card>
      </div>

      {/* Kalender Visual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Kalender Kehadiran
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {absensiData?.slice(0, 21).map((item, index) => (
              <div
                key={index}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${getStatusColor(item)}`}
                title={`${item.tanggal} - ${getStatusText(item)}`}
              >
                {new Date(item.tanggal).getDate()}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span>Hadir</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span>Terlambat</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-800 rounded-full"></div>
              <span>Tidak Hadir</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Detail Absensi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Detail Absensi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jam Masuk</TableHead>
                <TableHead>Jam Pulang</TableHead>
                <TableHead>Keterangan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {absensiData?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{new Date(item.tanggal).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell>{item.jam_masuk || '-'}</TableCell>
                  <TableCell>{item.jam_pulang || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      !item.jam_masuk ? 'bg-gray-100 text-gray-800' :
                      item.terlambat ? 'bg-red-100 text-red-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {getStatusText(item)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserAbsensiView;
