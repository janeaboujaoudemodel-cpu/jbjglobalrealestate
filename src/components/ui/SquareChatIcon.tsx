import React from "react";

interface SquareChatIconProps {
  className?: string;
  size?: number;
}

/**
 * Square chat/message icon with pointed bottom-left corner.
 * Replaces rounded MessageCircle icons globally for chat features.
 */
export const SquareChatIcon = ({ className = "", size = 24 }: SquareChatIconProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Square message bubble with pointed bottom-left corner */}
      <path
        d="M4 4H20C20.5523 4 21 4.44772 21 5V15C21 15.5523 20.5523 16 20 16H8L4 20V5C4 4.44772 4.44772 4 5 4H4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Optional dots for message indication */}
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="12" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
    </svg>
  );
};

export default SquareChatIcon;
