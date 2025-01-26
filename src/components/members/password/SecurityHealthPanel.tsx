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
  const passwordAgePercentage = passwordSetAt 
    ? Math.min(100, (Date.now() - passwordSetAt.getTime()) / (90 * 24 * 60 * 60 * 1000) * 100) 
    : 0;

  const securityScore = React.useMemo(() => {
    let score = 100;
    score -= failedLoginAttempts * 10;
    if (!isEmailVerified) score -= 20;
    if (!is2FAEnabled) score -= 20;
    if (passwordAgePercentage > 80) score -= 20;
    return Math.max(0, score);
  }, [failedLoginAttempts, isEmailVerified, is2FAEnabled, passwordAgePercentage]);

  const getBatteryIcon = () => {
    if (failedLoginAttempts === 0) return <BatteryFull className="w-5 h-5 text-dashboard-success" />;
    if (failedLoginAttempts <= 2) return <BatteryMedium className="w-5 h-5 text-dashboard-warning" />;
    if (failedLoginAttempts <= 4) return <BatteryLow className="w-5 h-5 text-orange-500" />;
    return <BatteryWarning className="w-5 h-5 text-dashboard-error" />;
  };

  return (
    <div className="space-y-4 p-6 bg-dashboard-card rounded-xl border border-dashboard-cardBorder hover:border-dashboard-cardBorderHover transition-all">
      <h3 className="text-lg font-semibold text-dashboard-accent1">Security Health</h3>
      
      {/* Security Score */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-dashboard-text">Security Score</span>
          <span className={`text-sm font-bold ${
            securityScore > 80 ? 'text-dashboard-success' : 
            securityScore > 60 ? 'text-dashboard-warning' : 
            'text-dashboard-error'
          }`}>
            {securityScore}%
          </span>
        </div>
        <Progress 
          value={securityScore} 
          className={`h-2 ${
            securityScore > 80 ? 'bg-dashboard-success/20' : 
            securityScore > 60 ? 'bg-dashboard-warning/20' : 
            'bg-dashboard-error/20'
          }`} 
        />
      </div>

      {/* Failed Login Attempts */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-dashboard-cardHover">
              {getBatteryIcon()}
              <span className="text-sm text-dashboard-text">
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
          <span className="text-sm text-dashboard-text">Password Age</span>
          <span className="text-sm text-dashboard-muted">
            {passwordSetAt ? formatDistanceToNow(passwordSetAt, { addSuffix: true }) : 'Never set'}
          </span>
        </div>
        <Progress 
          value={passwordAgePercentage} 
          className={`h-2 ${passwordAgePercentage > 80 ? 'bg-dashboard-error/20' : 'bg-dashboard-accent1/20'}`}
        />
      </div>

      {/* Security Features */}
      <div className="grid grid-cols-2 gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-dashboard-cardHover">
                <Shield className={`w-4 h-4 ${is2FAEnabled ? 'text-dashboard-success' : 'text-dashboard-muted'}`} />
                <span className="text-sm text-dashboard-text">2FA {is2FAEnabled ? 'Enabled' : 'Disabled'}</span>
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
              <div className="flex items-center gap-2 p-3 rounded-lg bg-dashboard-cardHover">
                <Mail className={`w-4 h-4 ${isEmailVerified ? 'text-dashboard-success' : 'text-dashboard-muted'}`} />
                <span className="text-sm text-dashboard-text">Email {isEmailVerified ? 'Verified' : 'Unverified'}</span>
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