-- Complete Backend Functionality Migration
-- This migration adds all missing features and enhances existing ones

-- 1. Enhanced User & Profile Management
-- Update profiles table to include additional fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create user sessions table for tracking active sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_sessions
CREATE POLICY "Users can view their own sessions"
ON public.user_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own sessions"
ON public.user_sessions FOR ALL
USING (auth.uid() = user_id);

-- 2. Enhanced Alerts Management
-- Add missing fields to alerts table
ALTER TABLE public.alerts 
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2) DEFAULT 1.00;

-- Create alert categories table
CREATE TABLE IF NOT EXISTS public.alert_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default categories
INSERT INTO public.alert_categories (name, description, color, icon) VALUES
  ('Security', 'Security-related alerts', '#EF4444', 'shield'),
  ('Performance', 'Performance and availability issues', '#F59E0B', 'activity'),
  ('Compliance', 'Compliance and regulatory alerts', '#8B5CF6', 'file-check'),
  ('Infrastructure', 'Infrastructure and system alerts', '#06B6D4', 'server'),
  ('Application', 'Application-specific alerts', '#10B981', 'code')
ON CONFLICT (name) DO NOTHING;

-- 3. Alert Sharing & Access Control
CREATE TABLE IF NOT EXISTS public.alert_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES public.alerts(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('read-only', 'edit')),
  shared_by UUID REFERENCES public.profiles(user_id),
  shared_link TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on alert_shares
ALTER TABLE public.alert_shares ENABLE ROW LEVEL SECURITY;

-- RLS policies for alert_shares
CREATE POLICY "Users can view shares they created or are shared with"
ON public.alert_shares FOR SELECT
USING (
  auth.uid() = shared_by OR
  shared_with_email = (SELECT email FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Alert creators and admins can manage shares"
ON public.alert_shares FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.alerts 
    WHERE id = alert_id AND created_by = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 4. Enhanced Audit Log
CREATE TABLE IF NOT EXISTS public.alert_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES public.alerts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(user_id),
  action TEXT NOT NULL,
  description TEXT,
  old_values JSONB,
  new_values JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on alert_logs
ALTER TABLE public.alert_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for alert_logs
CREATE POLICY "Users can view logs for alerts they have access to"
ON public.alert_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.alerts 
    WHERE id = alert_id AND (
      created_by = auth.uid() OR
      assigned_to = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
      )
    )
  )
);

-- 5. Admin Dashboard Analytics Views
CREATE OR REPLACE VIEW public.alert_analytics AS
SELECT 
  COUNT(*) as total_alerts,
  COUNT(*) FILTER (WHERE is_active = true) as active_alerts,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_alerts,
  COUNT(*) FILTER (WHERE assigned_to IS NULL) as unassigned_alerts,
  COUNT(*) FILTER (WHERE is_in_progress = true) as in_progress_alerts,
  COUNT(*) FILTER (WHERE severity = 'Critical') as critical_alerts,
  COUNT(*) FILTER (WHERE severity = 'High') as high_alerts,
  COUNT(*) FILTER (WHERE severity = 'Medium') as medium_alerts,
  COUNT(*) FILTER (WHERE severity = 'Low') as low_alerts,
  AVG(EXTRACT(EPOCH FROM (now() - created_at))/3600) as avg_age_hours
FROM public.alerts;

CREATE OR REPLACE VIEW public.user_alert_stats AS
SELECT 
  p.user_id,
  p.username,
  p.email,
  p.role,
  COUNT(a.id) as total_alerts_created,
  COUNT(a.id) FILTER (WHERE a.is_active = true) as active_alerts_created,
  COUNT(a.id) FILTER (WHERE a.assigned_to = p.user_id) as assigned_alerts,
  COUNT(a.id) FILTER (WHERE a.assigned_to = p.user_id AND a.is_in_progress = true) as in_progress_assigned,
  AVG(EXTRACT(EPOCH FROM (now() - a.created_at))/3600) FILTER (WHERE a.created_by = p.user_id) as avg_alert_age_hours
FROM public.profiles p
LEFT JOIN public.alerts a ON p.user_id = a.created_by OR p.user_id = a.assigned_to
GROUP BY p.user_id, p.username, p.email, p.role;

