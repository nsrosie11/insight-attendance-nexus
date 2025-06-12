
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Briefcase, Calendar } from 'lucide-react';

const ProfilePage: React.FC = () => {
  // Mock user data - in real app, this would come from authentication/user context
  const userData = {
    name: 'John Doe',
    email: 'john.doe@company.com',
    status: 'Tetap', // or 'Magang'
    joinDate: '15 Januari 2023',
    department: 'IT Development'
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profil Karyawan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-blue-600" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">{userData.name}</h2>
              <p className="text-gray-600">{userData.department}</p>
            </div>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <p className="text-gray-900">{userData.email}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Briefcase className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Status Karyawan</p>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    userData.status === 'Tetap' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {userData.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Tanggal Bergabung</p>
                  <p className="text-gray-900">{userData.joinDate}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <User className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Departemen</p>
                  <p className="text-gray-900">{userData.department}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informasi Tambahan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="font-medium text-gray-600">Jam Kerja</p>
              <p className="text-gray-900">08:00 - 17:00 WIB</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-gray-600">Hari Kerja</p>
              <p className="text-gray-900">Senin - Jumat</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-gray-600">Cuti Tersisa</p>
              <p className="text-gray-900">8 hari</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-gray-600">ID Karyawan</p>
              <p className="text-gray-900">EMP-2023-001</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
