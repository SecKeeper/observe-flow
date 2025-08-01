-- 1. Role Escalation Request System
CREATE TABLE public.role_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  requested_role TEXT NOT NULL CHECK (requested_role IN ('editor')),
  justification TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for role_requests
ALTER TABLE public.role_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for role_requests
CREATE POLICY "Users can view their own role requests" 
ON public.role_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own role requests" 
ON public.role_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all role requests" 
ON public.role_requests 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

CREATE POLICY "Admins can update role requests" 
ON public.role_requests 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

-- 2. Audit Logging Table
CREATE TABLE public.alert_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES public.alerts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(user_id),
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  changes JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for alert_audit_log
ALTER TABLE public.alert_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for alert_audit_log
CREATE POLICY "Users can view all audit logs" 
ON public.alert_audit_log 
FOR SELECT 
USING (true);

-- 3. Full-Text Search Support
ALTER TABLE public.alerts ADD COLUMN search_vector tsvector;

CREATE INDEX alerts_search_idx ON public.alerts USING GIN (search_vector);

CREATE OR REPLACE FUNCTION alerts_search_vector_update() 
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.search_vector :=
    to_tsvector('english', coalesce(NEW.rule_name,'') || ' ' || coalesce(NEW.description,'') || ' ' || coalesce(NEW.findings,''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER alerts_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION alerts_search_vector_update();

-- 4. Alert Commenting System
CREATE TABLE public.alert_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES public.alerts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(user_id),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for alert_comments
ALTER TABLE public.alert_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for alert_comments
CREATE POLICY "Users can view all comments" 
ON public.alert_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create comments" 
ON public.alert_comments 
FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments" 
ON public.alert_comments 
FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments or admins can delete any" 
ON public.alert_comments 
FOR DELETE 
USING (
  auth.uid() = author_id 
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 5. Alert Status History
CREATE TABLE public.alert_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES public.alerts(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES public.profiles(user_id),
  from_state TEXT,
  to_state TEXT,
  change_type TEXT CHECK (change_type IN ('activation', 'assignment', 'progress')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for alert_status_log
ALTER TABLE public.alert_status_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for alert_status_log
CREATE POLICY "Users can view all status logs" 
ON public.alert_status_log 
FOR SELECT 
USING (true);

-- 6. Multiple File Attachments Support
CREATE TABLE public.alert_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES public.alerts(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  filename TEXT,
  file_size BIGINT,
  content_type TEXT,
  uploaded_by UUID REFERENCES public.profiles(user_id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for alert_files
ALTER TABLE public.alert_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for alert_files
CREATE POLICY "Users can view all alert files" 
ON public.alert_files 
FOR SELECT 
USING (true);

CREATE POLICY "Users can upload files" 
ON public.alert_files 
FOR INSERT 
WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own files or admins can delete any" 
ON public.alert_files 
FOR DELETE 
USING (
  auth.uid() = uploaded_by 
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 7. User Activity Logs
CREATE TABLE public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id),
  activity_type TEXT NOT NULL,
  details TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for user_activity_log
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_activity_log
CREATE POLICY "Users can view their own activity" 
ON public.user_activity_log 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity" 
ON public.user_activity_log 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

-- 8. Dashboard Table
CREATE TABLE public.dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES public.profiles(user_id),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for dashboards
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dashboards
CREATE POLICY "Users can view public dashboards" 
ON public.dashboards 
FOR SELECT 
USING (is_public = true);

CREATE POLICY "Users can view their own dashboards" 
ON public.dashboards 
FOR SELECT 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own dashboards" 
ON public.dashboards 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own dashboards" 
ON public.dashboards 
FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own dashboards" 
ON public.dashboards 
FOR DELETE 
USING (auth.uid() = owner_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_role_requests_updated_at
  BEFORE UPDATE ON public.role_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dashboards_updated_at
  BEFORE UPDATE ON public.dashboards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create audit triggers for alerts
CREATE OR REPLACE FUNCTION public.log_alert_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.alert_audit_log (alert_id, user_id, action, changes)
    VALUES (
      NEW.id,
      auth.uid(),
      'update',
      jsonb_build_object(
        'old', to_jsonb(OLD),
        'new', to_jsonb(NEW)
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.alert_audit_log (alert_id, user_id, action, changes)
    VALUES (
      OLD.id,
      auth.uid(),
      'delete',
      to_jsonb(OLD)
    );
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.alert_audit_log (alert_id, user_id, action, changes)
    VALUES (
      NEW.id,
      auth.uid(),
      'create',
      to_jsonb(NEW)
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER alert_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.log_alert_changes();

-- Create status logging trigger for alerts
CREATE OR REPLACE FUNCTION public.log_alert_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log activation changes
  IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
    INSERT INTO public.alert_status_log (alert_id, changed_by, from_state, to_state, change_type)
    VALUES (
      NEW.id,
      auth.uid(),
      CASE WHEN OLD.is_active THEN 'active' ELSE 'inactive' END,
      CASE WHEN NEW.is_active THEN 'active' ELSE 'inactive' END,
      'activation'
    );
  END IF;
  
  -- Log assignment changes
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO public.alert_status_log (alert_id, changed_by, from_state, to_state, change_type)
    VALUES (
      NEW.id,
      auth.uid(),
      COALESCE(OLD.assigned_to::text, 'unassigned'),
      COALESCE(NEW.assigned_to::text, 'unassigned'),
      'assignment'
    );
  END IF;
  
  -- Log progress changes
  IF OLD.is_in_progress IS DISTINCT FROM NEW.is_in_progress THEN
    INSERT INTO public.alert_status_log (alert_id, changed_by, from_state, to_state, change_type)
    VALUES (
      NEW.id,
      auth.uid(),
      CASE WHEN OLD.is_in_progress THEN 'in_progress' ELSE 'not_in_progress' END,
      CASE WHEN NEW.is_in_progress THEN 'in_progress' ELSE 'not_in_progress' END,
      'progress'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER alert_status_log_trigger
  AFTER UPDATE ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.log_alert_status_changes();