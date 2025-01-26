import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Lock, Loader2 } from "lucide-react";
import { PasswordInput } from "./PasswordInput";
import { usePasswordChange } from "./usePasswordChange";
import { PasswordFormValues } from "./types";
import { toast } from "sonner";

const passwordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface PasswordFormProps {
  onSubmit?: (values: PasswordFormValues) => Promise<void>;
  memberNumber: string;
  onCancel?: () => void;
  onSuccess?: () => void;
  onError?: (error: any) => void;
  hideCurrentPassword?: boolean;
  resetToken?: string;
  isSubmitting?: boolean;
  setIsSubmitting?: (value: boolean) => void;
}

export const PasswordForm = ({
  onSubmit,
  memberNumber,
  onCancel,
  onSuccess,
  onError,
  hideCurrentPassword = false,
  resetToken,
  isSubmitting: externalIsSubmitting,
  setIsSubmitting: externalSetIsSubmitting
}: PasswordFormProps) => {
  console.log("[PasswordForm] Initializing with props:", { 
    memberNumber, 
    hideCurrentPassword, 
    hasResetToken: !!resetToken,
    timestamp: new Date().toISOString()
  });

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const { isSubmitting: internalIsSubmitting, handlePasswordChange } = usePasswordChange(memberNumber, onSuccess);
  const isSubmitting = externalIsSubmitting ?? internalIsSubmitting;
  const setIsSubmitting = externalSetIsSubmitting ?? (() => {});

  const handleFormSubmit = async (values: PasswordFormValues) => {
    console.log("[PasswordForm] Form submission started", { 
      hasCurrentPassword: !!values.currentPassword,
      hasNewPassword: !!values.newPassword,
      hasConfirmPassword: !!values.confirmPassword,
      timestamp: new Date().toISOString()
    });
    
    try {
      setIsSubmitting(true);
      console.log("[PasswordForm] Calling handlePasswordChange");
      
      if (onSubmit) {
        await onSubmit(values);
      } else {
        const result = await handlePasswordChange(values, resetToken);
        console.log("[PasswordForm] Password change result:", result);
        
        if (result?.success) {
          console.log("[PasswordForm] Password change successful");
          form.reset();
          toast.success("Password updated successfully");
          if (onSuccess) {
            onSuccess();
          }
        } else {
          console.error("[PasswordForm] Password change failed:", result?.error);
          let errorMessage = result?.error;
          
          if (result?.code === 'INVALID_CURRENT_PASSWORD') {
            errorMessage = "Current password is incorrect";
          } else if (result?.code === 'MEMBER_NOT_FOUND') {
            errorMessage = "Member not found";
          }
          
          toast.error(errorMessage || "Failed to update password");
          if (onError) {
            onError(result?.error);
          }
        }
      }
    } catch (error) {
      console.error("[PasswordForm] Submit error:", error);
      if (onError) {
        onError(error);
      }
    } finally {
      console.log("[PasswordForm] Form submission completed");
      setIsSubmitting(false);
    }
  };

  console.log("[PasswordForm] Form state", { 
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty,
    errors: form.formState.errors
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        {!hideCurrentPassword && (
          <PasswordInput
            form={form}
            name="currentPassword"
            label="Current Password"
            disabled={isSubmitting}
            required
          />
        )}
        
        <PasswordInput
          form={form}
          name="newPassword"
          label="New Password"
          disabled={isSubmitting}
          required
        />

        <PasswordInput
          form={form}
          name="confirmPassword"
          label="Confirm Password"
          disabled={isSubmitting}
          required
        />

        <div className="flex justify-end space-x-4 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                console.log("[PasswordForm] Cancel button clicked");
                onCancel();
              }}
              disabled={isSubmitting}
              className="bg-dashboard-dark hover:bg-dashboard-cardHover hover:text-white border-dashboard-cardBorder transition-all duration-200"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || !form.formState.isValid}
            className="bg-[#9b87f5] text-white hover:bg-[#7E69AB] transition-all duration-200 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Update Password
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};