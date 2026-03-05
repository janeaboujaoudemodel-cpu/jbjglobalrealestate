import React from "react";

interface SquareChatIconProps {
  className?: string;
  size?: number;
}

/**
 * Rounded chat icon used consistently across collapsed/open chat UI.
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
      <path
        d="M12 3.5C7.30558 3.5 3.5 6.85786 3.5 11C3.5 13.1879 4.56443 15.1586 6.25 16.5429V20.25L9.78125 18.3049C10.4837 18.4415 11.2258 18.5 12 18.5C16.6944 18.5 20.5 15.1421 20.5 11C20.5 6.85786 16.6944 3.5 12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default SquareChatIcon;
