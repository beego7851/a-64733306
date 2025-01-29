import { supabase } from "@/integrations/supabase/client";
import { QueryClient } from '@tanstack/react-query';

export const clearAuthState = async () => {
  console.log('[Auth] Starting clear auth state');
  await supabase.auth.signOut();
  await new QueryClient().clear();
  localStorage.clear();
  console.log('[Auth] Auth state cleared');
};

export const verifyMember = async (memberNumber: string) => {
  console.log('[Auth] Starting member verification:', { memberNumber });
  try {
    const { data: members, error: memberError } = await supabase
      .from('members')
      .select('id, member_number, status, locked_until, auth_user_id, verified')
      .eq('member_number', memberNumber)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (memberError) {
      console.error('[Auth] Member verification error:', memberError);
      if (memberError.code === 'PGRST116') {
        throw new Error('Member not found or inactive');
      }
      throw memberError;
    }

    if (!members) {
      console.log('[Auth] Member not found:', { memberNumber });
      throw new Error('Member not found or inactive');
    }

    if (members.locked_until && new Date(members.locked_until) > new Date()) {
      console.log('[Auth] Account locked:', {
        memberNumber,
        lockedUntil: members.locked_until
      });
      throw new Error(`Account is locked until ${new Date(members.locked_until).toLocaleString()}`);
    }

    console.log('[Auth] Member verification successful:', {
      memberNumber,
      status: members.status,
      hasAuthId: !!members.auth_user_id,
      verified: members.verified
    });

    return members;
  } catch (error: any) {
    console.error('[Auth] Member verification error:', error);
    throw error;
  }
};

export const handleSignInError = async (error: any, email: string, password: string) => {
  console.error('[Auth] Sign in error:', error);
  if (error.message.includes('refresh_token_not_found')) {
    console.log('[Auth] Refresh token error detected, clearing session and retrying');
    await clearAuthState();
    
    // Retry sign in after clearing session
    const { error: retryError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (retryError) {
      console.error('[Auth] Retry sign in failed:', retryError);
      throw retryError;
    }

    console.log('[Auth] Retry sign in successful');
  } else {
    throw error;
  }
};