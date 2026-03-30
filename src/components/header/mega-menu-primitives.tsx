import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type MegaMenuShellProps = {
  children: React.ReactNode;
  className?: string;
  noScroll?: boolean;
  style?: React.CSSProperties;
};

/**
 * Shared mega-menu shell — monochrome design system
 */
export const MegaMenuShell = React.forwardRef<HTMLDivElement, MegaMenuShellProps>(
  ({ children, className, noScroll = false, style }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "fixed z-[10050] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15),0_10px_25px_-10px_rgba(0,0,0,0.1)] rounded-xl overflow-hidden border border-gray-200",
          className
        )}
        style={{
          top: 'var(--header-height, 128px)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'fit-content',
          maxWidth: 'calc(100vw - 48px)',
          maxHeight: 'calc(100vh - var(--header-height, 128px) - 24px)',
          overflowY: 'auto' as const,
          background: '#FFFFFF',
          ...style,
        }}
      >
        {children}
      </div>
    );
  }
);
MegaMenuShell.displayName = "MegaMenuShell";

type MegaMenuFeaturedCardProps = {
  to: string;
  onClick: () => void;
  image?: string;
  video?: string;
  kicker?: string;
  title: string;
  description?: string;
  cta: string;
  className?: string;
};

export function MegaMenuFeaturedCard({
  to,
  onClick,
  image,
  video,
  kicker,
  title,
  description,
  cta,
  className,
}: MegaMenuFeaturedCardProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = React.useState(false);

  React.useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !video) return;
    
    if (vid.readyState >= 2) {
      setVideoReady(true);
      vid.play().catch(() => {});
      return;
    }
    
    const onLoadedData = () => {
      setVideoReady(true);
      vid.play().catch(() => {});
    };
    vid.addEventListener('loadeddata', onLoadedData, { once: true });
    
    return () => vid.removeEventListener('loadeddata', onLoadedData);
  }, [video]);

  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "block group relative overflow-hidden rounded-xl min-h-[260px] lg:min-h-[340px] transition-all duration-500",
        "shadow-lg hover:shadow-2xl hover:scale-[1.02] transform-gpu",
        className
      )}
    >
      {video && (
        <video
          ref={videoRef}
          className={cn(
            "absolute inset-0 w-full h-full object-cover z-[1] transition-opacity duration-500",
            videoReady ? "opacity-100" : "opacity-0"
          )}
          src={video}
          muted
          loop
          playsInline
          preload="auto"
        />
      )}
      {image && (
        <div
          className={cn(
            "absolute inset-0 bg-cover bg-center transition-all duration-700 group-hover:scale-110",
            video && videoReady ? "opacity-0" : "opacity-100"
          )}
          style={{ backgroundImage: `url(${image})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-[2]" />
      <div className="absolute inset-0 border border-gray-200 rounded-xl group-hover:border-gray-300 transition-colors z-[3]" />
      <div className="absolute bottom-0 left-0 right-0 p-5 z-[4]">
        {kicker ? (
          <p className="text-white/70 text-[10px] font-bold tracking-[0.2em] uppercase mb-1.5">
            {kicker}
          </p>
        ) : null}
        <h3 className="text-white text-lg lg:text-xl font-bold mb-1.5 leading-tight">{title}</h3>
        {description ? (
          <p className="text-white/80 text-xs mb-3 max-w-[48ch] line-clamp-2">{description}</p>
        ) : null}
        <span className="inline-flex items-center gap-1.5 text-white font-semibold text-xs group-hover:gap-2.5 transition-all px-3 py-1.5 border border-white/40 rounded-lg bg-black/30 hover:bg-white hover:text-black">
          {cta}
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  );
}

export function MegaMenuCTAButton({
  to,
  onClick,
  icon: Icon,
  title,
}: {
  to: string;
  onClick: () => void;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center justify-center gap-3 w-full py-4 px-6 rounded-xl bg-white/10 hover:bg-white/20 border-2 border-white/30 hover:border-white/50 hover:-translate-y-0.5 transition-all duration-300 group"
    >
      <div className="w-10 h-10 rounded-lg bg-white border border-white/80 flex items-center justify-center group-hover:shadow-[0_0_12px_rgba(255,255,255,0.3)] transition-all">
        <Icon className="w-5 h-5 text-black" />
      </div>
      <span className="text-white font-bold text-base group-hover:text-white transition-colors">
        {title}
      </span>
      <ArrowRight className="w-5 h-5 text-white/60 ml-auto" />
    </Link>
  );
}

type MegaMenuSectionTitleProps = {
  icon: LucideIcon;
  title: string;
  rightSlot?: React.ReactNode;
};

export const MegaMenuSectionTitle = React.forwardRef<HTMLDivElement, MegaMenuSectionTitleProps>(
  ({ icon: Icon, title, rightSlot }, ref) => {
    return (
      <div ref={ref} className="mb-3 h-[36px] flex flex-col justify-end">
        <div className="flex items-center justify-center pb-2">
          <h4 className="text-white font-bold text-xs tracking-[0.2em] uppercase flex items-center gap-2 whitespace-nowrap">
            <Icon className="w-4 h-4 text-white/60 shrink-0" />
            {title}
          </h4>
          {rightSlot}
        </div>
        <div className="h-[1px] w-full bg-white/20" />
      </div>
    );
  }
);
MegaMenuSectionTitle.displayName = "MegaMenuSectionTitle";

type MegaMenuIconLinkProps = {
  to: string;
  onClick: () => void;
  icon: LucideIcon;
  title: string;
  description?: string;
  compact?: boolean;
  emphasis?: boolean;
};

export function MegaMenuIconLink({
  to,
  onClick,
  icon: Icon,
  title,
  description,
  compact = false,
  emphasis = false,
}: MegaMenuIconLinkProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl transition-all duration-300 group relative",
        emphasis
          ? "bg-white/10 hover:bg-white/20 border-2 border-white/30 hover:border-white/50 hover:-translate-y-0.5"
          : "bg-transparent hover:bg-white/5",
        emphasis ? "py-3 px-4" : compact ? "py-1.5 px-2" : "py-3 px-3"
      )}
    >
      <div
        className={cn(
          "rounded-lg border transition-all duration-300 flex items-center justify-center shrink-0",
          emphasis
            ? "bg-white border-white/80 group-hover:shadow-[0_0_12px_rgba(255,255,255,0.3)] w-10 h-10"
            : "bg-transparent border-white/30 group-hover:border-white/50",
          !emphasis && compact ? "w-7 h-7" : !emphasis ? "w-10 h-10" : ""
        )}
      >
        <Icon className={cn(
          "transition-colors duration-300",
          emphasis
            ? "text-black w-5 h-5"
            : "text-white/60 group-hover:text-white",
          !emphasis && compact ? "w-3.5 h-3.5" : !emphasis ? "w-5 h-5" : ""
        )} />
      </div>
      <div className="min-w-0 flex-1">
        <span className={cn(
          "block font-bold transition-colors duration-300",
          emphasis
            ? "text-white group-hover:text-white text-base"
            : "text-white/80 group-hover:text-white",
          !emphasis && compact ? "text-[13px]" : !emphasis ? "text-sm" : ""
        )}>
          {title}
        </span>
        {description ? (
          <span className="block text-xs text-white/40 group-hover:text-white/60 truncate transition-colors">
            {description}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

export function MegaMenuSectionDivider() {
  return (
    <div className="my-4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
  );
}

type MegaMenuCardProps = {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
};

export function MegaMenuCard({
  icon,
  title,
  children,
  className,
  compact = false,
}: MegaMenuCardProps) {
  return (
    <div className={cn(
      "bg-[#111111]",
      "rounded-xl border border-white/10 shadow-sm",
      "transition-all",
      compact ? "p-2.5" : "p-4",
      className
    )}>
      <MegaMenuSectionTitle icon={icon} title={title} />
      <div className="space-y-0">
        {children}
      </div>
    </div>
  );
}

type MegaMenuSectionProps = {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function MegaMenuSection({
  icon,
  title,
  children,
  className,
}: MegaMenuSectionProps) {
  return (
    <div className={cn("p-2.5", className)}>
      <MegaMenuSectionTitle icon={icon} title={title} />
      <div className="space-y-0">
        {children}
      </div>
    </div>
  );
}
