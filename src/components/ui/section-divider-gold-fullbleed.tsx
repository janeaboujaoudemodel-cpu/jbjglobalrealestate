/** Thin premium gold divider between sections. */
interface Props {
  size?: "sm" | "md" | "lg";
  spacing?: "sm" | "md" | "lg";
  className?: string;
}

export function SectionDividerGoldFullBleed({
  size = "md",
  className = "",
}: Props) {
  const height = size === "sm" ? "h-px" : size === "lg" ? "h-[2px]" : "h-px";
  return (
    <div
      aria-hidden="true"
      role="presentation"
      className={`w-full my-0 ${className}`}
    >
      <div className={`${height} w-full bg-gradient-to-r from-transparent via-[#B89555] to-transparent shadow-[0_0_10px_rgba(184,149,85,0.28)]`} />
    </div>
  );
}

export default SectionDividerGoldFullBleed;
