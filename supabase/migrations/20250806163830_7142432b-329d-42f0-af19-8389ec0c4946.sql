-- Create a default dashboard for alerts
INSERT INTO public.dashboards (id, name, description, owner_id, is_public) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Dashboard',
  'Default dashboard for alerts without specific dashboard assignment',
  (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1),
  true
) ON CONFLICT (id) DO NOTHING;