-- 6. Enhanced Functions
-- Function to assign alert to user (admin only)
CREATE OR REPLACE FUNCTION public.assign_alert(alert_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can assign alerts';
  END IF;
  
  -- Update alert assignment
  UPDATE public.alerts 
  SET assigned_to = assign_alert.user_id, updated_at = now()
  WHERE id = assign_alert.alert_id;
  
  -- Log the assignment
  INSERT INTO public.alert_logs (alert_id, user_id, action, description, new_values)
  VALUES (
    assign_alert.alert_id, 
    auth.uid(), 
    'assign', 
    'Alert assigned to user', 
    jsonb_build_object('assigned_to', assign_alert.user_id)
  );
  
  RETURN FOUND;
END;
$$;

-- Function to toggle alert status
CREATE OR REPLACE FUNCTION public.toggle_alert_status(alert_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_status BOOLEAN;
BEGIN
  -- Get current status
  SELECT is_active INTO current_status FROM public.alerts WHERE id = alert_id;
  
  -- Check permissions
  IF NOT EXISTS (
    SELECT 1 FROM public.alerts 
    WHERE id = alert_id AND (
      created_by = auth.uid() OR
      assigned_to = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
      )
    )
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to toggle alert status';
  END IF;
  
  -- Toggle status
  UPDATE public.alerts 
  SET is_active = NOT current_status, updated_at = now()
  WHERE id = alert_id;
  
  -- Log the change
  INSERT INTO public.alert_logs (alert_id, user_id, action, description, old_values, new_values)
  VALUES (
    alert_id, 
    auth.uid(), 
    'toggle_status', 
    'Alert status toggled', 
    jsonb_build_object('is_active', current_status),
    jsonb_build_object('is_active', NOT current_status)
  );
  
  RETURN FOUND;
END;
$$;

-- Function to mark alert in progress
CREATE OR REPLACE FUNCTION public.mark_in_progress(alert_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is assigned to this alert
  IF NOT EXISTS (
    SELECT 1 FROM public.alerts 
    WHERE id = alert_id AND assigned_to = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only assigned users can mark alerts in progress';
  END IF;
  
  -- Update progress status
  UPDATE public.alerts 
  SET is_in_progress = true, updated_at = now()
  WHERE id = alert_id;
  
  -- Log the change
  INSERT INTO public.alert_logs (alert_id, user_id, action, description, new_values)
  VALUES (
    alert_id, 
    auth.uid(), 
    'mark_in_progress', 
    'Alert marked as in progress', 
    jsonb_build_object('is_in_progress', true)
  );
  
  RETURN FOUND;
END;
$$;

-- Function to log alert changes
CREATE OR REPLACE FUNCTION public.log_alert_change(alert_id UUID, action TEXT, description TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.alert_logs (alert_id, user_id, action, description)
  VALUES (alert_id, auth.uid(), action, description);
END;
$$;

-- 7. Enhanced Triggers
-- Trigger to log all alert changes
CREATE OR REPLACE FUNCTION public.log_alert_changes_enhanced()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  changes JSONB;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    changes = jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    );
    
    INSERT INTO public.alert_logs (alert_id, user_id, action, description, old_values, new_values)
    VALUES (
      NEW.id,
      auth.uid(),
      'update',
      'Alert updated',
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.alert_logs (alert_id, user_id, action, description, old_values)
    VALUES (
      OLD.id,
      auth.uid(),
      'delete',
      'Alert deleted',
      to_jsonb(OLD)
    );
    
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.alert_logs (alert_id, user_id, action, description, new_values)
    VALUES (
      NEW.id,
      auth.uid(),
      'create',
      'Alert created',
      to_jsonb(NEW)
    );
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create enhanced trigger
DROP TRIGGER IF EXISTS alert_logs_enhanced_trigger ON public.alerts;
CREATE TRIGGER alert_logs_enhanced_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.log_alert_changes_enhanced();

-- 8. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_alerts_assigned_to ON public.alerts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON public.alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_is_active ON public.alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_alerts_is_in_progress ON public.alerts(is_in_progress);
CREATE INDEX IF NOT EXISTS idx_alerts_tags ON public.alerts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_alerts_created_by ON public.alerts(created_by);
CREATE INDEX IF NOT EXISTS idx_alerts_dashboard_id ON public.alerts(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_alerts_category ON public.alerts(category);
CREATE INDEX IF NOT EXISTS idx_alerts_source ON public.alerts(source);

-- Indexes for alert_logs
CREATE INDEX IF NOT EXISTS idx_alert_logs_alert_id ON public.alert_logs(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_logs_user_id ON public.alert_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_logs_timestamp ON public.alert_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_alert_logs_action ON public.alert_logs(action);

-- Indexes for alert_shares
CREATE INDEX IF NOT EXISTS idx_alert_shares_alert_id ON public.alert_shares(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_shares_shared_with_email ON public.alert_shares(shared_with_email);
CREATE INDEX IF NOT EXISTS idx_alert_shares_shared_link ON public.alert_shares(shared_link);

-- 9. Storage Bucket Configuration
-- Note: Storage buckets need to be created via Supabase dashboard or CLI
-- This is a reference for the bucket structure

-- Bucket: alert-files
-- - For attached files (attached_file)
-- - Permissions: Only uploader and admin can access/replace
-- - Signed URLs for frontend access

-- Bucket: report-exports  
-- - For exported CSV/PDF reports
-- - Permissions: Only admin can access
-- - Signed URLs for frontend access

-- 10. Enhanced RLS Policies
-- Update existing alert policies to include new fields
DROP POLICY IF EXISTS "Users can update their own alerts or if they are admin/editor" ON public.alerts;
CREATE POLICY "Users can update their own alerts or if they are admin/editor" 
ON public.alerts 
FOR UPDATE 
USING (
  auth.uid() = created_by OR 
  auth.uid() = assigned_to OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'editor')
  )
);

-- Add policy for assigned users to update progress
CREATE POLICY "Assigned users can update progress fields"
ON public.alerts 
FOR UPDATE 
USING (
  auth.uid() = assigned_to
)
WITH CHECK (
  auth.uid() = assigned_to AND
  -- Only allow updating progress-related fields
  (OLD.is_in_progress IS DISTINCT FROM NEW.is_in_progress OR
   OLD.findings IS DISTINCT FROM NEW.findings OR
   OLD.resolution_notes IS DISTINCT FROM NEW.resolution_notes)
);

-- 11. Utility Functions
-- Function to get user's accessible alerts
CREATE OR REPLACE FUNCTION public.get_user_alerts(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  rule_name TEXT,
  short_description TEXT,
  severity TEXT,
  is_active BOOLEAN,
  is_in_progress BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  assigned_to UUID,
  created_by UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.rule_name,
    a.short_description,
    a.severity,
    a.is_active,
    a.is_in_progress,
    a.created_at,
    a.assigned_to,
    a.created_by
  FROM public.alerts a
  WHERE 
    a.created_by = user_uuid OR
    a.assigned_to = user_uuid OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = user_uuid AND role IN ('admin', 'editor')
    )
  ORDER BY a.created_at DESC;
END;
$$;

-- Function to get alert statistics for dashboard
CREATE OR REPLACE FUNCTION public.get_alert_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_alerts', COUNT(*),
    'active_alerts', COUNT(*) FILTER (WHERE is_active = true),
    'inactive_alerts', COUNT(*) FILTER (WHERE is_active = false),
    'unassigned_alerts', COUNT(*) FILTER (WHERE assigned_to IS NULL),
    'in_progress_alerts', COUNT(*) FILTER (WHERE is_in_progress = true),
    'severity_breakdown', jsonb_build_object(
      'critical', COUNT(*) FILTER (WHERE severity = 'Critical'),
      'high', COUNT(*) FILTER (WHERE severity = 'High'),
      'medium', COUNT(*) FILTER (WHERE severity = 'Medium'),
      'low', COUNT(*) FILTER (WHERE severity = 'Low')
    ),
    'avg_age_hours', AVG(EXTRACT(EPOCH FROM (now() - created_at))/3600)
  ) INTO stats
  FROM public.alerts;
  
  RETURN stats;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.assign_alert(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_alert_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_in_progress(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_alert_change(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_alerts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_alert_stats() TO authenticated;

-- Grant access to views
GRANT SELECT ON public.alert_analytics TO authenticated;
GRANT SELECT ON public.user_alert_stats TO authenticated; 