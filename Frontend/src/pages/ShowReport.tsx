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
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!location) {
    toast.error('Please enter a location');
    return;
  }

  setIsLoading(true);
  
  try {
    const response = await fetch(`http://localhost:8000/predict/${encodeURIComponent(location)}`);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.has_data) {
      // No database data available
      toast.error(data.message || 'No data available for this location');
      setShowResults(false);
      return;
    }
    
    // Convert database data to UI format
    const prediction = formatDatabasePrediction(data);
    setPrediction(prediction);
    setShowResults(true);
    toast.success('Real database prediction loaded!');
    
  } catch (error) {
    console.error('Error getting prediction:', error);
    toast.error('Failed to get prediction from database');
    setShowResults(false);
  } finally {
    setIsLoading(false);
  }
};

const formatDatabasePrediction = (dbData: any) => {
  // Map hazard types to risk levels
  const hazardRiskMap: { [key: string]: { level: string, color: string } } = {
    'tsunami': { level: 'Critical Risk', color: 'text-red-600' },
    'storm_surge': { level: 'High Risk', color: 'text-red-600' },
    'coastal_flooding': { level: 'High Risk', color: 'text-red-600' },
    'high_waves': { level: 'Medium Risk', color: 'text-yellow-600' },
    'swell_surge': { level: 'Medium Risk', color: 'text-yellow-600' },
    'rip_current': { level: 'Medium Risk', color: 'text-yellow-600' },
    'no_hazard': { level: 'Low Risk', color: 'text-green-600' },
    'other': { level: 'Unknown Risk', color: 'text-gray-600' }
  };
  
  const hazardInfo = hazardRiskMap[dbData.predicted_hazard_type] || { level: 'Unknown Risk', color: 'text-gray-600' };
  
  return {
    location: dbData.location,
    risk_level: hazardInfo.level,
    confidence: `${(dbData.hazard_confidence * 100).toFixed(1)}% confidence`,
    details: `Database prediction: ${dbData.predicted_hazard_type.replace('_', ' ')} detected in ${dbData.location}. Based on ML analysis of submitted reports.`,
    color: hazardInfo.color,
    hazard_type: dbData.predicted_hazard_type,
    verification_status: dbData.verification_status,
    report_date: new Date(dbData.report_date).toLocaleDateString(),
    total_reports: dbData.total_reports,
    verified_reports: dbData.verified_reports,
    is_database_prediction: true
  };
};





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
                        placeholder="e.g., Mumbai, Chennai, Kolkata, Goa"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="transition-smooth focus:shadow-elegant"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-gradient-noir hover:shadow-noir transition-butterfly"
                      >
                        {isLoading ? 'Analyzing...' : 'Check Status'}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            {showResults && prediction && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Map Section stays the same */}
                
                {/* Prediction Section - Database Only */}
                <Card className="shadow-elegant border-0 bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Database Hazard Prediction</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Real prediction from database for {location}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center p-6 bg-muted/50 rounded-lg">
                      <h3 className={`text-2xl font-bold ${prediction.color}`}>
                        {prediction.risk_level}
                      </h3>
                      <p className="text-muted-foreground mt-2">
                        {prediction.confidence}
                      </p>
                      
                      {/* Database-specific info */}
                      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                        <p>Hazard Type: <span className="font-medium">{prediction.hazard_type}</span></p>
                        <p>Status: <span className={`font-medium ${prediction.verification_status === 'verified' ? 'text-green-600' : 'text-yellow-600'}`}>
                          {prediction.verification_status}
                        </span></p>
                        <p>Report Date: {prediction.report_date}</p>
                        <p>Total Reports: {prediction.total_reports} ({prediction.verified_reports} verified)</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold">Database Analysis</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {prediction.details}
                      </p>
                      
                      {prediction.verification_status === 'verified' && (
                        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                          <p className="text-sm text-green-700">
                            ✅ This prediction is based on a verified report from our database.
                          </p>
                        </div>
                      )}
                      
                      {prediction.verification_status === 'pending' && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                          <p className="text-sm text-yellow-700">
                            ⏳ This prediction is from an unverified report. Use with caution.
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-4 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowResults(false);
                          setPrediction(null);
                        }}
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