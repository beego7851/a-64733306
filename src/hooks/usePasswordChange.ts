import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { PasswordFormValues, PasswordChangeData } from "@/components/auth/password/types";

interface PasswordChangeResult {
  success: boolean;
  error?: string;
  code?: string;
  details?: {
    timestamp: string;
    [key: string]: any;
  };
}

const MAX_RETRIES = 3;

export const usePasswordChange = (memberNumber: string, onSuccess?: () => void) => {
  console.log("[usePasswordChange] Hook initialized", { 
    memberNumber,
    timestamp: new Date().toISOString()
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handlePasswordChange = async (values: PasswordFormValues, resetToken?: string, retryCount = 0): Promise<PasswordChangeData | null> => {
    console.log("[usePasswordChange] handlePasswordChange called", { 
      hasResetToken: !!resetToken,
      retryCount,
      memberNumber,
      timestamp: new Date().toISOString()
    });

    if (retryCount >= MAX_RETRIES) {
      console.error("[usePasswordChange] Maximum retry attempts reached");
      toast.error("Maximum retry attempts reached. Please try again later.");
      return null;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Changing password...");

    try {
      console.log("[usePasswordChange] Starting password change", {
        hasResetToken: !!resetToken,
        timestamp: new Date().toISOString(),
        retryCount
      });

      const { data: rpcResponse, error } = resetToken 
        ? await supabase.rpc('handle_password_reset_with_token', {
            token_value: resetToken,
            new_password: values.newPassword,
            ip_address: null,
            user_agent: navigator.userAgent,
            client_info: {
              timestamp: new Date().toISOString(),
              browser: navigator.userAgent,
              platform: navigator.platform
            }
          })
        : await supabase.rpc('handle_password_reset', {
            member_number: memberNumber,
            new_password: values.newPassword,
            current_password: values.currentPassword,
            ip_address: null,
            user_agent: navigator.userAgent,
            client_info: {
              timestamp: new Date().toISOString(),
              browser: navigator.userAgent,
              platform: navigator.platform
            }
          });

      console.log("[usePasswordChange] RPC Response received", {
        hasData: !!rpcResponse,
        hasError: !!error,
        errorMessage: error?.message
      });

      if (error) {
        console.error("[usePasswordChange] Error from RPC:", error);
        toast.dismiss(toastId);
        
        if (error.code === 'PGRST301' && retryCount < MAX_RETRIES) {
          console.log("[usePasswordChange] Retrying due to PGRST301 error");
          return handlePasswordChange(values, resetToken, retryCount + 1);
        }
        
        return {
          success: false,
          error: error.message,
          code: error.code
        };
      }

      const typedResponse = rpcResponse as unknown as PasswordChangeResult;

      if (!typedResponse || !typedResponse.success) {
        console.error("[usePasswordChange] Unsuccessful response:", typedResponse);
        toast.dismiss(toastId);
        return {
          success: false,
          error: typedResponse?.error || "Failed to change password",
          code: typedResponse?.code
        };
      }

      console.log("[usePasswordChange] Password change successful");
      toast.dismiss(toastId);
      toast.success("Password changed successfully");
      
      if (onSuccess) {
        onSuccess();
      }

      if (resetToken) {
        navigate('/login');
      }

      return {
        success: true,
        message: "Password changed successfully",
        code: "SUCCESS"
      };

    } catch (error: any) {
      console.error("[usePasswordChange] Unexpected error:", error);
      toast.dismiss(toastId);
      toast.error("An unexpected error occurred");
      return {
        success: false,
        error: error.message,
        code: 'UNEXPECTED_ERROR'
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handlePasswordChange
  };
};