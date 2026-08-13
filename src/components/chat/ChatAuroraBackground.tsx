import "@/styles/chat-premium-aurora.css";

interface ChatAuroraBackgroundProps {
  /** Stacking depth. Use -1 to sit behind static content, 0 inside a z-layered panel. */
  depth?: number;
}

/**
 * PASS 345 — Premium animated background for the AI support chat.
 * Champagne aurora orbs + neural mesh + slow sheen. Purely decorative.
 */
const ChatAuroraBackground = ({ depth = 0 }: ChatAuroraBackgroundProps) => (
  <div className="jbj-chat-aurora" style={{ zIndex: depth }} aria-hidden="true">
    <div className="jbj-chat-aurora__mesh" />
    <div className="jbj-chat-aurora__orb jbj-chat-aurora__orb--a" />
    <div className="jbj-chat-aurora__orb jbj-chat-aurora__orb--b" />
    <div className="jbj-chat-aurora__orb jbj-chat-aurora__orb--c" />
    <div className="jbj-chat-aurora__sheen" />
  </div>
);

export default ChatAuroraBackground;
