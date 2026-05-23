import { Skeleton } from "@/components/ui/skeleton";

interface SidebarSkeletonProps {
  /** Number of rows to render. Default 8. */
  rows?: number;
  /** Show a header block at the top. Default true. */
  showHeader?: boolean;
}

/**
 * Champagne placeholder for any vertical sidebar / nav list while its
 * data-driven entries are still loading. Keeps the sidebar from rendering
 * empty on slow connections.
 */
export function SidebarSkeleton({ rows = 8, showHeader = true }: SidebarSkeletonProps) {
  return (
    <div className="w-full p-3 space-y-2">
      {showHeader && (
        <div className="mb-4 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      )}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-2 py-2 rounded-lg"
        >
          <Skeleton className="h-5 w-5 rounded-md flex-shrink-0" />
          <Skeleton
            className="h-3.5"
            style={{ width: `${55 + ((i * 13) % 35)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export default SidebarSkeleton;
