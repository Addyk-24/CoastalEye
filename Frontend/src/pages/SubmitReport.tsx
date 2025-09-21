import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";

const SubmitReport = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    location: '',
    description: '',
    reason: '',
    urgency: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    // Fix 1: Correct validation logic
    const requiredFields = ['name', 'email', 'location', 'description'];
    const missingFields = requiredFields.filter(field => 
      !formData[field] || formData[field].trim() === ''
    );

    if (missingFields.length > 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Fix 2: Add media_urls field to match your API
    const transformedData = {
      name: formData.name,
      location: formData.location,
      text_description: formData.description,
      media_urls: "" // Your API expects this field
    };

    const apiUrl = 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/submit`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(transformedData)
    });

    console.log('Response status:', response.status);

    // Fix 3: Handle response properly
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server response error:', errorText);

      try {
        const errorData = JSON.parse(errorText);
        if (errorData.detail && Array.isArray(errorData.detail)) {
          const errorMessages = errorData.detail.map(err => `${err.loc.join('.')}: ${err.msg}`);
          toast.error('Please fix the following errors:\n' + errorMessages.join('\n'));
        } else {
          toast.error(errorData.detail || errorData.error || 'Server error occurred');
        }
      } catch (parseError) {
        toast.error(`Server error (${response.status}): ${errorText}`);
      }
      return;
    }

    // Fix 4: Get result after response check
    const result = await response.json();
    console.log('Full API Response:', JSON.stringify(result, null, 2)); // Debug log
    console.log('Prediction object:', result.prediction); // Debug log
    console.log('Success response:', result);

    // Fix 5: Store data and navigate properly
    if (result.status === 'success') {
      const reportDataWithPrediction = {
        ...formData,
        apiResponse: result
      };
      console.log('Storing data:', JSON.stringify(reportDataWithPrediction, null, 2));

      // Store form data in session storage for the results page
      sessionStorage.setItem('reportData', JSON.stringify(reportDataWithPrediction));
      
      toast.success('Report submitted successfully!');
      alert('Report submitted successfully!');
      navigate('/report-results');

    } else {
      toast.error(result.error || 'Failed to submit report');
    }

  } catch (error) {
    console.error('Submission error:', error);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      toast.error('Network error: Please check your connection');
    } else {
      toast.error('An unexpected error occurred: ' + error.message);
    }
  }
};

  return (
    <div className="min-h-screen bg-gradient-smoke">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-noir border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold">Submit Hazard Report</CardTitle>
                <p className="text-muted-foreground">
                  Help keep communities safe by reporting coastal hazards
                </p>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="transition-smooth focus:shadow-elegant"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="transition-smooth focus:shadow-elegant"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      type="text"
                      placeholder="e.g., New York, London, Tokyo, Sydney, Mumbai"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="transition-smooth focus:shadow-elegant"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description of Hazard *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the coastal hazard you've observed..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="min-h-[100px] transition-smooth focus:shadow-elegant"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason for Report</Label>
                    <Textarea
                      id="reason"
                      placeholder="Why are you submitting this report?"
                      value={formData.reason}
                      onChange={(e) => handleInputChange('reason', e.target.value)}
                      className="transition-smooth focus:shadow-elegant"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Urgency Level *</Label>
                    <RadioGroup 
                      value={formData.urgency} 
                      onValueChange={(value) => handleInputChange('urgency', value)}
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="immediate" id="immediate" />
                        <Label htmlFor="immediate" className="cursor-pointer">
                          Immediate Danger - People need to evacuate now
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="close" id="close" />
                        <Label htmlFor="close" className="cursor-pointer">
                          Close Threat - Hazard is nearby but people can escape
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="future" id="future" />
                        <Label htmlFor="future" className="cursor-pointer">
                          Future Threat - Will impact area later
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/')}
                      className="flex-1 transition-butterfly"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-noir hover:shadow-noir transition-butterfly"
                    >
                      Submit Report
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SubmitReport;