import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import SeverityBadge from '@/components/SeverityBadge';
import Layout from '@/components/Layout';
import { Alert } from '@/types';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Mock data for demonstration
  const mockAlerts: Alert[] = [
    {
      id: '1',
      ruleName: 'SQL Injection Detection',
      description: 'Detects potential SQL injection attempts in web requests',
      impact: 'Could lead to database compromise and data theft',
      mitigation: 'Implement input validation and parameterized queries',
      falsePositiveCheck: 'Verify the request contains actual SQL injection patterns',
      severity: 'Critical',
      tags: ['web', 'database', 'injection'],
      createdBy: 'admin',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      ruleName: 'Brute Force Login Alert',
      description: 'Monitors for multiple failed login attempts',
      impact: 'Potential unauthorized access to user accounts',
      mitigation: 'Implement rate limiting and account lockout policies',
      falsePositiveCheck: 'Check if attempts are from legitimate user patterns',
      severity: 'High',
      tags: ['authentication', 'brute-force', 'security'],
      createdBy: 'security_analyst',
      createdAt: '2024-01-14T14:20:00Z',
      updatedAt: '2024-01-14T14:20:00Z',
    },
    {
      id: '3',
      ruleName: 'Suspicious File Upload',
      description: 'Detects uploads of potentially malicious file types',
      impact: 'Could lead to malware execution or system compromise',
      mitigation: 'Implement file type validation and sandboxing',
      falsePositiveCheck: 'Verify file content matches suspicious patterns',
      severity: 'Medium',
      tags: ['file-upload', 'malware', 'web'],
      createdBy: 'dev_team',
      createdAt: '2024-01-13T09:15:00Z',
      updatedAt: '2024-01-13T09:15:00Z',
    },
  ];

  useEffect(() => {
    // Simulate API call
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        // In real implementation, this would be an API call
        // const response = await fetch('/api/alerts');
        // const data = await response.json();
        // setAlerts(data);
        
        // For now, use mock data
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
        alert.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(alert => alert.severity === severityFilter);
    }

    setFilteredAlerts(filtered);
  }, [alerts, searchTerm, severityFilter]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
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
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Alert Dashboard</h1>
          <Button onClick={() => navigate('/alerts/new')} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Create Alert</span>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Security Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by rule name or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">
                        {alert.ruleName}
                      </TableCell>
                      <TableCell>
                        <SeverityBadge severity={alert.severity} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {alert.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(alert.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/alerts/${alert.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/alerts/${alert.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(alert.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredAlerts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No alerts found matching your criteria.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;