import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import SeverityBadge from '@/components/SeverityBadge';
import AlertSharingModal from '@/components/AlertSharingModal';
import ExportControls from '@/components/ExportControls';
import FileUpload from '@/components/FileUpload';
import { Alert } from '@/types';
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  User, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  Share2, 
  FileText,
  Clock,
  Target,
  Shield,
  BarChart3,
  History
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AlertService, AuditLogService, StorageService } from '@/lib/backend-services';

const AlertDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [findings, setFindings] = useState('');
  const [editingFindings, setEditingFindings] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [attachedFileUrl, setAttachedFileUrl] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchAlertData();
    }
  }, [id]);

  const fetchAlertData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // Fetch alert details
      const alertData = await AlertService.getAlert(id);
      setAlert(alertData);
      setFindings(alertData?.findings || '');
      setAttachedFileUrl(alertData?.attached_file || '');

      // Fetch user profile for role-based access
      if (user) {
        const profile = await AlertService.getUserProfile(user.id);
        setUserProfile(profile);
      }

      // Fetch audit logs
      const logs = await AuditLogService.getAlertLogs(id);
      setAuditLogs(logs || []);
    } catch (error: any) {
      console.error('Error fetching alert data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch alert details.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFindings = async () => {
    if (!alert || !user) return;

    try {
      await AlertService.updateAlert(alert.id, { findings });
      setAlert({ ...alert, findings });
      setEditingFindings(false);
      
      toast({
        title: "Findings updated",
        description: "Investigation findings have been saved.",
      });

      // Refresh audit logs
      const logs = await AuditLogService.getAlertLogs(alert.id);
      setAuditLogs(logs || []);
    } catch (error: any) {
      console.error('Error updating findings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update findings.",
      });
    }
  };

  const handleMarkInProgress = async () => {
    if (!alert) return;

    try {
      await AlertService.markInProgress(alert.id);
      setAlert({ ...alert, is_in_progress: true });
      
      toast({
        title: "Status updated",
        description: "Alert marked as in progress.",
      });

      // Refresh audit logs
      const logs = await AuditLogService.getAlertLogs(alert.id);
      setAuditLogs(logs || []);
    } catch (error: any) {
      console.error('Error marking in progress:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to mark alert in progress.",
      });
    }
  };

  const handleToggleStatus = async () => {
    if (!alert) return;

    try {
      await AlertService.toggleAlertStatus(alert.id);
      setAlert({ ...alert, is_in_progress: !alert.is_in_progress });
      
      toast({
        title: "Status updated",
        description: `Alert status changed to ${!alert.is_in_progress ? 'Working' : 'Idle'}.`,
      });

      // Refresh audit logs
      const logs = await AuditLogService.getAlertLogs(alert.id);
      setAuditLogs(logs || []);
    } catch (error: any) {
      console.error('Error toggling status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update status.",
      });
    }
  };

  const handleFileUpload = (fileUrl: string) => {
    setAttachedFileUrl(fileUrl);
    if (alert) {
      setAlert({ ...alert, attached_file: fileUrl });
    }
  };

  const canEdit = () => {
    if (!userProfile || !alert) return false;
    if (userProfile.role === 'admin') return true;
    if (userProfile.role === 'editor') return true;
    if (alert.created_by === user?.id) return true;
    if (alert.assigned_to === user?.id) return true;
    return false;
  };

  const canDelete = () => {
    if (!userProfile || !alert) return false;
    if (userProfile.role === 'admin') return true;
    if (alert.created_by === user?.id) return true;
    return false;
  };

  const canAssign = () => {
    return userProfile?.role === 'admin';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!alert) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Alert Not Found</h2>
          <p className="text-muted-foreground mb-6">The requested alert could not be found.</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Alert Details</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowExportModal(true)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSharingModal(true)}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            {canEdit() && (
              <Button onClick={() => navigate(`/alerts/${alert.id}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Alert
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            {/* Main Alert Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">{alert.rule_name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <SeverityBadge severity={alert.severity} />
                    {alert.category && (
                      <Badge variant="outline">{alert.category}</Badge>
                    )}
                    {alert.priority && (
                      <Badge variant="outline">{alert.priority}</Badge>
                    )}
                    {alert.is_active ? (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                    <Badge variant={alert.is_in_progress ? "default" : "outline"}>
                      {alert.is_in_progress ? 'Working' : 'Idle'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Short Description</h3>
                  <p className="text-foreground leading-relaxed">{alert.short_description}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Description</h3>
                  <p className="text-foreground leading-relaxed">{alert.description}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Impact</h3>
                  <p className="text-foreground leading-relaxed">{alert.impact}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Mitigation</h3>
                  <p className="text-foreground leading-relaxed">{alert.mitigation}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">False Positive Check</h3>
                  <p className="text-foreground leading-relaxed">{alert.false_positive_check}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">Findings</h3>
                    {canEdit() && !editingFindings && (
                      <Button variant="outline" size="sm" onClick={() => setEditingFindings(true)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                  {editingFindings ? (
                    <div className="space-y-2">
                      <Textarea
                        value={findings}
                        onChange={(e) => setFindings(e.target.value)}
                        placeholder="Add investigation findings and analysis..."
                        rows={6}
                      />
                      <div className="flex space-x-2">
                        <Button onClick={handleSaveFindings}>Save</Button>
                        <Button variant="outline" onClick={() => {
                          setFindings(alert.findings || '');
                          setEditingFindings(false);
                        }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-foreground leading-relaxed">
                      {alert.findings || 'No findings recorded yet.'}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {alert.tags?.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Attached Files */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Attached Files</h3>
                  <FileUpload
                    onUploadComplete={handleFileUpload}
                    existingFileUrl={attachedFileUrl}
                    bucket="alert-files"
                    maxSize={50}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Audit Log */}
            {auditLogs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <History className="h-5 w-5" />
                    <span>Activity Log</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {auditLogs.map((log, index) => (
                      <div key={log.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{log.action}</p>
                            <span className="text-sm text-muted-foreground">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{log.description}</p>
                          {log.user_id && (
                            <p className="text-xs text-muted-foreground">
                              By: {log.user_id}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Alert Information */}
            <Card>
              <CardHeader>
                <CardTitle>Alert Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Created By</p>
                    <p className="text-sm text-muted-foreground">{alert.created_by}</p>
                  </div>
                </div>

                {alert.assigned_to && (
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Assigned To</p>
                      <p className="text-sm text-muted-foreground">{alert.assigned_to}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(alert.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {alert.due_date && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Due Date</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(alert.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                {alert.source && (
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Source</p>
                      <p className="text-sm text-muted-foreground">{alert.source}</p>
                    </div>
                  </div>
                )}

                {alert.confidence_score && (
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Confidence</p>
                      <p className="text-sm text-muted-foreground">{alert.confidence_score}%</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {canEdit() && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleToggleStatus}
                    >
                      {alert.is_in_progress ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Idle
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Mark as Working
                        </>
                      )}
                    </Button>

                    {!alert.is_in_progress && (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={handleMarkInProgress}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Mark In Progress
                      </Button>
                    )}
                  </>
                )}

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowSharingModal(true)}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Alert
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowExportModal(true)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>

                {alert.external_url && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(alert.external_url, '_blank')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View External Link
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modals */}
        <AlertSharingModal
          alertId={alert.id}
          alertName={alert.rule_name}
          isOpen={showSharingModal}
          onClose={() => setShowSharingModal(false)}
        />

        <ExportControls
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          defaultFilters={{ id: alert.id }}
        />
      </div>
    </Layout>
  );
};

export default AlertDetail;