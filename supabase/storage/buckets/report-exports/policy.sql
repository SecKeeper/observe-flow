-- Storage bucket policies for report-exports
-- This bucket is used for storing exported reports (CSV, PDF, etc.)

-- Policy: Only admins can upload report exports
CREATE POLICY "Only admins can upload report exports" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'report-exports' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Only admins can view report exports
CREATE POLICY "Only admins can view report exports" ON storage.objects
FOR SELECT USING (
  bucket_id = 'report-exports' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Only admins can update report exports
CREATE POLICY "Only admins can update report exports" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'report-exports' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Only admins can delete report exports
CREATE POLICY "Only admins can delete report exports" ON storage.objects
FOR DELETE USING (
  bucket_id = 'report-exports' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
); 