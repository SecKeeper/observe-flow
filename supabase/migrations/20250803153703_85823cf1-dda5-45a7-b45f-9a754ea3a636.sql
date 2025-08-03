-- Phase 1: Core Dashboard Management
-- Add dashboard_id column to alerts if it doesn't exist properly
-- Update dashboards table to have proper structure
-- Add foreign key constraints

-- First, let's make sure the dashboards table has the right structure
ALTER TABLE public.dashboards 
ADD COLUMN IF NOT EXISTS alert_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS active_alert_count INTEGER DEFAULT 0;

-- Add foreign key constraint from alerts to dashboards
ALTER TABLE public.alerts 
ADD CONSTRAINT alerts_dashboard_id_fkey 
FOREIGN KEY (dashboard_id) REFERENCES public.dashboards(id) ON DELETE CASCADE;

-- Create function to update dashboard alert counts
CREATE OR REPLACE FUNCTION public.update_dashboard_alert_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update counts for the affected dashboard
  UPDATE public.dashboards 
  SET 
    alert_count = (
      SELECT COUNT(*) 
      FROM public.alerts 
      WHERE dashboard_id = COALESCE(NEW.dashboard_id, OLD.dashboard_id)
    ),
    active_alert_count = (
      SELECT COUNT(*) 
      FROM public.alerts 
      WHERE dashboard_id = COALESCE(NEW.dashboard_id, OLD.dashboard_id) 
      AND is_active = true
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.dashboard_id, OLD.dashboard_id);
  
  -- If dashboard_id changed, update the old dashboard too
  IF TG_OP = 'UPDATE' AND OLD.dashboard_id IS DISTINCT FROM NEW.dashboard_id THEN
    UPDATE public.dashboards 
    SET 
      alert_count = (
        SELECT COUNT(*) 
        FROM public.alerts 
        WHERE dashboard_id = OLD.dashboard_id
      ),
      active_alert_count = (
        SELECT COUNT(*) 
        FROM public.alerts 
        WHERE dashboard_id = OLD.dashboard_id 
        AND is_active = true
      ),
      updated_at = now()
    WHERE id = OLD.dashboard_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for alert count updates
DROP TRIGGER IF EXISTS update_dashboard_counts_trigger ON public.alerts;
CREATE TRIGGER update_dashboard_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_dashboard_alert_counts();

-- Create dashboard access table for sharing dashboards
CREATE TABLE IF NOT EXISTS public.dashboard_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  access_level TEXT NOT NULL CHECK (access_level IN ('admin', 'editor', 'reader')),
  granted_by UUID,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(dashboard_id, user_id)
);

-- Enable RLS on dashboard_access
ALTER TABLE public.dashboard_access ENABLE ROW LEVEL SECURITY;

-- RLS policies for dashboard_access
CREATE POLICY "Users can view dashboard access they're part of"
ON public.dashboard_access FOR SELECT
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.dashboards 
    WHERE id = dashboard_id AND owner_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.dashboard_access da2
    WHERE da2.dashboard_id = dashboard_access.dashboard_id 
    AND da2.user_id = auth.uid() 
    AND da2.access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Dashboard owners can manage access"
ON public.dashboard_access FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.dashboards 
    WHERE id = dashboard_id AND owner_id = auth.uid()
  )
);

-- Update dashboard RLS policies to include shared access
DROP POLICY IF EXISTS "Users can view dashboards they have access to" ON public.dashboards;
CREATE POLICY "Users can view dashboards they have access to"
ON public.dashboards FOR SELECT
USING (
  auth.uid() = owner_id OR
  is_public = true OR
  EXISTS (
    SELECT 1 FROM public.dashboard_access
    WHERE dashboard_id = dashboards.id AND user_id = auth.uid()
  )
);

-- Create some sample dashboards for the current user
INSERT INTO public.dashboards (name, description, owner_id, is_public)
SELECT 
  'Security Operations Center',
  'Main dashboard for security monitoring and incident response',
  auth.uid(),
  false
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.dashboards (name, description, owner_id, is_public)
SELECT 
  'Compliance Monitoring',
  'Dashboard for tracking compliance-related security alerts',
  auth.uid(),
  false
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.dashboards (name, description, owner_id, is_public)
SELECT 
  'Threat Intelligence',
  'Dashboard for threat hunting and intelligence gathering',
  auth.uid(),
  false
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

-- Update existing alerts to belong to the first dashboard
UPDATE public.alerts 
SET dashboard_id = (
  SELECT id FROM public.dashboards 
  WHERE owner_id = alerts.created_by 
  LIMIT 1
)
WHERE dashboard_id IS NULL OR dashboard_id NOT IN (SELECT id FROM public.dashboards);

-- If no dashboard exists for an alert, create a default one
INSERT INTO public.dashboards (name, description, owner_id, is_public)
SELECT DISTINCT
  'Default Security Dashboard',
  'Default dashboard for security alerts',
  alerts.created_by,
  false
FROM public.alerts
WHERE alerts.dashboard_id IS NULL 
AND alerts.created_by NOT IN (SELECT owner_id FROM public.dashboards)
ON CONFLICT DO NOTHING;

-- Update any remaining alerts without dashboards
UPDATE public.alerts 
SET dashboard_id = (
  SELECT d.id FROM public.dashboards d
  WHERE d.owner_id = alerts.created_by 
  LIMIT 1
)
WHERE dashboard_id IS NULL;

-- Refresh dashboard counts
SELECT public.update_dashboard_alert_counts() FROM public.alerts LIMIT 1;