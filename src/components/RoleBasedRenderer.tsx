import { ReactNode, useMemo } from 'react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database['public']['Enums']['app_role'];

interface RoleBasedRendererProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requireAllRoles?: boolean;
  fallback?: ReactNode;
}

const RoleBasedRenderer = ({
  children,
  allowedRoles = [],
  requireAllRoles = false,
  fallback = null
}: RoleBasedRendererProps) => {
  const { hasRole, hasAnyRole } = useRoleAccess();

  // Memoize access check to prevent unnecessary re-renders
  const hasAccess = useMemo(() => {
    if (!allowedRoles.length) {
      console.log('[RoleRenderer] No roles required, rendering children');
      return true;
    }

    const access = requireAllRoles
      ? allowedRoles.every(role => hasRole(role))
      : hasAnyRole(allowedRoles);

    console.log('[RoleRenderer] Access check:', {
      allowedRoles,
      requireAllRoles,
      hasAccess: access,
      timestamp: new Date().toISOString()
    });

    return access;
  }, [allowedRoles, requireAllRoles, hasRole, hasAnyRole]);

  return <>{hasAccess ? children : fallback}</>;
};

export default RoleBasedRenderer;