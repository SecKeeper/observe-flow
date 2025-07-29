import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import SeverityBadge from '@/components/SeverityBadge';
import InviteUsersModal from '@/components/InviteUsersModal';
import { Alert, Severity, User } from '@/types';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  UserPlus,
  Calendar,
  Filter
} from 'lucide-react';

const AlertFlowDashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'All'>('All');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Mock user for demonstration
  const currentUser: User = {
    id: '1',
    username: 'security_admin',
    email: 'admin@alertflow.com',
    role: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
  };

  // Mock alerts data  
  const mockAlerts: Alert[] = [
    {
      id: '1',
      dashboardId: '1',
      ruleName: 'SQL Injection Detection',
      shortDescription: 'Detects SQL injection attempts in web traffic',
      description: 'Detects potential SQL injection attempts in web application traffic',
      impact: 'Could lead to database compromise and sensitive data exposure',
      mitigation: 'Implement input validation, parameterized queries, and WAF rules',
      falsePositiveCheck: 'Verify the request contains actual SQL injection patterns and not legitimate queries',
      severity: 'Critical',
      tags: ['web', 'database', 'injection', 'owasp-top10'],
      fileUrl: '/uploads/sql-injection-samples.pcap',
      createdBy: currentUser,
      createdAt: '2024-01-20T10:30:00Z',
      updatedAt: '2024-01-20T14:45:00Z',
    },
    {
      id: '2',
      dashboardId: '1',
      ruleName: 'Cross-Site Scripting (XSS)',
      shortDescription: 'Identifies XSS attacks in web applications',
      description: 'Identifies reflected and stored XSS attacks in web applications',
      impact: 'Session hijacking, credential theft, defacement, malware distribution',
      mitigation: 'Implement content security policy, input encoding, and output validation',
      falsePositiveCheck: 'Review the payload context and ensure it contains malicious JavaScript',
      severity: 'High',
      tags: ['web', 'xss', 'javascript', 'client-side'],
      createdBy: currentUser,
      createdAt: '2024-01-19T15:20:00Z',
      updatedAt: '2024-01-19T15:20:00Z',
    },
    {
      id: '3',
      dashboardId: '2',
      ruleName: 'Brute Force Login Attempts',
      shortDescription: 'Detects multiple failed login attempts',
      description: 'Detects multiple failed login attempts from the same source IP',
      impact: 'Unauthorized access to user accounts and potential data breach',
      mitigation: 'Implement account lockout policies, CAPTCHA, and rate limiting',
      falsePositiveCheck: 'Check if the source IP belongs to legitimate users or automated systems',
      severity: 'Medium',
      tags: ['authentication', 'brute-force', 'network'],
      createdBy: currentUser,
      createdAt: '2024-01-18T09:45:00Z',
      updatedAt: '2024-01-18T09:45:00Z',
    },
    {
      id: '4',
      dashboardId: '2',
      ruleName: 'Port Scan Detection',
      shortDescription: 'Identifies network reconnaissance activities',
      description: 'Identifies network reconnaissance activities and port scanning',
      impact: 'Information gathering for potential network attacks',
      mitigation: 'Block suspicious IPs, implement network segmentation, monitor firewall logs',
      falsePositiveCheck: 'Verify if scanning activity is from authorized security tools',
      severity: 'Low',
      tags: ['network', 'reconnaissance', 'scanning'],
      createdBy: currentUser,
      createdAt: '2024-01-17T14:15:00Z',
      updatedAt: '2024-01-17T14:15:00Z',
    },
    {
      id: '5',
      dashboardId: '3',
      ruleName: 'Malware Download Detected',
      shortDescription: 'Suspicious file downloads detected',
      description: 'Suspicious file downloads potentially containing malware',
      impact: 'System compromise, data theft, lateral movement within network',
      mitigation: 'Quarantine affected systems, run full antivirus scans, update signatures',
      falsePositiveCheck: 'Analyze file hash against known malware databases and behavioral analysis',
      severity: 'Critical',
      tags: ['malware', 'download', 'endpoint', 'threat'],
      createdBy: currentUser,
      createdAt: '2024-01-16T11:30:00Z',
      updatedAt: '2024-01-16T11:30:00Z',
    },
  ];

  useEffect(() => {
    // Simulate API call
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        // In real implementation:
        // const response = await fetch('/api/alerts');
        // const data = await response.json();
        // setAlerts(data);
        
        setTimeout(() => {
          setAlerts(mockAlerts);
          setFilteredAlerts(mockAlerts);
          setLoading(false);
        }, 1000);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch alerts.",
        });
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [toast]);

  useEffect(() => {
    let filtered = alerts;

    if (searchTerm) {
      filtered = filtered.filter(alert =>
        alert.ruleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        alert.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (severityFilter !== 'All') {
      filtered = filtered.filter(alert => alert.severity === severityFilter);
    }

    setFilteredAlerts(filtered);
  }, [alerts, searchTerm, severityFilter]);

  const handleDeleteAlert = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this alert? This action cannot be undone.')) {
      try {
        // In real implementation: await fetch(`/api/alerts/${id}`, { method: 'DELETE' });
        setAlerts(alerts.filter(alert => alert.id !== id));
        toast({
          title: "Alert deleted",
          description: "The alert has been successfully deleted.",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete alert.",
        });
      }
    }
  };

  // Current user role (for demo - Owner can do everything)
  const userRole = 'Owner'; // In real app, get from auth context

  if (loading) {
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">AlertFlow Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Security Alert Management System
            </p>
          </div>
          <div className="flex space-x-2">
            <InviteUsersModal dashboardId="main" isOwner={userRole === 'Owner'}>
              <Button variant="outline" size="lg">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Users
              </Button>
            </InviteUsersModal>
            <Button 
              onClick={() => navigate('/alerts/new')} 
              size="lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Alert
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search alerts by rule name, tags, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={severityFilter} onValueChange={(value: Severity | 'All') => setSeverityFilter(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Severities</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Security Alerts ({filteredAlerts.length})</span>
              <Badge variant="secondary">{filteredAlerts.length} total</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No alerts found matching your criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule Name</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAlerts.map((alert) => (
                      <TableRow key={alert.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <div className="space-y-1">
                            <div>{alert.ruleName}</div>
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {alert.shortDescription}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <SeverityBadge severity={alert.severity} />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {alert.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {alert.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{alert.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(alert.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            by {alert.createdBy.username}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/alerts/${alert.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {(userRole === 'Owner' || userRole === 'Editor') && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(`/alerts/${alert.id}/edit`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {(userRole === 'Owner' || userRole === 'Editor') && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteAlert(alert.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AlertFlowDashboard;