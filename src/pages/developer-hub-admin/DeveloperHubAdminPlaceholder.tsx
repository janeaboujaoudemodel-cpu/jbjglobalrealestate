import { Card } from "@/components/ui/card";

/**
 * Lightweight wrappers — these tabs embed existing admin components so the
 * Developer Hub becomes the single owner control surface. Existing
 * /admin/developers/* URLs still redirect here.
 */
export default function DeveloperHubAdminPlaceholder({
  title,
  body,
}: { title: string; body: string }) {
  return (
    <Card className="p-6 bg-[#F7F2EA] border border-[#B89555]/30">
      <h2 className="text-lg font-semibold text-[#1A1A1A]">{title}</h2>
      <p className="text-sm text-[#1A1A1A]/75 mt-2">{body}</p>
    </Card>
  );
}
