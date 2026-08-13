import "@/styles/chat-premium-aurora.css";

/**
 * PASS 345 — Premium animated background for the AI support chat.
 * Champagne aurora orbs + neural mesh + slow sheen. Purely decorative.
 */
const ChatAuroraBackground = () => (
  <div className="jbj-chat-aurora" aria-hidden="true">
    <div className="jbj-chat-aurora__mesh" />
    <div className="jbj-chat-aurora__orb jbj-chat-aurora__orb--a" />
    <div className="jbj-chat-aurora__orb jbj-chat-aurora__orb--b" />
    <div className="jbj-chat-aurora__orb jbj-chat-aurora__orb--c" />
    <div className="jbj-chat-aurora__sheen" />
  </div>
);

export default ChatAuroraBackground;
