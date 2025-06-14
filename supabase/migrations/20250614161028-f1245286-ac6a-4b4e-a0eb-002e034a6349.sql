
-- Drop existing policies that might be causing recursion
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all upload history" ON public.upload_history;
DROP POLICY IF EXISTS "Admins can insert upload history" ON public.upload_history;

-- Drop existing function and recreate it properly
DROP FUNCTION IF EXISTS public.get_user_role(uuid);

-- Create a proper security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.user_roles WHERE user_id = user_uuid LIMIT 1;
$$;

-- Create a simple policy for user_roles that doesn't cause recursion
CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

-- Create policies for upload_history using the security definer function
CREATE POLICY "Admins can view all upload history" 
ON public.upload_history 
FOR SELECT 
USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can insert upload history" 
ON public.upload_history 
FOR INSERT 
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');
