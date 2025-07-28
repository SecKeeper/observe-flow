import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, Lock, Activity } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-8">
              <Shield className="h-20 w-20 text-primary" />
            </div>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AlertFlow
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Advanced Security Alert Management Platform. Monitor, analyze, and respond to security threats 
              with intelligent alert classification and streamlined incident response workflows.
            </p>
            <div className="flex justify-center space-x-4">
              <Button 
                onClick={() => navigate('/login')}
                size="lg"
                className="px-8"
              >
                Get Started
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/register')}
                size="lg"
                className="px-8"
              >
                Create Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful Security Management</h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to manage security alerts effectively
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
                <CardTitle>Alert Classification</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Intelligent severity-based alert classification with color-coded priorities 
                  and comprehensive impact assessment.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Activity className="h-12 w-12 text-info mx-auto mb-4" />
                <CardTitle>Real-time Monitoring</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Dashboard with real-time alert tracking, filtering capabilities, 
                  and comprehensive search functionality.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Lock className="h-12 w-12 text-success mx-auto mb-4" />
                <CardTitle>Secure Access</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Role-based access control with secure authentication and 
                  audit trails for compliance requirements.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Secure Your Environment?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of security professionals using AlertFlow
          </p>
          <Button 
            onClick={() => navigate('/register')}
            size="lg"
            className="px-12"
          >
            Start Free Trial
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
