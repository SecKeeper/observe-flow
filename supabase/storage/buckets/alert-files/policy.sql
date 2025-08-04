-- Storage bucket policies for alert-files
-- This bucket is used for storing alert attachments

-- Policy: Users can upload files to alert-files bucket
CREATE POLICY "Users can upload alert files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'alert-files' AND
  auth.uid() IS NOT NULL
);

-- Policy: Users can view files they uploaded or are admin
CREATE POLICY "Users can view their own alert files or admin can view all" ON storage.objects
FOR SELECT USING (
  bucket_id = 'alert-files' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
);

-- Policy: Users can update files they uploaded or are admin
CREATE POLICY "Users can update their own alert files or admin can update all" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'alert-files' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
);

-- Policy: Users can delete files they uploaded or are admin
CREATE POLICY "Users can delete their own alert files or admin can delete all" ON storage.objects
FOR DELETE USING (
  bucket_id = 'alert-files' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
); 