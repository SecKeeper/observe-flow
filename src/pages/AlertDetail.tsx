import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import SeverityBadge from '@/components/SeverityBadge';
import { Alert } from '@/types';
import { ArrowLeft, Edit, Calendar, User, Download } from 'lucide-react';

const AlertDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlert = async () => {
      setLoading(true);
      try {
        // In real implementation:
        // const response = await fetch(`/api/alerts/${id}`);
        // const data = await response.json();
        // setAlert(data);

        // For demo purposes, use mock data
        const mockAlert: Alert = {
          id: id || '1',
          dashboardId: '1',
          ruleName: 'SQL Injection Detection',
          description: 'This alert monitors web application traffic for patterns that indicate SQL injection attempts. It analyzes HTTP request parameters, form data, and URL parameters for common SQL injection signatures including UNION SELECT statements, comment sequences, and time-based blind injection patterns.',
          impact: 'A successful SQL injection attack could lead to unauthorized database access, data exfiltration, data manipulation, or complete database compromise. Attackers may be able to bypass authentication, escalate privileges, or gain administrative access to the application and underlying database server.',
          mitigation: 'Immediately implement parameterized queries and prepared statements for all database interactions. Validate and sanitize all user input on both client and server sides. Apply the principle of least privilege to database connections. Enable Web Application Firewall (WAF) rules to block common injection patterns. Conduct regular security code reviews and penetration testing.',
          falsePositiveCheck: 'Verify that the detected pattern is not part of legitimate application functionality such as search queries containing SQL-like keywords, legitimate database administration tools, or automated testing scripts. Check if the source IP belongs to authorized security scanners or development tools. Review the full request context and user session to determine intent.',
          severity: 'Critical',
          tags: ['web', 'database', 'injection', 'owasp-top10'],
          fileUrl: '/uploads/sql-injection-samples.pcap',
          createdBy: { id: '1', username: 'security_admin', email: 'admin@alertflow.com', role: 'admin', createdAt: '2024-01-01T00:00:00Z' },
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-20T14:45:00Z',
        };

        setTimeout(() => {
          setAlert(mockAlert);
          setLoading(false);
        }, 500);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch alert details.",
        });
        setLoading(false);
      }
    };

    if (id) {
      fetchAlert();
    }
  }, [id, toast]);

  const handleDownloadFile = () => {
    if (alert?.fileUrl) {
      // In real implementation, this would download the file
      toast({
        title: "Download started",
        description: "The file download has begun.",
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
          <Button onClick={() => navigate('/dashboards')}>
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
            <Button variant="outline" onClick={() => navigate('/dashboards')}>
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
                  <CardTitle className="text-2xl">{alert.ruleName}</CardTitle>
                  <SeverityBadge severity={alert.severity} />
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
                  <p className="text-foreground leading-relaxed">{alert.falsePositiveCheck}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {alert.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {alert.fileUrl && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Attached File</h3>
                    <Button variant="outline" onClick={handleDownloadFile}>
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                )}
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
                    <p className="text-sm text-muted-foreground">{alert.createdBy.username}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(alert.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full" 
                  onClick={() => navigate(`/alerts/${alert.id}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Alert
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                >
                  Share Link
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AlertDetail;