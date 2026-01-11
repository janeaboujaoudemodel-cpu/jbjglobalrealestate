import { useEffect } from 'react';

/**
 * SecurityShield - Anti-inspection and content protection component
 * Provides multiple layers of protection against code inspection and copying
 * 
 * IMPORTANT: This is client-side protection only. True security comes from
 * proper backend authentication, RLS policies, and encrypted data transmission.
 */
const SecurityShield = () => {
  useEffect(() => {
    // Disable right-click context menu (except on inputs)
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Allow right-click on form inputs
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return true;
      }
      e.preventDefault();
      return false;
    };

    // Disable keyboard shortcuts for dev tools
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u')) ||
        // Mac equivalents
        (e.metaKey && e.altKey && (e.key === 'I' || e.key === 'i')) ||
        (e.metaKey && e.altKey && (e.key === 'J' || e.key === 'j')) ||
        (e.metaKey && (e.key === 'U' || e.key === 'u'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Disable text selection on sensitive elements
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      // Allow selection in form inputs
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('[data-allow-select]')
      ) {
        return true;
      }
      // Prevent selection on everything else
      e.preventDefault();
      return false;
    };

    // Disable drag and drop of images
    const handleDragStart = (e: DragEvent) => {
      if ((e.target as HTMLElement).tagName === 'IMG') {
        e.preventDefault();
        return false;
      }
    };

    // Detect DevTools opening (basic detection)
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        // DevTools might be open - clear console for privacy
        console.clear();
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('dragstart', handleDragStart);
    window.addEventListener('resize', detectDevTools);

    // Initial detection
    detectDevTools();

    // Add CSS to prevent selection globally (with exceptions for form inputs)
    const style = document.createElement('style');
    style.id = 'security-shield-styles';
    style.textContent = `
      body {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      
      input, textarea, [contenteditable="true"], [data-allow-select], [data-allow-select] * {
        -webkit-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
        user-select: text;
      }
      
      img {
        -webkit-user-drag: none;
        -khtml-user-drag: none;
        -moz-user-drag: none;
        -o-user-drag: none;
        user-drag: none;
      }
      
      /* Re-enable pointer events for interactive images */
      a img, button img, [role="button"] img, .interactive-img {
        pointer-events: auto;
      }
    `;
    document.head.appendChild(style);

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('resize', detectDevTools);
      
      const styleElement = document.getElementById('security-shield-styles');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  return null;
};

export default SecurityShield;
