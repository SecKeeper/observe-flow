import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { Dashboard, AccessLevel, User } from '@/types';
import { 
  Plus, 
  Search, 
  FolderOpen, 
  Settings, 
  Trash2, 
  UserPlus,
  Calendar,
  AlertCircle
} from 'lucide-react';

const AlertFlowDashboard: React.FC = () => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [filteredDashboards, setFilteredDashboards] = useState<Dashboard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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

  // Mock dashboards data
  const mockDashboards: Dashboard[] = [
    {
      id: '1',
      name: 'Web Application Security',
      description: 'Alerts for web application vulnerabilities and attacks',
      owner: currentUser,
      accessLevel: 'Owner',
      alertCount: 15,
      lastUpdated: '2024-01-20T10:30:00Z',
      createdAt: '2024-01-15T09:00:00Z',
    },
    {
      id: '2',
      name: 'Network Infrastructure',
      description: 'Network-based security monitoring and intrusion detection',
      owner: {
        id: '2',
        username: 'network_admin',
        email: 'network@alertflow.com',
        role: 'admin',
        createdAt: '2024-01-01T00:00:00Z',
      },
      accessLevel: 'Editor',
      alertCount: 23,
      lastUpdated: '2024-01-19T15:45:00Z',
      createdAt: '2024-01-10T11:20:00Z',
    },
    {
      id: '3',
      name: 'Malware Detection',
      description: 'Endpoint and email-based malware detection alerts',
      owner: {
        id: '3',
        username: 'security_analyst',
        email: 'analyst@alertflow.com',
        role: 'analyst',
        createdAt: '2024-01-01T00:00:00Z',
      },
      accessLevel: 'Read-only',
      alertCount: 8,
      lastUpdated: '2024-01-18T08:15:00Z',
      createdAt: '2024-01-12T14:30:00Z',
    },
    {
      id: '4',
      name: 'Compliance Monitoring',
      description: 'Security compliance and audit trail monitoring',
      owner: currentUser,
      accessLevel: 'Owner',
      alertCount: 12,
      lastUpdated: '2024-01-17T16:20:00Z',
      createdAt: '2024-01-08T10:45:00Z',
    },
  ];

  useEffect(() => {
    // Simulate API call
    const fetchDashboards = async () => {
      setLoading(true);
      try {
        // In real implementation:
        // const response = await fetch('/api/dashboards');
        // const data = await response.json();
        // setDashboards(data);
        
        setTimeout(() => {
          setDashboards(mockDashboards);
          setFilteredDashboards(mockDashboards);
          setLoading(false);
        }, 1000);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch dashboards.",
        });
        setLoading(false);
      }
    };

    fetchDashboards();
  }, [toast]);

  useEffect(() => {
    let filtered = dashboards;

    if (searchTerm) {
      filtered = filtered.filter(dashboard =>
        dashboard.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dashboard.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dashboard.owner.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDashboards(filtered);
  }, [dashboards, searchTerm]);

  const handleDeleteDashboard = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this dashboard? This action cannot be undone.')) {
      try {
        // In real implementation: await fetch(`/api/dashboards/${id}`, { method: 'DELETE' });
        setDashboards(dashboards.filter(dashboard => dashboard.id !== id));
        toast({
          title: "Dashboard deleted",
          description: "The dashboard has been successfully deleted.",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete dashboard.",
        });
      }
    }
  };

  const getAccessLevelColor = (accessLevel: AccessLevel) => {
    switch (accessLevel) {
      case 'Owner':
        return 'bg-success text-success-foreground';
      case 'Editor':
        return 'bg-warning text-warning-foreground';
      case 'Read-only':
        return 'bg-info text-info-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const ownedDashboards = filteredDashboards.filter(d => d.accessLevel === 'Owner');
  const sharedDashboards = filteredDashboards.filter(d => d.accessLevel !== 'Owner');

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
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground">AlertFlow</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Security Onion Alert Management System
            </p>
          </div>
          <Button 
            onClick={() => navigate('/dashboards/new')} 
            className="flex items-center space-x-2"
            size="lg"
          >
            <Plus className="h-5 w-5" />
            <span>Create Dashboard</span>
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search dashboards by name, description, or owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Owned Dashboards */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <h2 className="text-2xl font-semibold text-foreground">Dashboards Owned by You</h2>
            <Badge variant="secondary">{ownedDashboards.length}</Badge>
          </div>
          
          {ownedDashboards.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">You don't own any dashboards yet.</p>
                <Button onClick={() => navigate('/dashboards/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Dashboard
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ownedDashboards.map((dashboard) => (
                <Card key={dashboard.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{dashboard.name}</CardTitle>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {dashboard.description || 'No description provided'}
                        </p>
                      </div>
                      <Badge className={getAccessLevelColor(dashboard.accessLevel)}>
                        {dashboard.accessLevel}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center space-x-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>{dashboard.alertCount} alerts</span>
                        </span>
                        <span className="flex items-center space-x-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(dashboard.lastUpdated).toLocaleDateString()}</span>
                        </span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => navigate(`/dashboards/${dashboard.id}`)}
                        >
                          <FolderOpen className="h-4 w-4 mr-1" />
                          Open
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/dashboards/${dashboard.id}/settings`)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/dashboards/${dashboard.id}/invite`)}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteDashboard(dashboard.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Shared Dashboards */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <h2 className="text-2xl font-semibold text-foreground">Dashboards Shared with You</h2>
            <Badge variant="secondary">{sharedDashboards.length}</Badge>
          </div>
          
          {sharedDashboards.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No dashboards have been shared with you yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sharedDashboards.map((dashboard) => (
                <Card key={dashboard.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{dashboard.name}</CardTitle>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {dashboard.description || 'No description provided'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Owner: {dashboard.owner.username}
                        </p>
                      </div>
                      <Badge className={getAccessLevelColor(dashboard.accessLevel)}>
                        {dashboard.accessLevel}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center space-x-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>{dashboard.alertCount} alerts</span>
                        </span>
                        <span className="flex items-center space-x-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(dashboard.lastUpdated).toLocaleDateString()}</span>
                        </span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => navigate(`/dashboards/${dashboard.id}`)}
                        >
                          <FolderOpen className="h-4 w-4 mr-1" />
                          Open
                        </Button>
                        {dashboard.accessLevel === 'Editor' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/dashboards/${dashboard.id}/invite`)}
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AlertFlowDashboard;