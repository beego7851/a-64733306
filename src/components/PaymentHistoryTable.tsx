import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RolePermissions } from "@/types/roles";
import RoleBasedRenderer from "./RoleBasedRenderer";
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface PaymentHistoryTableProps {
  rolePermissions: RolePermissions;
}

const PaymentHistoryTable = ({ rolePermissions }: PaymentHistoryTableProps) => {
  const { data: payments, isLoading, isError } = useQuery({
    queryKey: ['paymentHistory'],
    queryFn: async () => {
      console.log('Fetching payment history for current user...');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No user logged in');

      const { data: { user } } = await supabase.auth.getUser();
      const memberNumber = user?.user_metadata?.member_number;
      
      if (!memberNumber) {
        console.error('No member number found in user metadata');
        throw new Error('Member number not found');
      }

      // Fetch only active payment records from payment_requests table
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('member_number', memberNumber)
        .neq('status', 'deleted') // Exclude deleted records
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment history:', error);
        throw error;
      }
      
      console.log('Fetched payment records:', data);
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="w-full p-8 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-dashboard-accent1" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-dashboard-error p-4 text-center">
        Error loading payment history
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-dashboard-accent1">Payment History</h3>
      <div className="rounded-lg border border-dashboard-cardBorder bg-dashboard-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-dashboard-accent2">Date</TableHead>
              <TableHead className="text-dashboard-accent2">Payment Type</TableHead>
              <TableHead className="text-dashboard-accent2">Amount</TableHead>
              <TableHead className="text-dashboard-accent2">Status</TableHead>
              <TableHead className="text-dashboard-accent2">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments && payments.length > 0 ? (
              payments.map((payment) => (
                <TableRow key={payment.id} className="hover:bg-dashboard-cardHover">
                  <TableCell className="text-dashboard-text">
                    {format(new Date(payment.created_at), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="text-dashboard-text capitalize">
                    {payment.payment_type}
                  </TableCell>
                  <TableCell className="text-dashboard-accent3">
                    £{payment.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      payment.status === 'completed' 
                        ? 'bg-dashboard-success/20 text-dashboard-success'
                        : payment.status === 'pending'
                        ? 'bg-dashboard-warning/20 text-dashboard-warning'
                        : 'bg-dashboard-error/20 text-dashboard-error'
                    }`}>
                      {payment.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <RoleBasedRenderer allowedRoles={['admin']}>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-dashboard-accent1 hover:text-dashboard-accent1/80"
                      >
                        View Details
                      </Button>
                    </RoleBasedRenderer>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-dashboard-muted py-4">
                  No payment history available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PaymentHistoryTable;