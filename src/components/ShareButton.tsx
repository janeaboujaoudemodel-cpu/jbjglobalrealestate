import { Share2, MessageCircle, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ShareButtonProps {
  projectName: string;
  projectSlug: string;
}

const WHATSAPP_NUMBER = "+97156591100";

const ShareButton = ({ projectName, projectSlug }: ShareButtonProps) => {
  const [copied, setCopied] = useState(false);
  
  const projectUrl = `${window.location.origin}/project/${projectSlug}`;
  const whatsappMessage = encodeURIComponent(
    `Hi, I would like to inquire about ${projectName}. ${projectUrl}`
  );
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(projectUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
        <DropdownMenuItem
          onClick={() => window.open(whatsappUrl, "_blank")}
          className="text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
          Share via WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleCopyLink}
          className="text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer"
        >
          {copied ? (
            <Check className="w-4 h-4 mr-2 text-green-500" />
          ) : (
            <Copy className="w-4 h-4 mr-2" />
          )}
          Copy Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShareButton;
