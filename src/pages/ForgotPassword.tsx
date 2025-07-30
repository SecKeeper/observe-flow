import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Shield, ArrowLeft, Mail } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In real implementation: await fetch('/api/forgot-password', ...)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEmailSent(true);
      toast({
        title: "Reset link sent",
        description: "Check your email for password reset instructions.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send reset email. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="p-2 bg-primary rounded-lg">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">AlertFlow</h1>
              <p className="text-sm text-muted-foreground">Security Onion Alert Management</p>
            </div>
          </div>
        </div>

        {/* Forgot Password Form */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Reset your password</CardTitle>
            <CardDescription>
              {emailSent 
                ? "We've sent reset instructions to your email"
                : "Enter your email address and we'll send you a link to reset your password"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!emailSent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email address"
                    autoComplete="email"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                  size="lg"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                      <span>Sending...</span>
                    </div>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="p-4 bg-success/10 rounded-lg">
                  <Mail className="h-8 w-8 text-success mx-auto mb-2" />
                  <p className="text-sm text-success">
                    Reset instructions sent to <strong>{email}</strong>
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                >
                  Try Different Email
                </Button>
              </div>
            )}

            <div className="mt-6 text-center">
              <Link 
                to="/login" 
                className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Demo Info */}
        <Card className="bg-info/10 border-info/20">
          <CardContent className="pt-6">
            <div className="text-sm text-center">
              <p className="font-medium text-info">Demo Mode</p>
              <p className="text-info/80 mt-1">
                This is a demo. No actual emails will be sent.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;