import { Link, useLocation } from "react-router-dom";

const NavigationTabs = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const tabs = [
    { path: "/", label: "By Developer" },
    { path: "/communities", label: "By Community" },
  ];

  return (
    <div className="flex items-center gap-2 mb-12">
      {tabs.map((tab) => {
        const isActive = tab.path === "/" 
          ? currentPath === "/" 
          : currentPath.startsWith(tab.path);

        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
              isActive
                ? "bg-[#D4A017] text-black"
                : "bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
            }`}
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
};

export default NavigationTabs;
