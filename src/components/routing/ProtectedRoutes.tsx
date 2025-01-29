import { useEffect, useState } from "react";
import { useNavigate, useLocation, Outlet, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useRoleSync } from "@/hooks/useRoleSync";
import { Loader2 } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";

interface ProtectedRoutesProps {
  session: Session | null;
}

const ProtectedRoutes = ({ session }: ProtectedRoutesProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { roleLoading, userRole, userRoles, canAccessTab: roleAccessCheck } = useRoleAccess();
  const { syncRoles } = useRoleSync();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [hasShownAccessDenied, setHasShownAccessDenied] = useState(false);

  // Convert path to tab
  const pathToTab = (path: string) => {
    const cleanPath = path.split('/')[1] || 'dashboard';
    return cleanPath;
  };

  const [activeTab, setActiveTab] = useState(pathToTab(location.pathname));

  useEffect(() => {
    const newTab = pathToTab(location.pathname);
    console.log('Path changed, updating active tab:', {
      path: location.pathname,
      newTab,
      canAccess: roleAccessCheck(newTab),
      userRole,
      isLoading: roleLoading
    });
    
    // Only check access after roles are loaded
    if (!roleLoading && !isInitialLoad && userRoles) {
      console.log('Checking access for tab:', newTab);
      
      // Restrict system and financials to admin only
      if ((newTab === 'system' || newTab === 'financials') && !userRoles.includes('admin')) {
        console.log('Access denied to restricted section');
        if (!hasShownAccessDenied) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this section.",
            variant: "destructive",
          });
          setHasShownAccessDenied(true);
        }
        navigate('/dashboard');
        return;
      }
      
      if (!roleAccessCheck(newTab)) {
        console.log('User cannot access tab:', newTab);
        if (!hasShownAccessDenied) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this section.",
            variant: "destructive",
          });
          setHasShownAccessDenied(true);
        }
        navigate('/dashboard');
        return;
      }
    }
    
    setActiveTab(newTab);
  }, [location.pathname, navigate, userRoles, userRole, toast, roleLoading, isInitialLoad, hasShownAccessDenied, roleAccessCheck]);

  useEffect(() => {
    let mounted = true;
    console.log('ProtectedRoutes mounted, session:', !!session);

    const checkAuth = async () => {
      try {
        if (!session) {
          console.log('No session, redirecting to login');
          navigate('/login', { replace: true });
          return;
        }

        if (mounted) {
          await syncRoles(session.user.id);
          setIsAuthChecking(false);
          setIsInitialLoad(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (mounted) {
          setIsAuthChecking(false);
          setIsInitialLoad(false);
          toast({
            title: "Authentication Error",
            description: "There was a problem verifying your access. Please try again.",
            variant: "destructive",
          });
        }
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!mounted) return;

      console.log('Auth state change in protected routes:', {
        event,
        hasSession: !!currentSession,
        userRole
      });
      
      if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !currentSession)) {
        console.log('User signed out or token refresh failed, redirecting to login');
        navigate('/login', { replace: true });
        return;
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, session, syncRoles, userRole, toast]);

  // Show loading state during initial auth check or role loading
  if (isAuthChecking || (isInitialLoad && roleLoading)) {
    console.log('Showing loading state:', {
      isInitialLoad,
      roleLoading,
      hasSession: !!session,
      isAuthChecking
    });
    return (
      <div className="flex items-center justify-center min-h-screen bg-dashboard-dark">
        <Loader2 className="w-8 h-8 animate-spin text-dashboard-accent1" />
      </div>
    );
  }

  // If no session, redirect to login
  if (!session) {
    console.log('No session in ProtectedRoutes, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Only check route access after roles are loaded
  const currentTab = pathToTab(location.pathname);
  if (!roleLoading && !isInitialLoad && userRoles && !canAccessTab(currentTab, userRoles)) {
    const defaultRoute = getDefaultRoute(userRoles);
    return <Navigate to={defaultRoute} replace />;
  }

  return (
    <MainLayout
      activeTab={activeTab}
      isSidebarOpen={isSidebarOpen}
      onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      onTabChange={(tab) => {
        // Check access before allowing tab change
        if (!roleLoading && userRoles) {
          // Restrict system and financials to admin only
          if ((tab === 'system' || tab === 'financials') && !userRoles.includes('admin')) {
            if (!hasShownAccessDenied) {
              toast({
                title: "Access Denied",
                description: "You don't have permission to access this section.",
                variant: "destructive",
              });
              setHasShownAccessDenied(true);
            }
            return;
          }
          
          if (!roleAccessCheck(tab)) {
            if (!hasShownAccessDenied) {
              toast({
                title: "Access Denied",
                description: "You don't have permission to access this section.",
                variant: "destructive",
              });
              setHasShownAccessDenied(true);
            }
            return;
          }
        }
        const path = tab === 'dashboard' ? '/' : `/${tab}`;
        navigate(path);
        setActiveTab(tab);
      }}
    >
      <Outlet />
    </MainLayout>
  );
};

export default ProtectedRoutes;
