import { Member } from "@/types/member";

interface AddressSectionProps {
  member: Member;
}

export const AddressSection = ({ member }: AddressSectionProps) => {
  return (
    <div className="space-y-2">
      <h4 className="text-lg font-medium text-dashboard-accent2">Address Details</h4>
      <div className="bg-dashboard-card p-3 rounded-lg border border-dashboard-cardBorder">
        <p className="text-base text-dashboard-text">Street: <span className="text-white font-medium">{member.address || 'Not provided'}</span></p>
        <p className="text-base text-dashboard-text">Town: <span className="text-white font-medium">{member.town || 'Not provided'}</span></p>
        <p className="text-base text-dashboard-text">Postcode: <span className="text-white font-medium">{member.postcode || 'Not provided'}</span></p>
      </div>
    </div>
  );
};