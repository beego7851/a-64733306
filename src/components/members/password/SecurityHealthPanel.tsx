import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  BatteryFull, 
  BatteryMedium, 
  BatteryLow, 
  BatteryWarning,
  Shield,
  Mail
} from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SecurityHealthPanelProps {
  failedLoginAttempts: number;
  passwordSetAt: Date | null;
  isEmailVerified: boolean;
  is2FAEnabled: boolean;
}

const SecurityHealthPanel = ({
  failedLoginAttempts,
  passwordSetAt,
  isEmailVerified,
  is2FAEnabled
}: SecurityHealthPanelProps) => {
  // Calculate password age percentage (90 days = 100%)
  const passwordAgePercentage = passwordSetAt 
    ? Math.min(100, (Date.now() - passwordSetAt.getTime()) / (90 * 24 * 60 * 60 * 1000) * 100) 
    : 0;

  // Calculate security score (0-100)
  const securityScore = React.useMemo(() => {
    let score = 100;
    
    // Deduct for failed login attempts
    score -= failedLoginAttempts * 10;
    
    // Deduct for missing security features
    if (!isEmailVerified) score -= 20;
    if (!is2FAEnabled) score -= 20;
    
    // Deduct for old password
    if (passwordAgePercentage > 80) score -= 20;
    
    return Math.max(0, score);
  }, [failedLoginAttempts, isEmailVerified, is2FAEnabled, passwordAgePercentage]);

  const getBatteryIcon = () => {
    if (failedLoginAttempts === 0) return <BatteryFull className="w-5 h-5 text-green-500" />;
    if (failedLoginAttempts <= 2) return <BatteryMedium className="w-5 h-5 text-yellow-500" />;
    if (failedLoginAttempts <= 4) return <BatteryLow className="w-5 h-5 text-orange-500" />;
    return <BatteryWarning className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border border-border">
      <h3 className="text-lg font-semibold">Security Health</h3>
      
      {/* Security Score */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Security Score</span>
          <span className={`text-sm font-bold ${
            securityScore > 80 ? 'text-green-500' : 
            securityScore > 60 ? 'text-yellow-500' : 
            'text-red-500'
          }`}>
            {securityScore}%
          </span>
        </div>
        <Progress value={securityScore} className="h-2" />
      </div>

      {/* Failed Login Attempts */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              {getBatteryIcon()}
              <span className="text-sm">
                Failed attempts: <span className="font-medium">{failedLoginAttempts}</span>/5
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Account locks after 5 failed attempts</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Password Age */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm">Password Age</span>
          <span className="text-sm text-muted-foreground">
            {passwordSetAt ? formatDistanceToNow(passwordSetAt, { addSuffix: true }) : 'Never set'}
          </span>
        </div>
        <Progress 
          value={passwordAgePercentage} 
          className={`h-2 ${passwordAgePercentage > 80 ? 'bg-red-200' : ''}`}
        />
      </div>

      {/* Security Features */}
      <div className="grid grid-cols-2 gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <Shield className={`w-4 h-4 ${is2FAEnabled ? 'text-green-500' : 'text-gray-400'}`} />
                <span className="text-sm">2FA {is2FAEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Two-factor authentication adds an extra layer of security</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <Mail className={`w-4 h-4 ${isEmailVerified ? 'text-green-500' : 'text-gray-400'}`} />
                <span className="text-sm">Email {isEmailVerified ? 'Verified' : 'Unverified'}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Email verification helps secure your account</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default SecurityHealthPanel;