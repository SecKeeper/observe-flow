// AlertFlow Types

export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';
export type AccessLevel = 'Owner' | 'Editor' | 'Read-only';

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
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
  dashboardId: string;
  ruleName: string;
  shortDescription: string;
  description: string;
  impact: string;
  mitigation: string;
  falsePositiveCheck: string;
  severity: Severity;
  tags: string[];
  fileUrl?: string;
  externalUrl?: string;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface AlertFormData {
  ruleName: string;
  description: string;
  impact: string;
  mitigation: string;
  falsePositiveCheck: string;
  severity: Severity;
  tags: string;
  file?: File;
  externalUrl?: string;
}