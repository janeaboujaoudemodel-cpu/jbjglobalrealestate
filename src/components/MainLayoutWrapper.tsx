import { Outlet } from "react-router-dom";
import AdminBypass from "@/components/AdminBypass";
import MainLayout from "@/components/MainLayout";

const MainLayoutWrapper = () => {
  return (
    <AdminBypass>
      <MainLayout>
        <Outlet />
      </MainLayout>
    </AdminBypass>
  );
};

export default MainLayoutWrapper;
