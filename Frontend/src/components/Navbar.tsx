import { Button } from "@/components/ui/button";
import coastalEyeLogo from "@/assets/Mian_hack_logo.png";

const Navbar = () => {
  return (
    <nav className="w-full border-b border-border bg-background/80 backdrop-blur-sm fixed top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <img 
              src={coastalEyeLogo} 
              alt="CoastalEye Logo" 
              className="h-10 w-auto object-contain rounded-full border-2 border-border shadow-lg hover:shadow-noir transition-butterfly p-1 bg-gradient-noir bg-clip-text text-transparent hover:bg-gradient-ghost hover:bg-clip-text hover:text-transparent hover:p-0 cursor-pointer hover:shadow-blue-600"
            />
            <h1 className="text-2xl font-bold tracking-tight">CoastalEye</h1>
          </div>
          
          {/* Login Button */}
          <Button 
            variant="outline" 
            className="transition-butterfly hover:shadow-elegant "
          >
            Login
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;