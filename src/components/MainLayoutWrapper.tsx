import { Outlet } from "react-router-dom";
import AdminBypass from "@/components/AdminBypass";
import MainLayout from "@/components/MainLayout";
import { ActionGateProvider } from "@/contexts/ActionGateContext";
import ActionGateModal from "@/components/ActionGateModal";

const MainLayoutWrapper = () => {
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
