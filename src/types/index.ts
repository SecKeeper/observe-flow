export interface Alert {
  id: string;
  ruleName: string;
  description: string;
  impact: string;
  mitigation: string;
  falsePositiveCheck: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  tags: string[];
  fileUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlertFormData {
  ruleName: string;
  description: string;
  impact: string;
  mitigation: string;
  falsePositiveCheck: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  tags: string;
  file?: File;
}