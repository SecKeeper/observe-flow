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
import { Plus, Search, Eye, Edit, Trash2, UserPlus, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          assigned_profile:assigned_to(username),
          created_profile:created_by(username)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAlerts(data as any || []);
      setFilteredAlerts(data as any || []);
    } catch (error: any) {
      console.error('Error fetching alerts:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch alerts.",
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
        alert.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
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
      }
    }

    if (activeFilter !== 'all') {
      if (activeFilter === 'active') {
        filtered = filtered.filter(alert => alert.is_active);
      } else if (activeFilter === 'inactive') {
        filtered = filtered.filter(alert => !alert.is_active);
      }
    }

    setFilteredAlerts(filtered);
    setCurrentPage(1);
  }, [alerts, searchTerm, severityFilter, statusFilter, activeFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAlerts = filteredAlerts.slice(startIndex, endIndex);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      try {
        const { error } = await supabase
          .from('alerts')
          .delete()
          .eq('id', id);

        if (error) throw error;

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
      const { error } = await supabase
        .from('alerts')
        .update({ is_in_progress: !currentStatus })
        .eq('id', id);

      if (error) throw error;

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

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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
            <InviteUsersModal dashboardId="1" isOwner={true}>
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="working">Working</SelectItem>
                  <SelectItem value="idle">Idle</SelectItem>
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
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(alert.id, alert.is_in_progress)}
                          className="p-1"
                        >
                          <Badge variant={alert.is_in_progress ? "default" : "secondary"}>
                            {alert.is_in_progress ? 'Working' : 'Idle'}
                          </Badge>
                        </Button>
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