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
  email?: string;
  location: string;
  description: string;
  reason?: string;
  urgency?: string;
  apiResponse?: {
    status: string;
    report_id: string;
    prediction: {
      hazard_type: string;
      confidence: number;
      all_probabilities: Record<string, number>;
    };
  };
}

const ReportResults = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => {
    const storedData = sessionStorage.getItem('reportData');
    if (storedData) {
      setReportData(JSON.parse(storedData));
    } else {
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

  const getHazardTypeDisplayName = (hazardType: string) => {
    const displayNames: Record<string, string> = {
      'tsunami': 'Tsunami',
      'storm_surge': 'Storm Surge',
      'high_waves': 'High Waves',
      'coastal_flooding': 'Coastal Flooding',
      'swell_surge': 'Swell Surge',
      'rip_current': 'Rip Current',
      'no_hazard': 'No Hazard',
      'other': 'Other Hazard',
      'flood': 'Flood',
      'abnormal_tide': 'Abnormal Tide'
    };
    return displayNames[hazardType] || hazardType;
  };

  const getHazardSeverityColor = (hazardType: string, confidence: number) => {
    const criticalHazards = ['tsunami', 'storm_surge', 'coastal_flooding'];
    const mediumHazards = ['high_waves', 'swell_surge', 'flood'];
    
    if (confidence < 0.5) return 'text-gray-600';
    
    if (criticalHazards.includes(hazardType)) {
      return 'text-red-600';
    } else if (mediumHazards.includes(hazardType)) {
      return 'text-yellow-600';
    } else if (hazardType === 'no_hazard') {
      return 'text-green-600';
    } else {
      return 'text-blue-600';
    }
  };

  const getValidationStatus = (hazardType: string, confidence: number) => {
    if (hazardType === 'no_hazard') {
      return {
        isValid: false,
        title: 'No Hazard Detected',
        message: 'AI analysis indicates no immediate coastal hazard'
      };
    }
    
    if (confidence >= 0.8) {
      return {
        isValid: true,
        title: 'High Confidence Detection',
        message: 'AI analysis confirms potential hazard with high confidence'
      };
    } else if (confidence >= 0.6) {
      return {
        isValid: true,
        title: 'Moderate Confidence Detection',
        message: 'AI analysis suggests potential hazard, requires verification'
      };
    } else {
      return {
        isValid: false,
        title: 'Low Confidence Detection',
        message: 'AI analysis uncertain, manual review recommended'
      };
    }
  };

const getRealPredictionData = () => {
  if (!reportData?.apiResponse?.prediction) {
    return {
      isValid: false,
      confidence: 'No prediction available',
      reasoning: 'Unable to get AI prediction from the system.',
      recommendation: 'Report will be manually reviewed by authorities.',
      hazardType: null,
      alternativePredictions: []
    };
  }

  const prediction = reportData.apiResponse.prediction;

  // Safely coerce confidence (handles both string and number)
  const confidence = parseFloat(String(prediction.confidence));

  if (!prediction.hazard_type || isNaN(confidence)) {
    return {
      isValid: false,
      confidence: 'Invalid prediction data',
      reasoning: 'Prediction data is incomplete or corrupted.',
      recommendation: 'Report will be manually reviewed by authorities.',
      hazardType: null,
      alternativePredictions: []
    };
  }

  const validation = getValidationStatus(prediction.hazard_type, confidence);

  // Handle optional all_probabilities
  let sortedProbs: [string, number][] = [];
  if (prediction.all_probabilities && typeof prediction.all_probabilities === 'object') {
    try {
      sortedProbs = Object.entries(prediction.all_probabilities)
        .map(([key, value]) => [key, parseFloat(String(value))] as [string, number])
        .filter(([_, value]) => !isNaN(value))
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);
    } catch (error) {
      console.error('Error processing probabilities:', error);
      sortedProbs = [];
    }
  }

  return {
    isValid: validation.isValid,
    confidence: `${(confidence * 100).toFixed(1)}%`,
    hazardType: prediction.hazard_type,
    hazardDisplayName: getHazardTypeDisplayName(prediction.hazard_type),
    validationTitle: validation.title,
    validationMessage: validation.message,
    reasoning: `AI model classified this report as "${getHazardTypeDisplayName(prediction.hazard_type)}" with ${(confidence * 100).toFixed(1)}% confidence.`,
    recommendation: validation.isValid
      ? 'Report flagged for immediate review by coastal monitoring authorities.'
      : 'Report requires additional verification and manual assessment.',
    alternativePredictions: sortedProbs,
    reportId: reportData.apiResponse.report_id || 'Unknown'
  };
};


  const prediction = reportData ? getRealPredictionData() : null;

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
              {reportData.apiResponse?.report_id && (
                <p className="text-sm text-muted-foreground mt-2">
                  Report ID: {reportData.apiResponse.report_id}
                </p>
              )}
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
                    
                    {reportData.urgency && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Urgency Level</p>
                        {getUrgencyBadge(reportData.urgency)}
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                      <p className="text-sm leading-relaxed bg-muted/50 p-3 rounded">
                        {reportData.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Model Prediction - Now using real data */}
                <Card className="shadow-elegant border-0 bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>AI Validation Results</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Machine learning analysis of hazard classification
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {prediction && (
                      <>
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          {prediction.hazardType && (
                            <div className="mb-3">
                              <h4 className="text-sm font-medium text-muted-foreground">Detected Hazard Type</h4>
                              <p className={`text-lg font-bold ${getHazardSeverityColor(prediction.hazardType, parseFloat(prediction.confidence) / 100)}`}>
                                {prediction.hazardDisplayName}
                              </p>
                            </div>
                          )}
                          <h3 className={`text-xl font-bold ${prediction.isValid ? 'text-green-600' : 'text-yellow-600'}`}>
                            {prediction.validationTitle}
                          </h3>
                          <p className="text-muted-foreground mt-1">
                            Confidence: {prediction.confidence}
                          </p>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium mb-2">AI Analysis</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {prediction.reasoning}
                            </p>
                          </div>
                          
                          {prediction.alternativePredictions && prediction.alternativePredictions.length > 1 && (
                            <div>
                              <h4 className="font-medium mb-2">Alternative Classifications</h4>
                              <div className="space-y-1">
                                {prediction.alternativePredictions.slice(0, 3).map(([hazard, prob], index) => (
                                  <div key={`${hazard}-${index}`} className="flex justify-between text-sm">
                                    <span>{getHazardTypeDisplayName(hazard || 'unknown')}</span>
                                    <span className="text-muted-foreground">
                                      {typeof prob === 'number' ? (prob * 100).toFixed(1) : '0.0'}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div>
                            <h4 className="font-medium mb-2">Next Steps</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {prediction.recommendation}
                            </p>
                          </div>

                          {reportData.apiResponse?.status === 'success' && (
                            <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded">
                              <p className="text-sm text-green-700">
                                Report successfully processed and saved to database.
                              </p>
                            </div>
                          )}
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