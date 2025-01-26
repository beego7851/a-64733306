import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export const useCollectorSync = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const performSync = async (retryCount = 0): Promise<{ success: boolean }> => {
    try {
      console.log(`Attempting role sync (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      
      const { data, error } = await supabase.rpc('perform_user_roles_sync');
      
      if (error) {
        console.error('Role sync error:', error);
        
        // If we haven't exceeded max retries, try again
        if (retryCount < MAX_RETRIES - 1) {
          console.log(`Retrying in ${RETRY_DELAY}ms...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
          return performSync(retryCount + 1);
        }
        
        throw error;
      }

      console.log('Role sync completed successfully');
      return { success: true };
    } catch (error) {
      if (retryCount < MAX_RETRIES - 1) {
        console.log(`Retrying after error (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return performSync(retryCount + 1);
      }
      throw error;
    }
  };

  return useMutation({
    mutationFn: performSync,
    meta: {
      onSuccess: () => {
        // Invalidate all related queries
        Promise.all([
          queryClient.invalidateQueries({ queryKey: ['collectors-roles'] }),
          queryClient.invalidateQueries({ queryKey: ['userRoles'] }),
          queryClient.invalidateQueries({ queryKey: ['roleSyncStatus'] })
        ]).then(() => {
          console.log('All queries invalidated after successful sync');
        });

        toast({
          title: "Roles synchronized",
          description: "User roles have been synchronized successfully.",
        });
      },
      onError: (error: Error) => {
        console.error('Role sync error after all retries:', error);
        toast({
          title: "Error syncing roles",
          description: "Failed to sync roles after multiple attempts. Please try again later.",
          variant: "destructive",
        });
      }
    }
  });
};