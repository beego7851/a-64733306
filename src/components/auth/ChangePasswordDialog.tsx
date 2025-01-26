import { useState, useEffect } from "react";
import { Key } from "lucide-react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { supabase } from "@/integrations/supabase/client";
import { PasswordForm } from "./password/PasswordForm";
import { PasswordRequirements } from "./password/PasswordRequirements";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberNumber: string;
}

const ChangePasswordDialog = ({
  open,
  onOpenChange,
  memberNumber,
}: ChangePasswordDialogProps) => {
  console.log("[ChangePasswordDialog] Component rendered", { 
    open, 
    memberNumber,
    timestamp: new Date().toISOString() 
  });
  
  const [memberName, setMemberName] = useState<string>("Loading...");

  useEffect(() => {
    const fetchMemberName = async () => {
      console.log("[ChangePasswordDialog] Fetching member name for", memberNumber);
      try {
        const { data, error } = await supabase
          .from('members')
          .select('full_name')
          .eq('member_number', memberNumber)
          .single();

        if (error) {
          console.error('[ChangePasswordDialog] Error fetching member name:', error);
          setMemberName("Unknown Member");
          return;
        }

        console.log("[ChangePasswordDialog] Member name fetched successfully:", data.full_name);
        setMemberName(data.full_name);
      } catch (error) {
        console.error('[ChangePasswordDialog] Error in fetchMemberName:', error);
        setMemberName("Unknown Member");
      }
    };

    if (open && memberNumber) {
      fetchMemberName();
    }
  }, [open, memberNumber]);

  const handleSuccess = () => {
    console.log("[ChangePasswordDialog] Password change successful, closing dialog");
    onOpenChange(false);
  };

  return (
    <ResponsiveDialog 
      open={open} 
      onOpenChange={(newOpen) => {
        console.log("[ChangePasswordDialog] Dialog state changing to:", newOpen);
        onOpenChange(newOpen);
      }}
      title="Change Password"
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-dashboard-accent1">
          <Key className="w-5 h-5" />
          <div className="text-sm text-dashboard-text">
            <p className="mb-1">Member: <span className="font-medium">{memberName}</span></p>
            <p>Member Number: <span className="font-medium">{memberNumber}</span></p>
          </div>
        </div>

        <PasswordRequirements />
        
        <PasswordForm
          memberNumber={memberNumber}
          onCancel={() => {
            console.log("[ChangePasswordDialog] Cancel button clicked");
            onOpenChange(false);
          }}
          onSuccess={handleSuccess}
        />
      </div>
    </ResponsiveDialog>
  );
};

export default ChangePasswordDialog;