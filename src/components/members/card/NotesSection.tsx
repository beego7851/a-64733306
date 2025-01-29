import { Button } from "@/components/ui/button";
import NotesList from "../notes/NotesList";

interface NotesSectionProps {
  memberId: string;
  onAddNote: () => void;
}

export const NotesSection = ({ memberId, onAddNote }: NotesSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-dashboard-accent1">Notes</h4>
        <Button 
          onClick={onAddNote}
          className="bg-dashboard-accent1 hover:bg-dashboard-accent1/80"
        >
          Add Note
        </Button>
      </div>
      <NotesList memberId={memberId} />
    </div>
  );
};