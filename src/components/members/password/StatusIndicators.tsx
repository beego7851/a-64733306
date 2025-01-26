import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from 'date-fns';
import { Lock, LockKeyhole, RefreshCw, Shield, Clock } from "lucide-react";

interface StatusIndicatorsProps {
  passwordSetAt: Date | null;
  lockedUntil: Date | null;
  passwordResetRequired: boolean;
  lastLoginAt?: Date | null;
  isSessionActive?: boolean;
}

const StatusIndicators = ({
  passwordSetAt,
  lockedUntil,
  passwordResetRequired,
  lastLoginAt,
  isSessionActive = false
}: StatusIndicatorsProps) => {
  const passwordAgeStatus = passwordSetAt && 
    Math.floor((Date.now() - passwordSetAt.getTime()) / (1000 * 60 * 60 * 24)) > 90 
    ? 'warning' 
    : 'success';

  return (
    <div className="flex flex-wrap gap-2">
      <TooltipProvider>
        {/* Password Set Status */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={`bg-${passwordAgeStatus === 'warning' ? 'yellow' : 'green'}-500/10 
                         text-${passwordAgeStatus === 'warning' ? 'yellow' : 'green'}-500`}
            >
              <LockKeyhole className="w-3 h-3 mr-1" />
              {passwordSetAt 
                ? `Set ${formatDistanceToNow(passwordSetAt)} ago` 
                : 'No Password'}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Password was last set on {passwordSetAt?.toLocaleDateString()}</p>
          </TooltipContent>
        </Tooltip>

        {/* Lock Status */}
        {lockedUntil && new Date(lockedUntil) > new Date() && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="bg-red-500/10 text-red-500">
                <Lock className="w-3 h-3 mr-1" />
                Locked
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Account is locked until {lockedUntil.toLocaleString()}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Reset Required Status */}
        {passwordResetRequired && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                <RefreshCw className="w-3 h-3 mr-1" />
                Reset Required
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>User must change their password on next login</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Session Status */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={`bg-${isSessionActive ? 'green' : 'gray'}-500/10 
                         text-${isSessionActive ? 'green' : 'gray'}-500`}
            >
              <Shield className="w-3 h-3 mr-1" />
              {isSessionActive ? 'Active Session' : 'No Active Session'}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isSessionActive 
                ? 'User currently has an active session' 
                : 'User is not currently logged in'}
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Last Login */}
        {lastLoginAt && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="bg-purple-500/10 text-purple-500">
                <Clock className="w-3 h-3 mr-1" />
                Last login {formatDistanceToNow(lastLoginAt)} ago
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Last logged in on {lastLoginAt.toLocaleString()}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
};

export default StatusIndicators;