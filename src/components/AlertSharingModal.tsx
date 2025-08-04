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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AlertShareService } from '@/lib/backend-services';
import { Copy, ExternalLink, Calendar, Clock, User, Shield } from 'lucide-react';

interface AlertSharingModalProps {
  alertId: string;
  alertName: string;
  isOpen: boolean;
  onClose: () => void;
}

const AlertSharingModal: React.FC<AlertSharingModalProps> = ({
  alertId,
  alertName,
  isOpen,
  onClose,
}) => {
  const [shareData, setShareData] = useState({
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours default
    access_type: 'read-only' as 'read-only' | 'edit',
    email_invites: [] as string[],
  });
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [existingShares, setExistingShares] = useState<any[]>([]);
  const { toast } = useToast();

  const handleCreateShare = async () => {
    setLoading(true);
    try {
      const share = await AlertShareService.createShare({
        alert_id: alertId,
        expires_at: shareData.expires_at,
        access_type: shareData.access_type,
        email_invites: shareData.email_invites,
      });

      setShareLink(share.share_link);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(share.share_link);
      
      toast({
        title: "Share link created",
        description: "Share link copied to clipboard.",
      });

      // Refresh existing shares
      await loadExistingShares();
    } catch (error: any) {
      console.error('Share creation failed:', error);
      toast({
        variant: "destructive",
        title: "Share failed",
        description: error.message || "Failed to create share link.",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadExistingShares = async () => {
    try {
      const shares = await AlertShareService.listShares(alertId);
      setExistingShares(shares || []);
    } catch (error) {
      console.error('Failed to load existing shares:', error);
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    try {
      await AlertShareService.revokeShare(shareId);
      toast({
        title: "Share revoked",
        description: "Share link has been revoked.",
      });
      await loadExistingShares();
    } catch (error: any) {
      console.error('Failed to revoke share:', error);
      toast({
        variant: "destructive",
        title: "Revoke failed",
        description: error.message || "Failed to revoke share.",
      });
    }
  };

  const addEmailInvite = () => {
    if (emailInput.trim() && !shareData.email_invites.includes(emailInput.trim())) {
      setShareData(prev => ({
        ...prev,
        email_invites: [...prev.email_invites, emailInput.trim()]
      }));
      setEmailInput('');
    }
  };

  const removeEmailInvite = (email: string) => {
    setShareData(prev => ({
      ...prev,
      email_invites: prev.email_invites.filter(e => e !== email)
    }));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Link copied to clipboard.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Failed to copy to clipboard.",
      });
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      loadExistingShares();
    }
  }, [isOpen, alertId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Share Alert</span>
          </DialogTitle>
          <DialogDescription>
            Create a secure share link for "{alertName}" with controlled access and expiration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Share Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Share Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="access_type">Access Type</Label>
                <Select 
                  value={shareData.access_type} 
                  onValueChange={(value: 'read-only' | 'edit') => 
                    setShareData(prev => ({ ...prev, access_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read-only">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Read Only</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="edit">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <span>Edit Access</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires_at">Expires At</Label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    value={shareData.expires_at.toISOString().slice(0, 16)}
                    onChange={(e) => setShareData(prev => ({
                      ...prev,
                      expires_at: new Date(e.target.value)
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Email Invites */}
            <div className="space-y-2">
              <Label>Email Invites (Optional)</Label>
              <div className="flex space-x-2">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addEmailInvite()}
                />
                <Button type="button" variant="outline" onClick={addEmailInvite}>
                  Add
                </Button>
              </div>
              {shareData.email_invites.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {shareData.email_invites.map((email, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                      <span>{email}</span>
                      <button
                        onClick={() => removeEmailInvite(email)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Create Share Button */}
          <Button 
            onClick={handleCreateShare} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creating Share...' : 'Create Share Link'}
          </Button>

          {/* Generated Share Link */}
          {shareLink && (
            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex items-center space-x-2">
                <Input value={shareLink} readOnly className="flex-1" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(shareLink)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(shareLink, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Existing Shares */}
          {existingShares.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Active Shares</h3>
              <div className="space-y-2">
                {existingShares.map((share) => (
                  <div key={share.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant={share.access_type === 'edit' ? 'default' : 'secondary'}>
                          {share.access_type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Expires: {new Date(share.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(share.share_link)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRevokeShare(share.id)}
                      >
                        Revoke
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AlertSharingModal; 