
-- Create upload_history table to store Excel upload records
CREATE TABLE IF NOT EXISTS public.upload_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  upload_month integer NOT NULL CHECK (upload_month >= 1 AND upload_month <= 12),
  upload_year integer NOT NULL CHECK (upload_year >= 2020 AND upload_year <= 2030),
  upload_date timestamp with time zone NOT NULL DEFAULT now(),
  records_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.upload_history ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view all upload history
CREATE POLICY "Admins can view all upload history" 
ON public.upload_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create policy for admins to insert upload history
CREATE POLICY "Admins can insert upload history" 
ON public.upload_history 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_upload_history_period ON public.upload_history(upload_year, upload_month);
CREATE INDEX IF NOT EXISTS idx_upload_history_date ON public.upload_history(upload_date DESC);
