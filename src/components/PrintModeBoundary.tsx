import { usePrintMode } from "@/hooks/usePrintMode";

/** Mounts the print-mode detector once globally. Renders nothing. */
const PrintModeBoundary = () => {
  usePrintMode();
  return null;
};

export default PrintModeBoundary;
