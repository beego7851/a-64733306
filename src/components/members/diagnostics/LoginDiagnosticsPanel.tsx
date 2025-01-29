import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface LoginDiagnosticsPanelProps {
  diagnostics: {
    accountStatus: {
      isVerified: boolean;
      hasAuthId: boolean;
      membershipStatus: string;
      paymentStatus: string;
    };
    roles: Array<{
      role: string;
      created_at: string;
    }>;
    auditLogs: Array<{
      timestamp: string;
      operation: string;
      details: any;
    }>;
    payments: Array<{
      created_at: string;
      amount: number;
      status: string;
    }>;
  } | null;
  isLoading: boolean;
}

const LoginDiagnosticsPanel = ({ diagnostics, isLoading }: LoginDiagnosticsPanelProps) => {
  if (isLoading || !diagnostics) return null;

  return (
    <ScrollArea className="h-[300px] rounded-md border border-white/10 p-4">
      <div className="space-y-4">
        <div>
          <h4 className="text-dashboard-accent1 mb-2">Account Status</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-dashboard-text">Verified:</div>
            <div className={diagnostics.accountStatus.isVerified ? "text-dashboard-accent3" : "text-dashboard-warning"}>
              {diagnostics.accountStatus.isVerified ? "Yes" : "No"}
            </div>
            <div className="text-dashboard-text">Auth ID:</div>
            <div className={diagnostics.accountStatus.hasAuthId ? "text-dashboard-accent3" : "text-dashboard-warning"}>
              {diagnostics.accountStatus.hasAuthId ? "Linked" : "Not Linked"}
            </div>
            <div className="text-dashboard-text">Member Status:</div>
            <div className="text-dashboard-accent2">{diagnostics.accountStatus.membershipStatus}</div>
            <div className="text-dashboard-text">Payment Status:</div>
            <div className={`${
              diagnostics.accountStatus.paymentStatus === 'completed' 
                ? 'text-dashboard-accent3' 
                : 'text-dashboard-warning'
            }`}>
              {diagnostics.accountStatus.paymentStatus}
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-dashboard-accent1 mb-2">User Roles</h4>
          <div className="space-y-1">
            {diagnostics.roles.map((role, index) => (
              <div key={index} className="text-dashboard-text">
                {role.role} (since {format(new Date(role.created_at), 'dd/MM/yyyy')})
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-dashboard-accent1 mb-2">Recent Payments</h4>
          <div className="space-y-2">
            {diagnostics.payments.map((payment, index) => (
              <div key={index} className="text-dashboard-text flex justify-between">
                <span>{format(new Date(payment.created_at), 'dd/MM/yyyy')}</span>
                <span className="text-dashboard-accent2">${payment.amount}</span>
                <span className={`${
                  payment.status === 'approved' 
                    ? 'text-dashboard-accent3' 
                    : 'text-dashboard-warning'
                }`}>
                  {payment.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-dashboard-accent1 mb-2">Recent Activity</h4>
          <div className="space-y-2">
            {diagnostics.auditLogs.map((log, index) => (
              <div key={index} className="text-sm text-dashboard-text">
                <div className="flex justify-between">
                  <span>{format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')}</span>
                  <Badge variant={log.operation === 'create' ? 'default' : 'secondary'}>
                    {log.operation}
                  </Badge>
                </div>
                {log.details && (
                  <div className="mt-1 text-xs text-dashboard-muted">
                    {JSON.stringify(log.details)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default LoginDiagnosticsPanel;