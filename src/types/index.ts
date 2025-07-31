// AlertFlow Types

export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';
export type AccessLevel = 'Owner' | 'Editor' | 'Read-only';

export interface User {
  id: string;
  user_id: string;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'read-only';
  created_at: string;
  updated_at: string;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  owner: User;
  accessLevel: AccessLevel;
  alertCount: number;
  lastUpdated: string;
  createdAt: string;
}

export interface DashboardInvite {
  id: string;
  dashboardId: string;
  invitedBy: User;
  invitedUser: User;
  accessLevel: 'Editor' | 'Read-only';
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface Alert {
  id: string;
  dashboard_id: string;
  rule_name: string;
  short_description: string;
  description: string;
  impact: string;
  mitigation: string;
  false_positive_check: string;
  findings: string;
  severity: Severity;
  tags: string[];
  file_url?: string;
  external_url?: string;
  attached_file?: string;
  is_active: boolean;
  assigned_to?: string;
  is_in_progress: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AlertFormData {
  rule_name: string;
  short_description: string;
  description: string;
  impact: string;
  mitigation: string;
  false_positive_check: string;
  findings: string;
  severity: Severity;
  tags: string;
  file?: File;
  external_url?: string;
}