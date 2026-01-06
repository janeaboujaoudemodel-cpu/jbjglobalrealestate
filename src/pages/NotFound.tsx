import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-black">
      <div className="text-center px-4">
        <h1 className="mb-4 text-6xl md:text-8xl font-bold text-gold" style={{ fontFamily: "Poppins, sans-serif" }}>
          404
        </h1>
        <p className="mb-6 text-xl md:text-2xl text-white">Page Not Found</p>
        <p className="mb-8 text-zinc-400 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/">
            <Button className="bg-gold hover:bg-gold-light text-black font-semibold px-6 py-5">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="border-zinc-700 text-white hover:bg-zinc-800 px-6 py-5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
