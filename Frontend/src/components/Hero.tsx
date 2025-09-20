import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen bg-gradient-smoke flex items-center justify-center pt-20">
      <div className="container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-7xl font-bold mb-8 bg-gradient-noir bg-clip-text text-transparent leading-tight">
            CoastalEye
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Real-time coastal hazard monitoring and reporting system. 
            Help keep communities safe by reporting disasters or checking hazard status.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button 
              size="lg"
              onClick={() => navigate('/submit-report')}
              className="bg-gradient-noir hover:shadow-noir transition-butterfly text-lg px-8 py-6 h-auto min-w-[200px]"
            >
              Submit Report
            </Button>
            
            <Button 
              variant="outline"
              size="lg"
              onClick={() => navigate('/show-report')}
              className="transition-butterfly hover:shadow-elegant text-lg px-8 py-6 h-auto min-w-[200px] border-2"
            >
              Show Report
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;