-- Fix Phase 1: Clean up orphaned dashboard references first
-- Remove foreign key constraint temporarily and clean up data

-- Drop the foreign key constraint if it exists
ALTER TABLE public.alerts DROP CONSTRAINT IF EXISTS alerts_dashboard_id_fkey;

-- Add columns to dashboards table if they don't exist
ALTER TABLE public.dashboards 
ADD COLUMN IF NOT EXISTS alert_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS active_alert_count INTEGER DEFAULT 0;

-- Create some sample dashboards first
INSERT INTO public.dashboards (id, name, description, owner_id, is_public)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'Security Operations Center', 'Main dashboard for security monitoring and incident response', '550e8400-e29b-41d4-a716-446655440001', false),
  ('550e8400-e29b-41d4-a716-446655440002', 'Compliance Monitoring', 'Dashboard for tracking compliance-related security alerts', '550e8400-e29b-41d4-a716-446655440001', false),
  ('550e8400-e29b-41d4-a716-446655440003', 'Threat Intelligence', 'Dashboard for threat hunting and intelligence gathering', '550e8400-e29b-41d4-a716-446655440001', false)
ON CONFLICT (id) DO NOTHING;

-- Update all alerts to use the first dashboard
UPDATE public.alerts 
SET dashboard_id = '550e8400-e29b-41d4-a716-446655440000';

-- Now add the foreign key constraint
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

-- Update dashboard counts
UPDATE public.dashboards 
SET 
  alert_count = (SELECT COUNT(*) FROM public.alerts WHERE dashboard_id = dashboards.id),
  active_alert_count = (SELECT COUNT(*) FROM public.alerts WHERE dashboard_id = dashboards.id AND is_active = true);