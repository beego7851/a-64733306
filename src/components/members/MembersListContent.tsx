import { Member } from "@/types/member";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion } from "@/components/ui/accordion";
import MemberCard from './MemberCard';
import PaginationControls from '../ui/pagination/PaginationControls';
import { Loader2 } from "lucide-react";
import { useRoleAccess } from "@/hooks/useRoleAccess";

interface MembersListContentProps {
  members: Member[];
  isLoading: boolean;
  userRole: string | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEditClick: (memberId: string) => void;
  onDeleteClick: (memberId: string) => void;
}

const MembersListContent = ({
  members,
  isLoading,
  userRole,
  currentPage,
  totalPages,
  onPageChange,
  onEditClick,
  onDeleteClick,
}: MembersListContentProps) => {
  const { userRoles } = useRoleAccess();
  
  const rolePermissions = {
    isAdmin: userRoles?.includes('admin') || false,
    isCollector: userRoles?.includes('collector') || false,
    isMember: userRoles?.includes('member') || false,
    hasMultipleRoles: (userRoles?.length || 0) > 1
  };

  return (
    <div className="space-y-4">
      <ScrollArea className="h-[calc(100vh-16rem)] w-full rounded-md">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-dashboard-accent1" />
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-4 px-1">
            {members.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                userRole={userRole}
                onEditClick={() => onEditClick(member.id)}
                onDeleteClick={() => onDeleteClick(member.id)}
                rolePermissions={rolePermissions}
              />
            ))}
          </Accordion>
        )}
      </ScrollArea>
      
      {!isLoading && members.length > 0 && totalPages > 1 && (
        <div className="py-4 overflow-x-auto">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};

export default MembersListContent;