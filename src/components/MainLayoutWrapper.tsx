import { Outlet } from "react-router-dom";
import AdminBypass from "@/components/AdminBypass";
import AuthGate from "@/components/AuthGate";
import MainLayout from "@/components/MainLayout";
import PageNavigation from "@/components/PageNavigation";

const MainLayoutWrapper = () => {
  return (
    <AdminBypass>
      <AuthGate>
        <MainLayout>
          <Outlet />
          <PageNavigation />
        </MainLayout>
      </AuthGate>
    </AdminBypass>
  );
};

export default MainLayoutWrapper;
