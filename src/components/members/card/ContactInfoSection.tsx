import { Member } from "@/types/member";
import { format } from "date-fns";

interface ContactInfoSectionProps {
  member: Member;
}

export const ContactInfoSection = ({ member }: ContactInfoSectionProps) => {
  return (
    <div className="space-y-2">
      <h4 className="text-lg font-medium text-dashboard-accent1">Contact Information</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-dashboard-card p-3 rounded-lg border border-dashboard-cardBorder">
        <p className="text-base text-dashboard-text">Email: <span className="text-white font-medium">{member.email || 'Not provided'}</span></p>
        <p className="text-base text-dashboard-text">Phone: <span className="text-white font-medium">{member.phone || 'Not provided'}</span></p>
        <p className="text-base text-dashboard-text">Date of Birth: <span className="text-white font-medium">{member.date_of_birth ? format(new Date(member.date_of_birth), 'dd/MM/yyyy') : 'Not provided'}</span></p>
        <p className="text-base text-dashboard-text">Gender: <span className="text-white font-medium">{member.gender || 'Not provided'}</span></p>
      </div>
    </div>
  );
};