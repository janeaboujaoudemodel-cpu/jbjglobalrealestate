import { useEffect, useState } from "react";

import { CommandPalette } from "@/components/ui/command-palette";

/**
 * Global Command Palette controller.
 * Opens when the app dispatches `jj:open-command-palette`.
 */
export const CommandPaletteRoot = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setIsOpen(true);
    window.addEventListener("jj:open-command-palette", onOpen);
    return () => window.removeEventListener("jj:open-command-palette", onOpen);
  }, []);

  return <CommandPalette isOpen={isOpen} onClose={() => setIsOpen(false)} />;
};

export default CommandPaletteRoot;
