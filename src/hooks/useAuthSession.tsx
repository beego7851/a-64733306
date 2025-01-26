import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSignOut = async (skipStorageClear = false) => {
    console.log('[Auth] Starting sign out process...');
    if (isLoggingOut) {
      console.log('[Auth] Logout already in progress, skipping...');
      return;
    }

    try {
      setIsLoggingOut(true);
      setLoading(true);
      
      console.log('[Auth] Clearing query cache...');
      await queryClient.resetQueries();
      await queryClient.clear();
      
      // Clear storage first
      if (!skipStorageClear) {
        console.log('[Auth] Clearing local storage...');
        localStorage.clear();
        sessionStorage.clear();
      }

      // Clear session state before signing out
      setSession(null);

      try {
        // Attempt to sign out from Supabase
        console.log('[Auth] Signing out from Supabase...');
        const { error } = await supabase.auth.signOut();
        if (error) {
          // Log the error but continue with the logout process
          console.warn('[Auth] Non-critical error during sign out:', error);
        } else {
          console.log('[Auth] Sign out successful');
        }
      } catch (signOutError: any) {
        // Log but don't throw the error
        console.warn('[Auth] Non-critical error during sign out:', signOutError);
      }

      // Always redirect to login
      window.location.href = '/login';
      
    } catch (error: any) {
      console.error('[Auth] Error during sign out:', error);
      // Even if there's an error, clear storage and redirect
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
      
      toast({
        title: "Signed Out",
        description: "You have been signed out.",
      });
    } finally {
      setIsLoggingOut(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    console.log('[Auth] Session hook mounted');

    const initializeSession = async () => {
      try {
        console.log('[Auth] Initializing session...');
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] Session initialization error:', error);
          throw error;
        }
        
        if (mounted) {
          console.log('[Auth] Setting session state:', {
            hasSession: !!currentSession,
            userId: currentSession?.user?.id,
            timestamp: new Date().toISOString()
          });
          setSession(currentSession);
          setLoading(false);
        }
      } catch (error) {
        console.error('[Auth] Session initialization failed:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!mounted) return;

      console.log('[Auth] Auth state changed:', {
        event,
        hasSession: !!currentSession,
        userId: currentSession?.user?.id,
        timestamp: new Date().toISOString()
      });
      
      if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !currentSession)) {
        console.log('[Auth] User signed out or token refresh failed');
        window.location.href = '/login';
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.log('[Auth] User signed in or token refreshed');
        setSession(currentSession);
        queryClient.invalidateQueries({ queryKey: ['userRoles'] });
      }
      
      setLoading(false);
    });

    initializeSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient, toast]);

  return { session, loading, handleSignOut };
}