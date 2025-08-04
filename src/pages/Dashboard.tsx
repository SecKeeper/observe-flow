import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import InviteUsersModal from '@/components/InviteUsersModal';
import { Alert } from '@/types';
import { Plus, Search, Eye, Edit, Trash2, UserPlus, AlertTriangle, CheckCircle, Download, Share2, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AlertService, ExportService, AlertShareService, CategoryService } from '@/lib/backend-services';

const Dashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [assignedFilter, setAssignedFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch alerts using the new service
      const alertsData = await AlertService.getAlerts();
      setAlerts(alertsData || []);
      setFilteredAlerts(alertsData || []);

      // Fetch statistics
      const statsData = await AlertService.getAlertStats();
      setStats(statsData);

      // Fetch analytics
      const analyticsData = await AlertService.getAlertAnalytics();
      setAnalytics(analyticsData);

      // Fetch categories
      const categoriesData = await CategoryService.getCategories();
      setCategories(categoriesData || []);

      // Fetch user profile for role-based access
      if (user) {
        const profile = await AlertService.getUserProfile(user.id);
        setUserProfile(profile);
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch dashboard data.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = alerts;

    if (searchTerm) {
      filtered = filtered.filter(alert =>
        alert.rule_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        alert.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(alert => alert.severity === severityFilter);
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'working') {
        filtered = filtered.filter(alert => alert.is_in_progress);
      } else if (statusFilter === 'idle') {
        filtered = filtered.filter(alert => !alert.is_in_progress);
      } else if (statusFilter === 'resolved') {
        filtered = filtered.filter(alert => !alert.is_active);
      }
    }

    if (activeFilter !== 'all') {
      if (activeFilter === 'active') {
        filtered = filtered.filter(alert => alert.is_active);
      } else if (activeFilter === 'inactive') {
        filtered = filtered.filter(alert => !alert.is_active);
      }
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(alert => alert.category === categoryFilter);
    }

    if (assignedFilter !== 'all') {
      if (assignedFilter === 'assigned') {
        filtered = filtered.filter(alert => alert.assigned_to);
      } else if (assignedFilter === 'unassigned') {
        filtered = filtered.filter(alert => !alert.assigned_to);
      } else if (assignedFilter === 'assigned_to_me') {
        filtered = filtered.filter(alert => alert.assigned_to === user?.id);
      }
    }

    setFilteredAlerts(filtered);
    setCurrentPage(1);
  }, [alerts, searchTerm, severityFilter, statusFilter, activeFilter, categoryFilter, assignedFilter, user?.id]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAlerts = filteredAlerts.slice(startIndex, endIndex);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      try {
        await AlertService.deleteAlert(id);
        setAlerts(alerts.filter(alert => alert.id !== id));
        toast({
          title: "Alert deleted",
          description: "The alert has been successfully deleted.",
        });
      } catch (error: any) {
        console.error('Error deleting alert:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to delete alert.",
        });
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await AlertService.toggleAlertStatus(id);
      setAlerts(alerts.map(alert => 
        alert.id === id 
          ? { ...alert, is_in_progress: !currentStatus }
          : alert
      ));

      toast({
        title: "Status updated",
        description: `Alert status changed to ${!currentStatus ? 'Working' : 'Idle'}.`,
      });
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update status.",
      });
    }
  };

  const handleMarkInProgress = async (id: string) => {
    try {
      await AlertService.markInProgress(id);
      setAlerts(alerts.map(alert => 
        alert.id === id 
          ? { ...alert, is_in_progress: true }
          : alert
      ));

      toast({
        title: "Status updated",
        description: "Alert marked as in progress.",
      });
    } catch (error: any) {
      console.error('Error marking in progress:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to mark alert in progress.",
      });
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const filters = {
        severity: severityFilter !== 'all' ? severityFilter : undefined,
        is_active: activeFilter === 'active' ? true : activeFilter === 'inactive' ? false : undefined,
        is_in_progress: statusFilter === 'working' ? true : statusFilter === 'idle' ? false : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
      };

      const data = await ExportService.exportAlerts(format, filters);
      
      // Create download link
      const blob = new Blob([data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `alerts-export-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: `Alerts exported as ${format.toUpperCase()}.`,
      });
    } catch (error: any) {
      console.error('Export failed:', error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: error.message || "Failed to export alerts.",
      });
    }
  };

  const handleShare = async (alertId: string) => {
    try {
      const share = await AlertShareService.createShare({
        alert_id: alertId,
        shared_with_email: 'public@example.com',
        expires_in_hours: 24, // 24 hours
        access_type: 'read-only'
      });

      // Copy to clipboard
      await navigator.clipboard.writeText(share.share_link);
      
      toast({
        title: "Share link created",
        description: "Share link copied to clipboard.",
      });
    } catch (error: any) {
      console.error('Share creation failed:', error);
      toast({
        variant: "destructive",
        title: "Share failed",
        description: error.message || "Failed to create share link.",
      });
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const canEdit = (alert: Alert) => {
    if (!userProfile) return false;
    if (userProfile.role === 'admin') return true;
    if (userProfile.role === 'editor') return true;
    if (alert.created_by === user?.id) return true;
    if (alert.assigned_to === user?.id) return true;
    return false;
  };

  const canDelete = (alert: Alert) => {
    if (!userProfile) return false;
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Alert Dashboard</h1>
          <div className="flex space-x-2">
            <InviteUsersModal dashboardId="1" isOwner={userProfile?.role === 'admin'}>
              <Button variant="outline" className="flex items-center space-x-2">
                <UserPlus className="h-4 w-4" />
                <span>Invite Users</span>
              </Button>
            </InviteUsersModal>
            <Button onClick={() => navigate('/alerts/new')} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create Alert</span>
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_alerts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.active_alerts || 0} active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                <Badge variant="destructive" className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.high_priority_alerts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.critical_alerts || 0} critical
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.in_progress_alerts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.assigned_alerts || 0} assigned
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.resolved_alerts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Avg: {stats.avg_resolution_time || 0} days
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Security Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by rule name, tags, or description..."
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="working">Working</SelectItem>
                  <SelectItem value="idle">Idle</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Active" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Assignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  <SelectItem value="assigned_to_me">Assigned to Me</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Export Controls */}
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredAlerts.length} alerts
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('csv')}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export CSV</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('json')}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export JSON</span>
                </Button>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Findings</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium">{alert.rule_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {truncateText(alert.short_description, 50)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <SeverityBadge severity={alert.severity} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(alert.id, alert.is_in_progress)}
                            className="p-1"
                            disabled={!canEdit(alert)}
                          >
                            <Badge variant={alert.is_in_progress ? "default" : "secondary"}>
                              {alert.is_in_progress ? 'Working' : 'Idle'}
                            </Badge>
                          </Button>
                          {!alert.is_in_progress && canEdit(alert) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkInProgress(alert.id)}
                              className="p-1 text-xs"
                            >
                              Mark In Progress
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {alert.assigned_to ? (
                          <Badge variant="outline">
                            {(alert as any).assigned_profile?.username || 'Unknown'}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {alert.category ? (
                          <Badge variant="outline">{alert.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {alert.is_active ? (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {alert.findings ? truncateText(alert.findings, 40) : 'No findings yet'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {alert.tags?.slice(0, 2).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                          {alert.tags && alert.tags.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{alert.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(alert.updated_at).toLocaleDateString()}
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
                          {canEdit(alert) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/alerts/${alert.id}/edit`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShare(alert.id)}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          {canDelete(alert) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(alert.id)}
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

            {filteredAlerts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No alerts found matching your criteria.
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredAlerts.length)} of {filteredAlerts.length} alerts
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => 
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      )
                      .map((page, index, array) => (
                        <React.Fragment key={page}>
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        </React.Fragment>
                      ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;