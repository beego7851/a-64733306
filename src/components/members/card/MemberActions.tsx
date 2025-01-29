import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface MemberActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  onPayment: () => void;
  canModify: boolean;
  isAdmin: boolean;
}

export const MemberActions = ({ onEdit, onDelete, onPayment, canModify, isAdmin }: MemberActionsProps) => {
  return (
    <div className="flex items-center space-x-2">
      {(canModify || isAdmin) && (
        <>
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }} 
            className="bg-dashboard-accent2 hover:bg-dashboard-accent2/80"
          >
            Edit
          </Button>
          {isAdmin && (
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
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
              onPayment();
            }} 
            className="bg-dashboard-accent3 hover:bg-dashboard-accent3/80"
          >
            Pay
          </Button>
        </>
      )}
    </div>
  );
};