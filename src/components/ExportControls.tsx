import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ExportService } from '@/lib/backend-services';
import { Download, FileText, FileSpreadsheet, Calendar, Filter } from 'lucide-react';

interface ExportControlsProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFilters?: any;
}

const ExportControls: React.FC<ExportControlsProps> = ({
  isOpen,
  onClose,
  defaultFilters = {},
}) => {
  const [exportConfig, setExportConfig] = useState({
    format: 'csv' as 'csv' | 'json',
    filters: {
      severity: '',
      is_active: undefined as boolean | undefined,
      is_in_progress: undefined as boolean | undefined,
      category: '',
      date_from: '',
      date_to: '',
      assigned_to: '',
    },
    fields: {
      rule_name: true,
      severity: true,
      category: true,
      status: true,
      assigned_to: true,
      created_at: true,
      updated_at: true,
      findings: true,
      tags: true,
      priority: true,
      due_date: true,
      source: true,
      confidence_score: true,
    },
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (isOpen) {
      // Initialize with default filters
      setExportConfig(prev => ({
        ...prev,
        filters: {
          ...prev.filters,
          ...defaultFilters,
        },
      }));
    }
  }, [isOpen, defaultFilters]);

  const handleExport = async () => {
    setLoading(true);
    try {
      // Build filters object
      const filters: any = {};
      
      if (exportConfig.filters.severity) {
        filters.severity = exportConfig.filters.severity;
      }
      if (exportConfig.filters.is_active !== undefined) {
        filters.is_active = exportConfig.filters.is_active;
      }
      if (exportConfig.filters.is_in_progress !== undefined) {
        filters.is_in_progress = exportConfig.filters.is_in_progress;
      }
      if (exportConfig.filters.category) {
        filters.category = exportConfig.filters.category;
      }
      if (exportConfig.filters.date_from) {
        filters.date_from = exportConfig.filters.date_from;
      }
      if (exportConfig.filters.date_to) {
        filters.date_to = exportConfig.filters.date_to;
      }
      if (exportConfig.filters.assigned_to) {
        filters.assigned_to = exportConfig.filters.assigned_to;
      }

      // Add field selection
      filters.fields = Object.keys(exportConfig.fields).filter(
        field => exportConfig.fields[field as keyof typeof exportConfig.fields]
      );

      const data = await ExportService.exportAlerts(exportConfig.format, filters);
      
      // Create download link
      const blob = new Blob([data], { 
        type: exportConfig.format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `alerts-export-${new Date().toISOString().split('T')[0]}.${exportConfig.format}`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: `Alerts exported as ${exportConfig.format.toUpperCase()}.`,
      });

      onClose();
    } catch (error: any) {
      console.error('Export failed:', error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: error.message || "Failed to export alerts.",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: string, value: any) => {
    setExportConfig(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [key]: value,
      },
    }));
  };

  const toggleField = (field: string) => {
    setExportConfig(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [field]: !prev.fields[field as keyof typeof prev.fields],
      },
    }));
  };

  const selectAllFields = () => {
    setExportConfig(prev => ({
      ...prev,
      fields: Object.keys(prev.fields).reduce((acc, field) => ({
        ...acc,
        [field]: true,
      }), {}),
    }));
  };

  const deselectAllFields = () => {
    setExportConfig(prev => ({
      ...prev,
      fields: Object.keys(prev.fields).reduce((acc, field) => ({
        ...acc,
        [field]: false,
      }), {}),
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Export Alerts</span>
          </DialogTitle>
          <DialogDescription>
            Export alerts in CSV or JSON format with custom filters and field selection.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="csv"
                  checked={exportConfig.format === 'csv'}
                  onCheckedChange={() => setExportConfig(prev => ({ ...prev, format: 'csv' }))}
                />
                <Label htmlFor="csv" className="flex items-center space-x-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>CSV</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="json"
                  checked={exportConfig.format === 'json'}
                  onCheckedChange={() => setExportConfig(prev => ({ ...prev, format: 'json' }))}
                />
                <Label htmlFor="json" className="flex items-center space-x-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  <span>JSON</span>
                </Label>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <Label className="text-lg font-medium">Filters</Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <Select 
                  value={exportConfig.filters.severity} 
                  onValueChange={(value) => updateFilter('severity', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All severities</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={exportConfig.filters.is_in_progress === undefined ? '' : 
                         exportConfig.filters.is_in_progress ? 'working' : 'idle'} 
                  onValueChange={(value) => updateFilter('is_in_progress', 
                    value === '' ? undefined : value === 'working')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="working">Working</SelectItem>
                    <SelectItem value="idle">Idle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="active">Active Status</Label>
                <Select 
                  value={exportConfig.filters.is_active === undefined ? '' : 
                         exportConfig.filters.is_active ? 'active' : 'inactive'} 
                  onValueChange={(value) => updateFilter('is_active', 
                    value === '' ? undefined : value === 'active')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="active">Active only</SelectItem>
                    <SelectItem value="inactive">Inactive only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_from">Date From</Label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={exportConfig.filters.date_from}
                    onChange={(e) => updateFilter('date_from', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_to">Date To</Label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={exportConfig.filters.date_to}
                    onChange={(e) => updateFilter('date_to', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Field Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-medium">Fields to Export</Label>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={selectAllFields}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAllFields}>
                  Deselect All
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(exportConfig.fields).map(([field, selected]) => (
                <div key={field} className="flex items-center space-x-2">
                  <Checkbox
                    id={field}
                    checked={selected}
                    onCheckedChange={() => toggleField(field)}
                  />
                  <Label htmlFor={field} className="text-sm cursor-pointer capitalize">
                    {field.replace(/_/g, ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={loading}>
            {loading ? (
              <>
                <Download className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportControls; 