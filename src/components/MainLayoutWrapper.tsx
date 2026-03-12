import { Outlet } from "react-router-dom";
import AdminBypass from "@/components/AdminBypass";
import AuthGate from "@/components/AuthGate";
import MainLayout from "@/components/MainLayout";

const MainLayoutWrapper = () => {
  return (
    <AdminBypass>
      <AuthGate>
        <MainLayout>
          <Outlet />
        </MainLayout>
      </AuthGate>
    </AdminBypass>
  );
};

export default MainLayoutWrapper;
