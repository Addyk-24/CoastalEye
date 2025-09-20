import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MapComponentProps {
  location?: string;
  onLocationChange?: (location: string) => void;
  showLocationInput?: boolean;
}

const MapComponent: React.FC<MapComponentProps> = ({ 
  location, 
  onLocationChange,
  showLocationInput = false 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>(
    import.meta.env.VITE_MAPBOX_TOKEN || ''
  );
  const [inputLocation, setInputLocation] = useState(location || '');

  const initializeMap = (token: string) => {
    if (!mapContainer.current || map.current) return;

    try {
      mapboxgl.accessToken = token;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        projection: 'globe' as any,
        zoom: 2,
        center: [0, 20],
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add marker if location is provided
      if (location) {
        // This is a simplified geocoding - in real app, use Mapbox Geocoding API
        const coords = getCoordinatesFromLocation(location);
        if (coords) {
          new mapboxgl.Marker()
            .setLngLat(coords)
            .addTo(map.current);
          
          map.current.flyTo({
            center: coords,
            zoom: 10,
            duration: 2000
          });
        }
      }

    } catch (error) {
      console.error('Error initializing map:', error);
      toast.error('Error initializing map. Please check your Mapbox token.');
    }
  };

  const getCoordinatesFromLocation = (loc: string): [number, number] | null => {
    // Simplified location mapping - in real app, use geocoding service
    const locations: { [key: string]: [number, number] } = {
      'new york': [-74.006, 40.7128],
      'london': [-0.1276, 51.5074],
      'tokyo': [139.6917, 35.6895],
      'sydney': [151.2093, -33.8688],
      'mumbai': [72.8777, 19.0760],
      'california': [-119.4179, 36.7783],
      'florida': [-81.5158, 27.6648],
    };
    
    return locations[loc.toLowerCase()] || null;
  };

  const handleLocationSubmit = () => {
    if (inputLocation && onLocationChange) {
      onLocationChange(inputLocation);
      const coords = getCoordinatesFromLocation(inputLocation);
      if (coords && map.current) {
        // Add or update marker
        new mapboxgl.Marker()
          .setLngLat(coords)
          .addTo(map.current);
        
        map.current.flyTo({
          center: coords,
          zoom: 10,
          duration: 2000
        });
      } else {
        toast.error('Location not found. Try: New York, London, Tokyo, Sydney, Mumbai, California, Florida');
      }
    }
  };

  useEffect(() => {
    if (mapboxToken) {
      initializeMap(mapboxToken);
    }
  }, [mapboxToken]);

  useEffect(() => {
    setInputLocation(location || '');
  }, [location]);

  if (!mapboxToken) {
    return (
      <div className="w-full h-[500px] bg-muted rounded-lg border flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h3 className="text-lg font-semibold mb-4">Mapbox Token Required</h3>
          <p className="text-muted-foreground mb-4">
            Get your FREE Mapbox token to display the interactive map:
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-left">
            <h4 className="font-semibold text-blue-900 mb-2">How to get your FREE token:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Visit <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">mapbox.com</a></li>
              <li>Sign up for a FREE account</li>
              <li>Go to your account dashboard</li>
              <li>Copy your "Default public token"</li>
              <li>Paste it below</li>
            </ol>
            <p className="text-xs text-blue-700 mt-2">
              <strong>Free tier includes:</strong> 50,000 map loads/month - perfect for development!
            </p>
          </div>
          <Input
            type="text"
            placeholder="Paste your Mapbox public token here"
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
            className="mb-4"
          />
          <Button 
            onClick={() => window.open('https://mapbox.com', '_blank')}
            variant="outline"
            className="w-full"
          >
            Get Free Token at Mapbox
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] space-y-4">
      {showLocationInput && (
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter location (e.g., New York, London, Tokyo)"
            value={inputLocation}
            onChange={(e) => setInputLocation(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLocationSubmit()}
          />
          <Button onClick={handleLocationSubmit}>
            Find Location
          </Button>
        </div>
      )}
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg border shadow-elegant" 
      />
    </div>
  );
};

export default MapComponent;