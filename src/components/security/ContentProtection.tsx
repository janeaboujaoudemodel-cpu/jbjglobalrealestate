import { useEffect, useCallback } from 'react';

/**
 * ContentProtection - Enhanced content protection measures
 * Adds invisible watermarks, tracking, and anti-extraction to protected content
 */
export function ContentProtection() {
  const isDevMode = useCallback(() => {
    const hostname = window.location.hostname;
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.includes('lovable.app') ||
      hostname.includes('lovable.dev') ||
      import.meta.env.DEV
    );
  }, []);

  useEffect(() => {
    // Add invisible watermark and protection to images
    const addWatermark = () => {
      const images = document.querySelectorAll('img:not([data-protected])');
      images.forEach((img) => {
        img.setAttribute('data-protected', 'jbj-global');
        img.setAttribute('data-owner', 'JBJ Global Real Estate');
        img.setAttribute('data-copyright', '© 2024 JBJ Global Real Estate LLC');
        img.setAttribute('data-license', 'All Rights Reserved');
        img.setAttribute('data-timestamp', new Date().toISOString());
        img.setAttribute('data-hash', btoa(Math.random().toString()).slice(0, 12));

        // Add CSS protection to images
        const imgElement = img as HTMLImageElement;
        imgElement.style.pointerEvents = 'none';
        imgElement.draggable = false;

        // Wrap image in protective container if not already wrapped
        if (!img.parentElement?.classList.contains('jbj-img-shield')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'jbj-img-shield';
          wrapper.style.cssText = 'position:relative;display:inline-block;';
          
          // Add invisible overlay
          const overlay = document.createElement('div');
          overlay.style.cssText = 'position:absolute;inset:0;z-index:10;background:transparent;';
          overlay.setAttribute('data-protection', 'active');
          
          img.parentNode?.insertBefore(wrapper, img);
          wrapper.appendChild(img);
          wrapper.appendChild(overlay);
        }
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

    // Prevent print screen
    const preventPrintScreen = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText('© JBJ Global Real Estate - Copying Prohibited');
        if (!isDevMode()) {
          document.body.style.visibility = 'hidden';
          setTimeout(() => {
            document.body.style.visibility = 'visible';
          }, 200);
        }
      }
    };

    // Prevent image context menu (right-click on images)
    const preventImageContextMenu = (e: MouseEvent) => {
      if (e.target instanceof HTMLImageElement) {
        e.preventDefault();
        return false;
      }
    };

    // Prevent saving images via keyboard
    const preventSaveShortcuts = (e: KeyboardEvent) => {
      // Ctrl+Shift+S (Save As)
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        return false;
      }
    };

    // Anti-iframe protection: prevent embedding/mirroring
    if (window.self !== window.top && !isDevMode()) {
      try {
        window.top!.location.href = window.self.location.href;
      } catch {
        document.body.innerHTML = '<h1 style="text-align:center;padding:4rem;">© JBJ Global Real Estate — Embedding Prohibited</h1>';
      }
    }

    // Inject copyright watermark comments into HTML
    const copyrightComment = document.createComment(
      ' © 2024-2026 JBJ Global Real Estate LLC. All rights reserved. Unauthorized reproduction, scraping, or replication is prohibited under UAE Federal Law No. 38 of 2021. '
    );
    document.body.prepend(copyrightComment);

    // Add ownership meta tags
    const ownerMeta = document.createElement('meta');
    ownerMeta.name = 'author';
    ownerMeta.content = 'JBJ Global Real Estate LLC';
    document.head.appendChild(ownerMeta);

    const copyrightMeta = document.createElement('meta');
    copyrightMeta.name = 'copyright';
    copyrightMeta.content = '© 2024-2026 JBJ Global Real Estate LLC. All Rights Reserved.';
    document.head.appendChild(copyrightMeta);

    // Add global CSS protection
    const style = document.createElement('style');
    style.id = 'jbj-content-protection';
    style.textContent = `
      /* Image protection */
      img {
        -webkit-user-drag: none;
        -khtml-user-drag: none;
        -moz-user-drag: none;
        -o-user-drag: none;
        user-drag: none;
        pointer-events: none;
      }
      
      .jbj-img-shield {
        -webkit-touch-callout: none;
      }
      
      /* Prevent image saving on mobile */
      img {
        -webkit-touch-callout: none;
      }
      
      /* Add subtle watermark overlay */
      .jbj-img-shield::after {
        content: '';
        position: absolute;
        bottom: 0;
        right: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, transparent 90%, rgba(0,0,0,0.02) 100%);
        pointer-events: none;
      }
      
      /* Blur on attempted screenshot (CSS heuristic) */
      @media print {
        body * {
          visibility: hidden !important;
        }
        body::after {
          content: '© JBJ Global Real Estate - Printing Prohibited';
          visibility: visible;
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 24px;
          color: #000;
        }
      }
    `;
    document.head.appendChild(style);

    document.addEventListener('dragstart', preventDrag);
    document.addEventListener('keyup', preventPrintScreen);
    document.addEventListener('keydown', preventSaveShortcuts);
    document.addEventListener('contextmenu', preventImageContextMenu);

    return () => {
      observer.disconnect();
      document.removeEventListener('dragstart', preventDrag);
      document.removeEventListener('keyup', preventPrintScreen);
      document.removeEventListener('keydown', preventSaveShortcuts);
      document.removeEventListener('contextmenu', preventImageContextMenu);
      document.getElementById('jbj-content-protection')?.remove();
    };
  }, [isDevMode]);

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
      onDragStart={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
}

export default ContentProtection;
