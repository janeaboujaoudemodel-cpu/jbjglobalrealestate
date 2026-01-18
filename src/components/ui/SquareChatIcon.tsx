import React from "react";

interface SquareChatIconProps {
  className?: string;
  size?: number;
}

/**
 * Premium rounded-square chat icon with curved borders.
 * Global standard for all chat features - ultra luxury style.
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
      {/* Rounded square message bubble with curved borders and pointed bottom-left */}
      <path
        d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V14C20 15.1046 19.1046 16 18 16H8.5L5.5 19.5C4.94772 20.1 4 19.7 4 18.9V6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Premium dots for message indication */}
      <circle cx="9" cy="10" r="1.2" fill="currentColor" />
      <circle cx="12" cy="10" r="1.2" fill="currentColor" />
      <circle cx="15" cy="10" r="1.2" fill="currentColor" />
    </svg>
  );
};

export default SquareChatIcon;
