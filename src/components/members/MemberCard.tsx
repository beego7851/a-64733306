import { useState } from 'react';
import { Member } from '@/types/member';
import { Collector } from "@/types/collector";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useQuery } from '@tanstack/react-query';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import PaymentDialog from './PaymentDialog';
import NotesDialog from './notes/NotesDialog';
import EditProfileDialog from './EditProfileDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MemberPasswordSection from './card/MemberPasswordSection';
import MemberPaymentHistory from './card/MemberPaymentHistory';
import LoginDiagnosticsPanel from './diagnostics/LoginDiagnosticsPanel';
import { ContactInfoSection } from './card/ContactInfoSection';
import { AddressSection } from './card/AddressSection';
import { MemberActions } from './card/MemberActions';
import { NotesSection } from './card/NotesSection';

interface MemberCardProps {
  member: Member;
  userRole: string | null;
  onEditClick: () => void;
  onDeleteClick: () => void;
  rolePermissions: {
    isAdmin: boolean;
    isCollector: boolean;
    isMember: boolean;
    hasMultipleRoles: boolean;
  };
}

const MemberCard = ({ member, userRole, onEditClick, onDeleteClick, rolePermissions }: MemberCardProps) => {
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const { hasRole } = useRoleAccess();
  const canModify = userRole === 'admin' || userRole === 'collector';

  const { data: collectorInfo } = useQuery({
    queryKey: ['collectorInfo', member.collector],
    queryFn: async () => {
      if (!member.collector) return null;
      
      const { data, error } = await supabase
        .from('members_collectors')
        .select('id, name, phone, prefix, number, email, active, created_at, updated_at, member_number')
        .eq('name', member.collector)
        .maybeSingle();
        
      if (error) throw error;
      return data as Collector;
    },
    enabled: !!member.collector
  });

  const { data: diagnostics, isLoading: isDiagnosticsLoading } = useQuery({
    queryKey: ['memberDiagnostics', member.id, showDiagnostics],
    queryFn: async () => {
      if (!showDiagnostics) return null;
      
      try {
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', member.auth_user_id);

        if (rolesError) throw rolesError;

        const { data: auditLogs, error: auditError } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('user_id', member.auth_user_id)
          .order('timestamp', { ascending: false })
          .limit(10);

        if (auditError) throw auditError;

        const transformedLogs = (auditLogs || []).map(log => ({
          timestamp: log.timestamp,
          operation: log.operation,
          details: {
            ...(typeof log.new_values === 'object' ? log.new_values : {}),
            old_values: log.old_values,
            table: log.table_name,
            severity: log.severity
          }
        }));

        const { data: payments, error: paymentsError } = await supabase
          .from('payment_requests')
          .select('*')
          .eq('member_number', member.member_number)
          .order('created_at', { ascending: false })
          .limit(5);

        if (paymentsError) throw paymentsError;

        return {
          roles: roles || [],
          auditLogs: transformedLogs,
          payments: payments || [],
          accountStatus: {
            isVerified: member.verified,
            hasAuthId: !!member.auth_user_id,
            membershipStatus: member.status,
            paymentStatus: member.yearly_payment_status,
          }
        };
      } catch (error) {
        console.error('Error in diagnostics:', error);
        return null;
      }
    },
    enabled: showDiagnostics
  });

  return (
    <AccordionItem value={member.id} className="border-b border-white/10">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full text-left px-1">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-dashboard-accent1">{member.full_name}</h3>
            <p className="text-base text-dashboard-accent2">Member Number: {member.member_number}</p>
          </div>
          <MemberActions 
            onEdit={() => setIsEditProfileOpen(true)}
            onDelete={() => setShowDeleteConfirm(true)}
            onPayment={() => setIsPaymentDialogOpen(true)}
            canModify={canModify}
            isAdmin={userRole === 'admin'}
          />
        </div>
      </AccordionTrigger>

      <AccordionContent>
        <div className="space-y-6 py-4">
          <ContactInfoSection member={member} />
          <AddressSection member={member} />

          {userRole === 'admin' && (
            <MemberPasswordSection 
              memberNumber={member.member_number}
              memberId={member.id}
              memberName={member.full_name}
              passwordSetAt={member.password_set_at ? new Date(member.password_set_at) : null}
              failedLoginAttempts={member.failed_login_attempts}
              lockedUntil={member.locked_until ? new Date(member.locked_until) : null}
              passwordResetRequired={member.password_reset_required}
            />
          )}

          <MemberPaymentHistory memberId={member.id} />

          {userRole === 'admin' && (
            <NotesSection 
              memberId={member.id}
              onAddNote={() => setIsNoteDialogOpen(true)}
            />
          )}

          {userRole === 'admin' && (
            <div className="mt-6 border-t border-white/10 pt-4">
              <Button
                onClick={() => setShowDiagnostics(!showDiagnostics)}
                variant="ghost"
                className="w-full justify-between text-dashboard-text hover:text-white"
              >
                Login Diagnostics
                {showDiagnostics ? (
                  <ChevronUp className="w-4 h-4 ml-2" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-2" />
                )}
              </Button>
              
              <LoginDiagnosticsPanel 
                diagnostics={diagnostics}
                isLoading={isDiagnosticsLoading}
              />
            </div>
          )}
        </div>
      </AccordionContent>

      <PaymentDialog
        isOpen={isPaymentDialogOpen}
        onClose={() => setIsPaymentDialogOpen(false)}
        memberId={member.id}
        memberNumber={member.member_number}
        memberName={member.full_name}
        collectorInfo={collectorInfo}
        rolePermissions={rolePermissions}
      />

      <NotesDialog
        isOpen={isNoteDialogOpen}
        onClose={() => setIsNoteDialogOpen(false)}
        memberId={member.id}
      />

      <EditProfileDialog
        member={member}
        open={isEditProfileOpen}
        onOpenChange={setIsEditProfileOpen}
        onProfileUpdated={() => window.location.reload()}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the member
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDeleteConfirm(false);
                onDeleteClick();
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AccordionItem>
  );
};

export default MemberCard;