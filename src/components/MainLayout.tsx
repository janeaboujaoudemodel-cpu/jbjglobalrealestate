import GlobalHeader from "@/components/GlobalHeader";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-black">
      <GlobalHeader />
      {/* Add padding-top to account for fixed header */}
      <main className="pt-16 lg:pt-18">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
