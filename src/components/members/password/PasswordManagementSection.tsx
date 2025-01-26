import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Lock, Key, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AdminPasswordResetDialog from '@/components/auth/AdminPasswordResetDialog';
import MagicLinkButton from '@/components/auth/password/MagicLinkButton';
import SecurityHealthPanel from './SecurityHealthPanel';
import StatusIndicators from './StatusIndicators';
import AdminPasswordControls from './AdminPasswordControls';
import { PasswordChangeData } from '@/components/auth/password/types';
import { DebugConsole } from '@/components/logs/DebugConsole';

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
  const [isResetting, setIsResetting] = useState(false);
  const [lastLoginAt, setLastLoginAt] = useState<Date | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setDebugLogs(prev => [...prev, `${new Date().toISOString()} - ${message}`]);
  };

  useEffect(() => {
    const fetchSessionInfo = async () => {
      try {
        addLog(`Fetching session info for member ${memberNumber}`);
        const { data: sessionData, error } = await supabase
          .rpc('get_user_session_info', { user_id_param: memberId });

        if (error) {
          addLog(`Error fetching session info: ${error.message}`);
          console.error('Error fetching session info:', error);
          return;
        }

        if (sessionData && sessionData[0]) {
          addLog(`Session info retrieved successfully`);
          setLastLoginAt(sessionData[0].last_login ? new Date(sessionData[0].last_login) : null);
          setIsSessionActive(sessionData[0].is_active || false);
        }
      } catch (error) {
        addLog(`Unexpected error in fetchSessionInfo: ${error}`);
        console.error('Error fetching session info:', error);
      }
    };

    fetchSessionInfo();
  }, [memberId, memberNumber]);

  const handleUnlockAccount = async () => {
    try {
      addLog(`Starting account unlock for member ${memberNumber}`);
      setIsUnlocking(true);
      
      const { error } = await supabase.rpc('reset_failed_login', {
        member_number: memberNumber
      });

      if (error) throw error;

      addLog('Account unlock successful');
      toast.success("Account has been unlocked", {
        description: `Successfully unlocked account for ${memberName}`
      });

    } catch (error: any) {
      addLog(`Failed to unlock account: ${error.message}`);
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

  const handleResetLoginState = async () => {
    try {
      addLog(`Starting login state reset for member ${memberNumber}`);
      setIsResetting(true);
      
      const { data, error } = await supabase.rpc('reset_user_login_state', {
        p_member_number: memberNumber
      });

      if (error) {
        addLog(`Error in reset_user_login_state RPC: ${error.message}`);
        throw error;
      }

      const result = data as unknown as PasswordChangeData;
      addLog(`RPC response: ${JSON.stringify(result)}`);
      
      if (result.success) {
        addLog('Login state reset successful');
        toast.success("Login state reset successfully", {
          description: `Reset completed for ${memberName}`
        });
      } else {
        addLog(`Reset failed: ${result.error}`);
        throw new Error(result.error || 'Failed to reset login state');
      }
    } catch (error: any) {
      addLog(`Error in handleResetLoginState: ${error.message}`);
      console.error('Failed to reset login state:', error);
      toast.error("Failed to reset login state", {
        description: error.message
      });
    } finally {
      setIsResetting(false);
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
      <div className="flex flex-wrap items-center gap-2">
        {lockedUntil && new Date(lockedUntil) > new Date() && (
          <Button 
            variant="outline"
            size="sm"
            onClick={handleUnlockAccount}
            disabled={isUnlocking}
            className="bg-dashboard-card hover:bg-dashboard-cardHover border-dashboard-cardBorder hover:border-dashboard-cardBorderHover text-dashboard-text"
          >
            <Lock className="w-4 h-4 mr-2 text-dashboard-accent1" />
            {isUnlocking ? 'Unlocking...' : 'Unlock'}
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowResetDialog(true)}
          className="bg-dashboard-card hover:bg-dashboard-cardHover border-dashboard-cardBorder hover:border-dashboard-cardBorderHover text-dashboard-text"
        >
          <Key className="w-4 h-4 mr-2 text-dashboard-accent1" />
          Reset Password
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleResetLoginState}
          disabled={isResetting}
          className="bg-dashboard-card hover:bg-dashboard-cardHover border-dashboard-cardBorder hover:border-dashboard-cardBorderHover text-dashboard-text"
        >
          <RotateCw className="w-4 h-4 mr-2 text-dashboard-accent1" />
          {isResetting ? 'Resetting...' : 'Reset Login State'}
        </Button>

        <MagicLinkButton 
          memberNumber={memberNumber}
          memberName={memberName}
        />
      </div>

      {/* Debug Console */}
      <DebugConsole logs={debugLogs} />

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