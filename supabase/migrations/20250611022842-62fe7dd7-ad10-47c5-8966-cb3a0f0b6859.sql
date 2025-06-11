
-- Buat enum untuk role
CREATE TYPE public.user_role AS ENUM ('admin', 'user');

-- Buat tabel user_roles untuk menyimpan role setiap user
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy untuk user bisa lihat role mereka sendiri
CREATE POLICY "Users can view their own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Policy untuk admin bisa lihat semua role (nanti bisa ditambah jika perlu)
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy untuk admin bisa insert/update role
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Buat function untuk check role user
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role FROM public.user_roles WHERE user_id = user_uuid;
$$;

-- Buat function untuk auto-assign role 'user' ketika user baru signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

-- Buat trigger untuk auto-assign role
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert admin role untuk testing (ganti dengan email admin yang sebenarnya)
-- Setelah ada user yang signup, jalankan ini untuk buat admin:
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ((SELECT id FROM auth.users WHERE email = 'admin@example.com'), 'admin')
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
