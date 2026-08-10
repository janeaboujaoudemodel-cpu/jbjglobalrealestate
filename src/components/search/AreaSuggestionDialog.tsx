/**
 * AreaSuggestionDialog — "We couldn't find X, did you mean Y?"
 *
 * Shown when the visitor's phrase only fuzzy-matches a real area
 * ("Dubai Square Marina" → "Dubai Marina"). Confirming teaches the system the
 * alias, so the next visitor who types the same phrase is routed instantly.
 */

import { MapPin, Search } from "lucide-react";
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

interface Props {
  open: boolean;
  typed: string;
  suggestionName: string;
  onConfirm: () => void;
  onReject: () => void;
}

export default function AreaSuggestionDialog({
  open,
  typed,
  suggestionName,
  onConfirm,
  onReject,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onReject()}>
      <AlertDialogContent data-surface="light" className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" aria-hidden />
            Did you mean {suggestionName}?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              We could not find <strong>“{typed}”</strong> in our catalogue.
            </span>
            <span className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-foreground">
              <MapPin className="h-4 w-4 text-primary" aria-hidden />
              <strong>{suggestionName}</strong>
            </span>
            <span className="block">
              Please confirm this is what you were searching for — we will remember it for next time.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onReject}>No, something else</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Yes, show {suggestionName}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
