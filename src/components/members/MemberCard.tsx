import { useState } from 'react';
import { Member } from '@/types/member';
import { Collector } from "@/types/collector";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useQuery } from '@tanstack/react-query';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { format } from 'date-fns';
import PaymentDialog from './PaymentDialog';
import NotesDialog from './notes/NotesDialog';
import NotesList from './notes/NotesList';
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
import { Trash2 } from 'lucide-react';
import MemberPasswordSection from './card/MemberPasswordSection';
import MemberPaymentHistory from './card/MemberPaymentHistory';
import LoginDiagnosticsPanel from './diagnostics/LoginDiagnosticsPanel';

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
  const { toast } = useToast();
  const { hasRole } = useRoleAccess();
  const isCollector = hasRole('collector');
  const canModify = userRole === 'admin' || userRole === 'collector';

  // Add diagnostics query
  const { data: diagnostics, isLoading: isDiagnosticsLoading } = useQuery({
    queryKey: ['memberDiagnostics', member.id, showDiagnostics],
    queryFn: async () => {
      if (!showDiagnostics) return null;
      
      console.log('Fetching diagnostics for member:', member.member_number);
      
      try {
        // Fetch user roles
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', member.auth_user_id);

        if (rolesError) {
          console.error('Error fetching roles:', rolesError);
          throw rolesError;
        }
        console.log('Found roles:', roles);

        // Fetch audit logs
        const { data: auditLogs, error: auditError } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('user_id', member.auth_user_id)
          .order('timestamp', { ascending: false })
          .limit(10);

        if (auditError) {
          console.error('Error fetching audit logs:', auditError);
          throw auditError;
        }
        console.log('Found audit logs:', auditLogs?.length || 0);

        // Fetch payment records
        const { data: payments, error: paymentsError } = await supabase
          .from('payment_requests')
          .select('*')
          .eq('member_number', member.member_number)
          .order('created_at', { ascending: false })
          .limit(5);

        if (paymentsError) {
          console.error('Error fetching payments:', paymentsError);
          throw paymentsError;
        }
        console.log('Found payments:', payments?.length || 0);

        return {
          roles: roles || [],
          auditLogs: auditLogs || [],
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
        toast({
          title: "Error running diagnostics",
          description: error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive",
        });
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
          {(canModify || userRole === 'admin') && (
            <div className="flex items-center space-x-2">
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditProfileOpen(true);
                }} 
                className="bg-dashboard-accent2 hover:bg-dashboard-accent2/80"
              >
                Edit
              </Button>
              {userRole === 'admin' && (
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(true);
                  }} 
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  handlePaymentClick();
                }} 
                className="bg-dashboard-accent3 hover:bg-dashboard-accent3/80"
              >
                Pay
              </Button>
            </div>
          )}
        </div>
      </AccordionTrigger>

      <AccordionContent>
        <div className="space-y-6 py-4">
          {/* Contact Information */}
          <div className="space-y-2">
            <h4 className="text-lg font-medium text-dashboard-accent1">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-dashboard-card p-3 rounded-lg border border-dashboard-cardBorder">
              <p className="text-base text-dashboard-text">Email: <span className="text-white font-medium">{member.email || 'Not provided'}</span></p>
              <p className="text-base text-dashboard-text">Phone: <span className="text-white font-medium">{member.phone || 'Not provided'}</span></p>
              <p className="text-base text-dashboard-text">Date of Birth: <span className="text-white font-medium">{member.date_of_birth ? format(new Date(member.date_of_birth), 'dd/MM/yyyy') : 'Not provided'}</span></p>
              <p className="text-base text-dashboard-text">Gender: <span className="text-white font-medium">{member.gender || 'Not provided'}</span></p>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-2">
            <h4 className="text-lg font-medium text-dashboard-accent2">Address Details</h4>
            <div className="bg-dashboard-card p-3 rounded-lg border border-dashboard-cardBorder">
              <p className="text-base text-dashboard-text">Street: <span className="text-white font-medium">{member.address || 'Not provided'}</span></p>
              <p className="text-base text-dashboard-text">Town: <span className="text-white font-medium">{member.town || 'Not provided'}</span></p>
              <p className="text-base text-dashboard-text">Postcode: <span className="text-white font-medium">{member.postcode || 'Not provided'}</span></p>
            </div>
          </div>

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

          {/* Payment History */}
          <MemberPaymentHistory memberId={member.id} />

          {/* Notes Section */}
          {userRole === 'admin' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-dashboard-accent1">Notes</h4>
                <Button 
                  onClick={() => setIsNoteDialogOpen(true)}
                  className="bg-dashboard-accent1 hover:bg-dashboard-accent1/80"
                >
                  Add Note
                </Button>
              </div>
              <NotesList memberId={member.id} />
            </div>
          )}

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
