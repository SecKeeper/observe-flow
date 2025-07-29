import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  UserPlus, 
  Link as LinkIcon, 
  Copy, 
  Mail, 
  User, 
  Settings, 
  Trash2,
  Clock 
} from 'lucide-react';

interface InviteUsersModalProps {
  children: React.ReactNode;
  dashboardId: string;
  isOwner: boolean;
}

interface Invite {
  id: string;
  email: string;
  username: string;
  accessLevel: 'Editor' | 'Read-only';
  status: 'pending' | 'accepted';
  createdAt: string;
}

const InviteUsersModal: React.FC<InviteUsersModalProps> = ({ 
  children, 
  dashboardId, 
  isOwner 
}) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState<'Editor' | 'Read-only'>('Read-only');
  const [generatedLink, setGeneratedLink] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Mock invites data
  const [invites, setInvites] = useState<Invite[]>([
    {
      id: '1',
      email: 'analyst@company.com',
      username: 'security_analyst',
      accessLevel: 'Editor',
      status: 'accepted',
      createdAt: '2024-01-20T10:30:00Z',
    },
    {
      id: '2',
      email: 'viewer@company.com',
      username: 'read_user',
      accessLevel: 'Read-only',
      status: 'pending',
      createdAt: '2024-01-19T15:45:00Z',
    },
  ]);

  const handleSendInvite = async () => {
    if (!email.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter an email address.",
      });
      return;
    }

    setLoading(true);
    try {
      // In real implementation:
      // await fetch('/api/invite', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, accessLevel, dashboardId })
      // });

      // Mock success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newInvite: Invite = {
        id: Date.now().toString(),
        email,
        username: email.split('@')[0],
        accessLevel,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      
      setInvites([...invites, newInvite]);
      setEmail('');
      
      toast({
        title: "Invite sent",
        description: `Invitation sent to ${email} with ${accessLevel} access.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send invitation.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      // In real implementation:
      // const response = await fetch('/api/invite-link', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ accessLevel, dashboardId })
      // });

      // Mock generated link
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockLink = `https://alertflow.com/invite/${dashboardId}?token=abc123&access=${accessLevel}`;
      setGeneratedLink(mockLink);
      
      toast({
        title: "Link generated",
        description: "Shareable link has been generated successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate link.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    toast({
      title: "Link copied",
      description: "Invite link has been copied to clipboard.",
    });
  };

  const handleRemoveInvite = (inviteId: string) => {
    setInvites(invites.filter(invite => invite.id !== inviteId));
    toast({
      title: "Invite removed",
      description: "The invitation has been removed.",
    });
  };

  const handleChangeAccess = (inviteId: string, newAccessLevel: 'Editor' | 'Read-only') => {
    setInvites(invites.map(invite => 
      invite.id === inviteId 
        ? { ...invite, accessLevel: newAccessLevel }
        : invite
    ));
    toast({
      title: "Access updated",
      description: `Access level changed to ${newAccessLevel}.`,
    });
  };

  if (!isOwner) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Invite Users</span>
          </DialogTitle>
          <DialogDescription>
            Share this dashboard with other users by sending invites or generating shareable links.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              Email Invite
            </TabsTrigger>
            <TabsTrigger value="link">
              <LinkIcon className="h-4 w-4 mr-2" />
              Share Link
            </TabsTrigger>
            <TabsTrigger value="manage">
              <User className="h-4 w-4 mr-2" />
              Manage Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Send Email Invitation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="access-level">Access Level</Label>
                    <Select value={accessLevel} onValueChange={(value: 'Editor' | 'Read-only') => setAccessLevel(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Editor">Editor</SelectItem>
                        <SelectItem value="Read-only">Read-only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSendInvite} disabled={loading}>
                    {loading ? 'Sending...' : 'Send Invite'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="link" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Generate Shareable Link</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="link-access">Access Level</Label>
                  <Select value={accessLevel} onValueChange={(value: 'Editor' | 'Read-only') => setAccessLevel(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Editor">Editor</SelectItem>
                      <SelectItem value="Read-only">Read-only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handleGenerateLink} disabled={loading}>
                    {loading ? 'Generating...' : 'Generate Link'}
                  </Button>
                </div>

                {generatedLink && (
                  <div className="space-y-2">
                    <Label>Generated Link</Label>
                    <div className="flex space-x-2">
                      <Input 
                        value={generatedLink} 
                        readOnly 
                        className="font-mono text-sm"
                      />
                      <Button variant="outline" onClick={handleCopyLink}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Link expires in 24 hours</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Invitations</CardTitle>
              </CardHeader>
              <CardContent>
                {invites.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No invitations sent yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {invites.map((invite) => (
                      <div key={invite.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{invite.username}</span>
                            <Badge variant={invite.status === 'accepted' ? 'default' : 'secondary'}>
                              {invite.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{invite.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Invited {new Date(invite.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={invite.accessLevel === 'Editor' ? 'bg-warning text-warning-foreground' : 'bg-info text-info-foreground'}>
                            {invite.accessLevel}
                          </Badge>
                          <Select 
                            value={invite.accessLevel} 
                            onValueChange={(value: 'Editor' | 'Read-only') => handleChangeAccess(invite.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <Settings className="h-4 w-4" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Editor">Editor</SelectItem>
                              <SelectItem value="Read-only">Read-only</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRemoveInvite(invite.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default InviteUsersModal;