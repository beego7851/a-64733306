import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';
import { clearAuthState, verifyMember, handleSignInError } from './utils/authUtils';
import { DatabaseFunctions } from '@/integrations/supabase/types/functions';

type FailedLoginResponse = DatabaseFunctions['handle_failed_login']['Returns'];

export const useLoginForm = () => {
  const [memberNumber, setMemberNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !memberNumber.trim() || !password.trim()) return;
    
    try {
      setLoading(true);
      const isMobile = window.innerWidth <= 768;
      console.log('[Login] Starting login process', { 
        deviceType: isMobile ? 'mobile' : 'desktop',
        memberNumber,
        timestamp: new Date().toISOString()
      });

      // Check maintenance mode first
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('maintenance_settings')
        .select('is_enabled, message')
        .single();

      if (maintenanceError) {
        console.error('[Login] Error checking maintenance mode:', maintenanceError);
        throw new Error('Unable to verify system status');
      }

      if (maintenanceData?.is_enabled) {
        console.log('[Login] System in maintenance mode, checking admin credentials');
        const email = `${memberNumber.toLowerCase()}@temp.com`;
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          console.log('[Login] Login failed during maintenance mode');
          throw new Error(maintenanceData.message || 'System is temporarily offline for maintenance');
        }

        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', signInData.user.id);

        const isAdmin = roles?.some(r => r.role === 'admin');
        
        if (!isAdmin) {
          console.log('[Login] Non-admin access attempted during maintenance');
          throw new Error(maintenanceData.message || 'System is temporarily offline for maintenance');
        }

        console.log('[Login] Admin access granted during maintenance mode');
      }

      console.log('[Login] Starting member verification');
      const member = await verifyMember(memberNumber);
      console.log('[Login] Member verification successful', {
        memberNumber,
        hasAuthId: !!member.auth_user_id,
        status: member.status,
        verified: member.verified
      });

      // Always use temp email format for authentication
      const email = `${memberNumber.toLowerCase()}@temp.com`;
      
      console.log('[Login] Attempting sign in with:', { 
        email,
        memberNumber,
        hashedPassword: password ? '[REDACTED]' : 'missing'
      });
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: password.trim(),
      });

      if (signInError) {
        console.error('[Login] Sign in error:', {
          error: signInError,
          code: signInError.status,
          message: signInError.message,
          email
        });
        
        const { data: failedLoginData, error: failedLoginError } = await supabase
          .rpc('handle_failed_login', { member_number: memberNumber });

        if (failedLoginError) {
          console.error('[Login] Failed login handling error:', failedLoginError);
          throw failedLoginError;
        }

        const typedFailedLoginData = failedLoginData as FailedLoginResponse;
        console.log('[Login] Failed login response:', typedFailedLoginData);

        if (typedFailedLoginData.locked) {
          throw new Error(`Account locked. Too many failed attempts. Please try again after ${typedFailedLoginData.lockout_duration}`);
        }

        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('Invalid member number or password. Please check your credentials and try again.');
        }

        throw signInError;
      }

      console.log('[Login] Sign in successful, resetting failed attempts');
      await supabase.rpc('reset_failed_login', { member_number: memberNumber });

      const { data: memberData } = await supabase
        .from('members')
        .select('password_reset_required')
        .eq('member_number', memberNumber)
        .maybeSingle();

      if (memberData?.password_reset_required) {
        console.log('[Login] Password reset required');
        toast({
          title: "Password reset required",
          description: "Please set a new password for your account",
        });
        return;
      }

      console.log('[Login] Clearing query cache');
      await queryClient.cancelQueries();
      await queryClient.clear();

      console.log('[Login] Verifying session');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[Login] Session verification error:', sessionError);
        throw sessionError;
      }

      if (!session) {
        console.error('[Login] No session established');
        throw new Error('Failed to establish session');
      }

      console.log('[Login] Session established successfully', {
        userId: session.user.id,
        timestamp: new Date().toISOString()
      });
      
      await queryClient.invalidateQueries();

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });

      if (isMobile) {
        console.log('[Login] Redirecting (mobile):', { to: '/' });
        window.location.href = '/';
      } else {
        console.log('[Login] Navigating (desktop):', { to: '/' });
        navigate('/', { replace: true });
      }
    } catch (error: any) {
      console.error('[Login] Error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Login failed",
        description: error.message || 'An unexpected error occurred',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    memberNumber,
    password,
    setMemberNumber,
    setPassword,
    loading,
    handleLogin,
  };
};