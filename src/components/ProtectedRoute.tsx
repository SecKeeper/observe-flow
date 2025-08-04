import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AlertService } from '@/lib/backend-services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'editor' | 'read-only';
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  fallback 
}) => {
  const { isAuthenticated, loading, user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (user && isAuthenticated) {
        try {
          const profile = await AlertService.getUserProfile(user.id);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error loading user profile:', error);
        } finally {
          setProfileLoading(false);
        }
      } else {
        setProfileLoading(false);
      }
    };

    loadUserProfile();
  }, [user, isAuthenticated]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access if required
  if (requiredRole && userProfile) {
    const hasAccess = checkRoleAccess(userProfile.role, requiredRole);
    
    if (!hasAccess) {
      if (fallback) {
        return <>{fallback}</>;
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-destructive">
                <Shield className="h-5 w-5" />
                <span>Access Denied</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
                <span>Insufficient permissions</span>
              </div>
              <p className="text-sm text-muted-foreground">
                You need <strong>{requiredRole}</strong> role to access this page. 
                Your current role is <strong>{userProfile.role}</strong>.
              </p>
              <div className="pt-4">
                <p className="text-xs text-muted-foreground">
                  Contact your administrator if you believe this is an error.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  return <>{children}</>;
};

// Role hierarchy: admin > editor > read-only
const checkRoleAccess = (userRole: string, requiredRole: string): boolean => {
  const roleHierarchy = {
    'admin': 3,
    'editor': 2,
    'read-only': 1
  };

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

  return userLevel >= requiredLevel;
};

export default ProtectedRoute;