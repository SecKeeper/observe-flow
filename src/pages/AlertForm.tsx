import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { AlertFormData, Alert } from '@/types';
import { ArrowLeft, Upload } from 'lucide-react';

const AlertForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const { toast } = useToast();

  const [formData, setFormData] = useState<AlertFormData>({
    ruleName: '',
    description: '',
    impact: '',
    mitigation: '',
    falsePositiveCheck: '',
    severity: 'Medium',
    tags: '',
  });

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  useEffect(() => {
    if (isEditing) {
      // In real implementation, fetch the alert data
      // For now, use mock data
      const mockAlert: Alert = {
        id: '1',
        dashboardId: '1',
        ruleName: 'SQL Injection Detection',
        description: 'Detects potential SQL injection attempts in web requests',
        impact: 'Could lead to database compromise and data theft',
        mitigation: 'Implement input validation and parameterized queries',
        falsePositiveCheck: 'Verify the request contains actual SQL injection patterns',
        severity: 'Critical',
        tags: ['web', 'database', 'injection'],
        createdBy: { id: '1', username: 'admin', email: 'admin@alertflow.com', role: 'admin', createdAt: '2024-01-01T00:00:00Z' },
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
      };

      setFormData({
        ruleName: mockAlert.ruleName,
        description: mockAlert.description,
        impact: mockAlert.impact,
        mitigation: mockAlert.mitigation,
        falsePositiveCheck: mockAlert.falsePositiveCheck,
        severity: mockAlert.severity,
        tags: mockAlert.tags.join(', '),
      });
      setInitialLoading(false);
    }
  }, [isEditing, id]);

  const handleInputChange = (field: keyof AlertFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type and size
      const validTypes = ['.pcap', '.pcapng', '.txt', '.pdf', '.doc', '.docx'];
      const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
      
      if (!validTypes.some(type => fileExtension.endsWith(type.substring(1)))) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload a valid file type (.pcap, .txt, .pdf, .doc, .docx)",
        });
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          variant: "destructive",
          title: "File too large",
          description: "File size must be less than 10MB",
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('ruleName', formData.ruleName);
      submitData.append('description', formData.description);
      submitData.append('impact', formData.impact);
      submitData.append('mitigation', formData.mitigation);
      submitData.append('falsePositiveCheck', formData.falsePositiveCheck);
      submitData.append('severity', formData.severity);
      submitData.append('tags', formData.tags);
      
      if (file) {
        submitData.append('file', file);
      }

      const url = isEditing ? `/api/alerts/${id}` : '/api/alerts';
      const method = isEditing ? 'PUT' : 'POST';

      // In real implementation:
      // const response = await fetch(url, {
      //   method,
      //   body: submitData,
      // });

      // For demo purposes, simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: isEditing ? "Alert updated" : "Alert created",
        description: `The alert has been successfully ${isEditing ? 'updated' : 'created'}.`,
      });

      navigate('/dashboards');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} alert.`,
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/dashboards')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">
            {isEditing ? 'Edit Alert' : 'Create New Alert'}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Alert Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="ruleName">Rule Name *</Label>
                  <Input
                    id="ruleName"
                    value={formData.ruleName}
                    onChange={(e) => handleInputChange('ruleName', e.target.value)}
                    required
                    placeholder="Enter rule name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="severity">Severity *</Label>
                  <Select value={formData.severity} onValueChange={(value) => handleInputChange('severity', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  required
                  placeholder="Describe what this alert detects"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="impact">Impact *</Label>
                <Textarea
                  id="impact"
                  value={formData.impact}
                  onChange={(e) => handleInputChange('impact', e.target.value)}
                  required
                  placeholder="Describe the potential impact if this alert triggers"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mitigation">Mitigation *</Label>
                <Textarea
                  id="mitigation"
                  value={formData.mitigation}
                  onChange={(e) => handleInputChange('mitigation', e.target.value)}
                  required
                  placeholder="Describe how to mitigate or respond to this alert"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="falsePositiveCheck">False Positive Check *</Label>
                <Textarea
                  id="falsePositiveCheck"
                  value={formData.falsePositiveCheck}
                  onChange={(e) => handleInputChange('falsePositiveCheck', e.target.value)}
                  required
                  placeholder="Describe how to verify if this alert is a false positive"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="Enter tags separated by commas (e.g., web, database, injection)"
                />
                <p className="text-sm text-muted-foreground">
                  Separate multiple tags with commas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">File Upload (Optional)</Label>
                <div className="flex items-center space-x-4">
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    accept=".pcap,.pcapng,.txt,.pdf,.doc,.docx"
                    className="flex-1"
                  />
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload PCAPs, documents, or reference files (max 10MB)
                </p>
                {file && (
                  <p className="text-sm text-primary">
                    Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboards')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Alert' : 'Create Alert')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AlertForm;