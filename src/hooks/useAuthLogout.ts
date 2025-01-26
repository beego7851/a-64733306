import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useAuthLogout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      console.log('Starting logout process...');
      
      // Clear any stored auth state first
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      
      // Clear any other app-specific storage
      localStorage.clear();
      sessionStorage.clear();

      console.log('Local storage cleared, attempting Supabase signOut...');

      // Attempt Supabase signout
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase signOut error:', error);
        toast({
          title: "Signed Out",
          description: "You have been signed out.",
          variant: "default",
        });
      } else {
        console.log('Supabase signOut successful');
        toast({
          title: "Signed Out",
          description: "Successfully logged out",
          variant: "default",
        });
      }

    } catch (err) {
      console.error('Logout error:', err);
      toast({
        title: "Signed Out",
        description: "You have been signed out.",
        variant: "default",
      });
    } finally {
      // Always redirect to login page
      console.log('Redirecting to login page...');
      navigate('/login');
    }
  };

  return { handleLogout };
};