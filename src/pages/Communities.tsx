import NavigationTabs from "@/components/NavigationTabs";
import CommunityGrid from "@/components/CommunityGrid";

const Communities = () => {
  return (
    <section
      className="relative w-full min-h-screen py-16 md:py-24"
      style={{
        background: "linear-gradient(180deg, #0a0a0a 0%, #0d0d0d 50%, #080808 100%)",
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[40%] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(212, 160, 23, 0.08) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 container mx-auto px-4">
        <h1
          className="text-white font-bold mb-4"
          style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: "clamp(32px, 5vw, 64px)",
            lineHeight: "1.1",
          }}
        >
          UAE Communities
        </h1>
        <p className="text-gray-400 text-lg mb-10 max-w-2xl" style={{ fontFamily: "Poppins, sans-serif" }}>
          Explore Dubai's most prestigious communities and find your perfect home
        </p>

        <NavigationTabs />
        <CommunityGrid />
      </div>
    </section>
  );
};

export default Communities;
