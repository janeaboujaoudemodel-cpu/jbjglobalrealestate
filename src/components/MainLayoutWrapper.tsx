import { Outlet } from "react-router-dom";
import AdminBypass from "@/components/AdminBypass";
import MainLayout from "@/components/MainLayout";
import PageNavigation from "@/components/PageNavigation";

const MainLayoutWrapper = () => {
  return (
    <AdminBypass>
      <MainLayout>
        <Outlet />
        <PageNavigation />
      </MainLayout>
    </AdminBypass>
  );
};

export default MainLayoutWrapper;
