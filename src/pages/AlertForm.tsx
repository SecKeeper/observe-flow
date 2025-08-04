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
import { AlertFormData, Severity } from '@/types';
import { ArrowLeft, Upload, Calendar, Clock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AlertService, CategoryService, StorageService } from '@/lib/backend-services';

const AlertForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState<AlertFormData>({
    rule_name: '',
    short_description: '',
    description: '',
    impact: '',
    mitigation: '',
    false_positive_check: '',
    findings: '',
    severity: 'Medium',
    tags: '',
    external_url: '',
  });

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [categories, setCategories] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Fetch categories
      const categoriesData = await CategoryService.getCategories();
      setCategories(categoriesData || []);

      // Fetch user profile for role-based access
      if (user) {
        const profile = await AlertService.getUserProfile(user.id);
        setUserProfile(profile);
      }

      // Fetch alert data if editing
      if (isEditing && id) {
        await fetchAlert();
      }
    } catch (error: any) {
      console.error('Error fetching initial data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load initial data",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchAlert = async () => {
    if (!id) return;

    try {
      const alert = await AlertService.getAlert(id);

      if (alert) {
        setFormData({
          rule_name: alert.rule_name,
          short_description: alert.short_description,
          description: alert.description,
          impact: alert.impact,
          mitigation: alert.mitigation,
          false_positive_check: alert.false_positive_check,
          findings: alert.findings || '',
          severity: alert.severity as Severity,
          tags: alert.tags?.join(', ') || '',
          external_url: alert.external_url || '',
          category: alert.category || '',
          priority: alert.priority || 'medium',
          due_date: alert.due_date ? new Date(alert.due_date).toISOString().split('T')[0] : '',
          source: alert.source || '',
          confidence_score: alert.confidence_score || 0,
        });
      }
    } catch (error: any) {
      console.error('Error fetching alert:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load alert data",
      });
    }
  };

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
      const validTypes = ['.pcap', '.pcapng', '.txt', '.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
      const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
      
      if (!validTypes.some(type => fileExtension.endsWith(type.substring(1)))) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload a valid file type (.pcap, .txt, .pdf, .doc, .docx, .jpg, .png)",
        });
        return;
      }

      if (selectedFile.size > 50 * 1024 * 1024) { // 50MB limit
        toast({
          variant: "destructive",
          title: "File too large",
          description: "File size must be less than 50MB",
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleFileUpload = async () => {
    if (!file) return null;

    setUploading(true);
    try {
      const result = await StorageService.uploadAlertFile(file, 'temp-id');
      const fileUrl = result.file_url;
      toast({
        title: "File uploaded",
        description: "File uploaded successfully",
      });
      return fileUrl;
    } catch (error: any) {
      console.error('File upload failed:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Failed to upload file",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Upload file if selected
      let fileUrl = null;
      if (file) {
        fileUrl = await handleFileUpload();
      }

      const alertData = {
        dashboard_id: 'default-dashboard',
        rule_name: formData.rule_name,
        short_description: formData.short_description,
        description: formData.description,
        impact: formData.impact,
        mitigation: formData.mitigation,
        false_positive_check: formData.false_positive_check,
        findings: formData.findings,
        severity: formData.severity,
        tags: tagsArray,
        external_url: formData.external_url,
        category: formData.category,
        priority: formData.priority,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
        source: formData.source,
        confidence_score: formData.confidence_score,
        attached_file: fileUrl,
        is_active: true,
        is_in_progress: false,
        created_by: user.id
      };

      if (isEditing) {
        await AlertService.updateAlert(id, alertData);
      } else {
        await AlertService.createAlert(alertData);
      }

      toast({
        title: isEditing ? "Alert updated" : "Alert created",
        description: `The alert has been successfully ${isEditing ? 'updated' : 'created'}.`,
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error saving alert:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || `Failed to ${isEditing ? 'update' : 'create'} alert.`,
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
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
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
                  <Label htmlFor="rule_name">Rule Name *</Label>
                  <Input
                    id="rule_name"
                    value={formData.rule_name}
                    onChange={(e) => handleInputChange('rule_name', e.target.value)}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category || ''} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority || 'medium'} onValueChange={(value) => handleInputChange('priority', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="short_description">Short Description *</Label>
                <Input
                  id="short_description"
                  value={formData.short_description}
                  onChange={(e) => handleInputChange('short_description', e.target.value)}
                  required
                  placeholder="Brief one-line description for dashboard view..."
                  maxLength={150}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.short_description.length}/150 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Full Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  required
                  placeholder="Detailed description of what this alert detects"
                  rows={4}
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
                <Label htmlFor="false_positive_check">False Positive Check *</Label>
                <Textarea
                  id="false_positive_check"
                  value={formData.false_positive_check}
                  onChange={(e) => handleInputChange('false_positive_check', e.target.value)}
                  required
                  placeholder="Describe how to verify if this alert is a false positive"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="findings">Findings</Label>
                <Textarea
                  id="findings"
                  value={formData.findings}
                  onChange={(e) => handleInputChange('findings', e.target.value)}
                  placeholder="Investigation results and technical analysis"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    value={formData.source || ''}
                    onChange={(e) => handleInputChange('source', e.target.value)}
                    placeholder="Alert source (e.g., SIEM, IDS, Manual)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confidence_score">Confidence Score</Label>
                  <Input
                    id="confidence_score"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.confidence_score || 0}
                    onChange={(e) => handleInputChange('confidence_score', e.target.value)}
                    placeholder="0-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date || ''}
                    onChange={(e) => handleInputChange('due_date', e.target.value)}
                  />
                </div>
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
                <Label htmlFor="external_url">External URL</Label>
                <Input
                  id="external_url"
                  value={formData.external_url}
                  onChange={(e) => handleInputChange('external_url', e.target.value)}
                  placeholder="https://example.com/reference"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">File Upload (Optional)</Label>
                <div className="flex items-center space-x-4">
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    accept=".pcap,.pcapng,.txt,.pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="flex-1"
                    disabled={uploading}
                  />
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload PCAPs, documents, or reference files (max 50MB)
                </p>
                {file && (
                  <p className="text-sm text-primary">
                    Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                {uploading && (
                  <p className="text-sm text-blue-500">
                    Uploading file...
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || uploading}>
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