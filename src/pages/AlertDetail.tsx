import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import SeverityBadge from '@/components/SeverityBadge';
import { Alert } from '@/types';
import { ArrowLeft, Edit, Calendar, User, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const AlertDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [findings, setFindings] = useState('');
  const [editingFindings, setEditingFindings] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAlert();
    }
  }, [id]);

  const fetchAlert = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setAlert(data as any);
      setFindings(data?.findings || '');
    } catch (error: any) {
      console.error('Error fetching alert:', error);
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
      const { error } = await supabase
        .from('alerts')
        .update({ findings })
        .eq('id', alert.id);

      if (error) throw error;

      setAlert({ ...alert, findings });
      setEditingFindings(false);
      toast({
        title: "Findings updated",
        description: "Investigation findings have been saved.",
      });
    } catch (error: any) {
      console.error('Error updating findings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update findings.",
      });
    }
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Alert Details</h1>
          </div>
          <Button onClick={() => navigate(`/alerts/${alert.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Alert
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">{alert.rule_name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <SeverityBadge severity={alert.severity} />
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
                    {!editingFindings && (
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
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AlertDetail;