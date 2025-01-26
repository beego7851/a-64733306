import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Lock, Key } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AdminPasswordResetDialog from '@/components/auth/AdminPasswordResetDialog';
import MagicLinkButton from '@/components/auth/password/MagicLinkButton';
import SecurityHealthPanel from './SecurityHealthPanel';
import StatusIndicators from './StatusIndicators';
import AdminPasswordControls from './AdminPasswordControls';

interface PasswordManagementSectionProps {
  memberId: string;
  memberNumber: string;
  memberName: string;
  passwordSetAt: Date | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  passwordResetRequired: boolean;
}

const PasswordManagementSection = ({
  memberId,
  memberNumber,
  memberName,
  passwordSetAt,
  failedLoginAttempts,
  lockedUntil,
  passwordResetRequired,
}: PasswordManagementSectionProps) => {
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [lastLoginAt, setLastLoginAt] = useState<Date | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);

  useEffect(() => {
    const fetchSessionInfo = async () => {
      try {
        const { data: sessionData, error } = await supabase
          .rpc('get_user_session_info', { user_id_param: memberId });

        if (error) {
          console.error('Error fetching session info:', error);
          return;
        }

        if (sessionData && sessionData[0]) {
          setLastLoginAt(sessionData[0].last_login ? new Date(sessionData[0].last_login) : null);
          setIsSessionActive(sessionData[0].is_active || false);
        }
      } catch (error) {
        console.error('Error fetching session info:', error);
      }
    };

    fetchSessionInfo();
  }, [memberId]);

  const handleUnlockAccount = async () => {
    try {
      console.log('Unlocking account for member:', {
        memberNumber,
        memberName,
        timestamp: new Date().toISOString()
      });

      setIsUnlocking(true);
      const { error } = await supabase.rpc('reset_failed_login', {
        member_number: memberNumber
      });

      if (error) throw error;

      toast.success("Account has been unlocked", {
        description: `Successfully unlocked account for ${memberName}`
      });

    } catch (error: any) {
      console.error('Failed to unlock account:', {
        error,
        memberNumber,
        timestamp: new Date().toISOString()
      });
      
      toast.error("Failed to unlock account", {
        description: error.message
      });
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Section */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-dashboard-accent1">Password Status</h4>
        <StatusIndicators
          passwordSetAt={passwordSetAt}
          lockedUntil={lockedUntil}
          passwordResetRequired={passwordResetRequired}
          lastLoginAt={lastLoginAt}
          isSessionActive={isSessionActive}
        />
      </div>

      {/* Security Health Panel */}
      <SecurityHealthPanel
        failedLoginAttempts={failedLoginAttempts}
        passwordSetAt={passwordSetAt}
        isEmailVerified={true}
        is2FAEnabled={false}
      />

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {lockedUntil && new Date(lockedUntil) > new Date() && (
          <Button 
            variant="outline"
            size="sm"
            onClick={handleUnlockAccount}
            disabled={isUnlocking}
            className="bg-dashboard-card hover:bg-dashboard-cardHover"
          >
            <Lock className="w-4 h-4 mr-2" />
            {isUnlocking ? 'Unlocking...' : 'Unlock'}
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowResetDialog(true)}
          className="bg-dashboard-card hover:bg-dashboard-cardHover"
        >
          <Key className="w-4 h-4 mr-2" />
          Reset Password
        </Button>

        <MagicLinkButton 
          memberNumber={memberNumber}
          memberName={memberName}
        />
      </div>

      {/* Admin Controls */}
      <AdminPasswordControls
        memberId={memberId}
        memberNumber={memberNumber}
        memberName={memberName}
      />

      {/* Reset Dialog */}
      <AdminPasswordResetDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        memberNumber={memberNumber}
        memberName={memberName}
      />
    </div>
  );
};

export default PasswordManagementSection;