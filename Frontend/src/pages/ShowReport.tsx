import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MapComponent from "@/components/MapComponent";
import { toast } from "sonner";

const ShowReport = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [showResults, setShowResults] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location) {
      toast.error('Please enter a location');
      return;
    }

    setShowResults(true);
    toast.success('Analyzing location for hazards...');
  };

  const getModelPrediction = () => {
    // Simulate AI model prediction
    const predictions = [
      { 
        risk: 'Low Risk', 
        confidence: '85%', 
        details: 'No immediate coastal hazards detected in this area. Weather conditions are stable.',
        color: 'text-green-600'
      },
      { 
        risk: 'Medium Risk', 
        confidence: '72%', 
        details: 'Elevated wave activity detected. Monitor conditions closely.',
        color: 'text-yellow-600'
      },
      { 
        risk: 'High Risk', 
        confidence: '91%', 
        details: 'Severe storm surge warning. Immediate evacuation recommended.',
        color: 'text-red-600'
      }
    ];
    
    return predictions[Math.floor(Math.random() * predictions.length)];
  };

  const prediction = showResults ? getModelPrediction() : null;

  return (
    <div className="min-h-screen bg-gradient-smoke">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <Card className="shadow-noir border-0 bg-card/80 backdrop-blur-sm mb-8">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold">Check Hazard Status</CardTitle>
                <p className="text-muted-foreground">
                  Enter a location to check for coastal hazards and risks
                </p>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        type="text"
                        placeholder="e.g., New York, London, Tokyo, Sydney, Mumbai"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="transition-smooth focus:shadow-elegant"
                        required
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="submit"
                        className="bg-gradient-noir hover:shadow-noir transition-butterfly"
                      >
                        Check Status
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            {showResults && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Map Section */}
                <Card className="shadow-elegant border-0 bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Location Map</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Real-time view of {location}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <MapComponent location={location} />
                  </CardContent>
                </Card>

                {/* Prediction Section */}
                <Card className="shadow-elegant border-0 bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>AI Hazard Prediction</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Model analysis for {location}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {prediction && (
                      <>
                        <div className="text-center p-6 bg-muted/50 rounded-lg">
                          <h3 className={`text-2xl font-bold ${prediction.color}`}>
                            {prediction.risk}
                          </h3>
                          <p className="text-muted-foreground mt-2">
                            Confidence: {prediction.confidence}
                          </p>
                        </div>
                        
                        <div className="space-y-4">
                          <h4 className="font-semibold">Analysis Details</h4>
                          <p className="text-muted-foreground leading-relaxed">
                            {prediction.details}
                          </p>
                          
                          <div className="bg-muted/30 p-4 rounded-lg">
                            <h5 className="font-medium mb-2">Recommendations</h5>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              <li>• Monitor local weather services</li>
                              <li>• Stay informed through official channels</li>
                              <li>• Have evacuation plan ready</li>
                              <li>• Report any unusual coastal activity</li>
                            </ul>
                          </div>
                        </div>
                      </>
                    )}
                    
                    <div className="flex gap-4 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowResults(false)}
                        className="flex-1 transition-butterfly"
                      >
                        New Search
                      </Button>
                      <Button
                        onClick={() => navigate('/submit-report')}
                        className="flex-1 bg-gradient-noir hover:shadow-noir transition-butterfly"
                      >
                        Report Hazard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {!showResults && (
              <div className="text-center mt-12">
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="transition-butterfly"
                >
                  Back to Home
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ShowReport;