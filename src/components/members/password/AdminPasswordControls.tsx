import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Shield, Power, History } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AdminPasswordControlsProps {
  memberId: string;
  memberNumber: string;
  memberName: string;
}

const AdminPasswordControls = ({ memberId, memberNumber, memberName }: AdminPasswordControlsProps) => {
  const [isTerminating, setIsTerminating] = useState(false);

  const handleTerminateSessions = async () => {
    try {
      console.log("[AdminPasswordControls] Terminating sessions for", {
        memberNumber,
        memberName,
        timestamp: new Date().toISOString()
      });

      setIsTerminating(true);
      const { error } = await supabase.auth.admin.signOut(memberNumber);

      if (error) throw error;

      toast.success("All sessions terminated", {
        description: `Successfully terminated all sessions for ${memberName}`
      });
    } catch (error: any) {
      console.error("[AdminPasswordControls] Error terminating sessions:", error);
      toast.error("Failed to terminate sessions", {
        description: error.message
      });
    } finally {
      setIsTerminating(false);
    }
  };

  return (
    <div className="space-y-4 border-t border-white/10 pt-4">
      <h4 className="text-sm font-medium text-dashboard-accent1">Admin Controls</h4>
      
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleTerminateSessions}
          disabled={isTerminating}
          className="bg-dashboard-card hover:bg-dashboard-cardHover"
        >
          <Power className="w-4 h-4 mr-2 text-red-500" />
          {isTerminating ? "Terminating..." : "Terminate All Sessions"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Open audit logs in a new tab
            window.open(`/audit?member=${memberNumber}`, '_blank');
          }}
          className="bg-dashboard-card hover:bg-dashboard-cardHover"
        >
          <History className="w-4 h-4 mr-2 text-dashboard-accent2" />
          View Audit Logs
        </Button>
      </div>
    </div>
  );
};

export default AdminPasswordControls;