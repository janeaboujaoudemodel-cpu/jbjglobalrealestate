import { useEffect } from 'react';

/**
 * ContentProtection - Passive content protection measures
 * Adds invisible watermarks and tracking to protected content
 */
export function ContentProtection() {
  useEffect(() => {
    // Add invisible watermark to images
    const addWatermark = () => {
      const images = document.querySelectorAll('img:not([data-protected])');
      images.forEach((img) => {
        img.setAttribute('data-protected', 'jbj-global');
        img.setAttribute('data-owner', 'JBJ Global Real Estate');
        img.setAttribute('data-timestamp', new Date().toISOString());
      });
    };

    // Observe DOM for new images
    const observer = new MutationObserver(addWatermark);
    observer.observe(document.body, { childList: true, subtree: true });
    addWatermark();

    // Prevent drag and drop of images
    const preventDrag = (e: DragEvent) => {
      if (e.target instanceof HTMLImageElement) {
        e.preventDefault();
        return false;
      }
    };

    // Prevent print screen (partial effectiveness)
    const preventPrintScreen = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText('');
      }
    };

    document.addEventListener('dragstart', preventDrag);
    document.addEventListener('keyup', preventPrintScreen);

    return () => {
      observer.disconnect();
      document.removeEventListener('dragstart', preventDrag);
      document.removeEventListener('keyup', preventPrintScreen);
    };
  }, []);

  return null;
}

/**
 * ProtectedContent - Wrapper for content that needs extra protection
 */
export function ProtectedContent({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div 
      className={`protected-content ${className}`}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
      }}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
}

export default ContentProtection;
