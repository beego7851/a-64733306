import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link, Send, Copy, Check } from "lucide-react";

interface MagicLinkButtonProps {
  memberNumber: string;
  memberName: string;
}

const MagicLinkButton = ({ memberNumber, memberName }: MagicLinkButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const { toast } = useToast();

  const generateMagicLink = async () => {
    try {
      setIsGenerating(true);
      console.log('[MagicLink] Generating token for:', memberNumber);

      const { data: token, error } = await supabase
        .rpc('generate_magic_link_token', { 
          p_member_number: memberNumber 
        });

      if (error) throw error;

      const link = `${window.location.origin}/reset-password?token=${token}`;
      setMagicLink(link);
      
      toast({
        title: "Magic Link Generated",
        description: "The password reset link has been generated. Click copy to share it.",
      });

    } catch (error: any) {
      console.error('[MagicLink] Error:', error);
      toast({
        title: "Error Generating Link",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!magicLink) return;

    try {
      await navigator.clipboard.writeText(magicLink);
      setIsCopied(true);
      toast({
        title: "Link Copied",
        description: "Password reset link has been copied to clipboard",
      });
      
      // Reset copy status after 3 seconds
      setTimeout(() => setIsCopied(false), 3000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-2">
      {!magicLink ? (
        <Button
          onClick={generateMagicLink}
          disabled={isGenerating}
          variant="outline"
          className="w-full flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <Send className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Link className="h-4 w-4" />
              Generate Magic Link
            </>
          )}
        </Button>
      ) : (
        <Button
          onClick={copyToClipboard}
          variant="outline"
          className="w-full flex items-center gap-2"
        >
          {isCopied ? (
            <>
              <Check className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy Reset Link
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default MagicLinkButton;