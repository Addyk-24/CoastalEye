import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MapComponent from "@/components/MapComponent";

interface ReportData {
  name: string;
  email: string;
  location: string;
  description: string;
  reason: string;
  urgency: string;
}

const ReportResults = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => {
    const storedData = sessionStorage.getItem('reportData');
    if (storedData) {
      setReportData(JSON.parse(storedData));
    } else {
      // Redirect back if no report data
      navigate('/submit-report');
    }
  }, [navigate]);

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'immediate':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Immediate Danger</Badge>;
      case 'close':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Close Threat</Badge>;
      case 'future':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Future Threat</Badge>;
      default:
        return <Badge variant="secondary">{urgency}</Badge>;
    }
  };

  const getModelPrediction = () => {
    if (!reportData) return null;
    
    // Simulate AI model validation
    const predictions = [
      { 
        isValid: true, 
        confidence: '94%', 
        reasoning: 'Report details match known hazard patterns for this coastal region. Weather data confirms potential threat.',
        recommendation: 'Report has been flagged for immediate review by coastal authorities.'
      },
      { 
        isValid: true, 
        confidence: '78%', 
        reasoning: 'Partial match with historical data. Some indicators suggest credible threat.',
        recommendation: 'Report requires additional verification before action.'
      },
      { 
        isValid: false, 
        confidence: '65%', 
        reasoning: 'Report details do not align with current environmental conditions.',
        recommendation: 'Report marked for further investigation and cross-verification.'
      }
    ];
    
    return predictions[Math.floor(Math.random() * predictions.length)];
  };

  const prediction = reportData ? getModelPrediction() : null;

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gradient-smoke flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading Report...</h2>
          <p className="text-muted-foreground">Please wait while we process your report.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-smoke">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">Report Submitted Successfully</h1>
              <p className="text-xl text-muted-foreground">
                Thank you for helping keep communities safe
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Map Section */}
              <Card className="shadow-noir border-0 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Report Location</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Hazard reported at {reportData.location}
                  </p>
                </CardHeader>
                <CardContent>
                  <MapComponent location={reportData.location} />
                </CardContent>
              </Card>

              {/* Report Details & Prediction */}
              <div className="space-y-6">
                {/* Report Summary */}
                <Card className="shadow-elegant border-0 bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Report Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Reporter</p>
                        <p className="font-medium">{reportData.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Location</p>
                        <p className="font-medium">{reportData.location}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Urgency Level</p>
                      {getUrgencyBadge(reportData.urgency)}
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                      <p className="text-sm leading-relaxed bg-muted/50 p-3 rounded">
                        {reportData.description}
                      </p>
                    </div>
                    
                    {reportData.reason && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Reason</p>
                        <p className="text-sm leading-relaxed bg-muted/50 p-3 rounded">
                          {reportData.reason}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* AI Model Prediction */}
                <Card className="shadow-elegant border-0 bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>AI Validation Results</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Automated analysis of report credibility
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {prediction && (
                      <>
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <h3 className={`text-xl font-bold ${prediction.isValid ? 'text-green-600' : 'text-yellow-600'}`}>
                            {prediction.isValid ? 'Report Validated' : 'Requires Verification'}
                          </h3>
                          <p className="text-muted-foreground mt-1">
                            Confidence: {prediction.confidence}
                          </p>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium mb-2">Analysis</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {prediction.reasoning}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Next Steps</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {prediction.recommendation}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="text-center mt-12 space-y-4">
              <p className="text-muted-foreground">
                Your report has been recorded and will be reviewed by our monitoring team.
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={() => navigate('/submit-report')}
                  className="transition-butterfly"
                >
                  Submit Another Report
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  className="bg-gradient-noir hover:shadow-noir transition-butterfly"
                >
                  Back to Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ReportResults;