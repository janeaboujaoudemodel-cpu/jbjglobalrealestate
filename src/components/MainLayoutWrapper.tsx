import { Outlet } from "react-router-dom";
import AdminBypass from "@/components/AdminBypass";
import MainLayout from "@/components/MainLayout";
import { ActionGateProvider } from "@/contexts/ActionGateContext";
import ActionGateModal from "@/components/ActionGateModal";
import { usePrintMode } from "@/hooks/usePrintMode";
import { useScrollUnlocker } from "@/hooks/useScrollUnlocker";

const MainLayoutWrapper = () => {
  const isPrintMode = usePrintMode();
  useScrollUnlocker();

  if (isPrintMode) {
    // Baseline / print mode: render content only — no header, sidebar, footer, popups, or chrome.
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <main className="w-full max-w-full">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <AdminBypass>
      <ActionGateProvider>
        <MainLayout>
          <Outlet />
        </MainLayout>
        <ActionGateModal />
      </ActionGateProvider>
    </AdminBypass>
  );
};

export default MainLayoutWrapper;
