from dotenv import load_dotenv
load_dotenv()
import sys
import os

from pydantic import BaseModel
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, date
import json
from supabase import create_client
from dataclasses import dataclass
import uuid

SUPABASE_DB_PASSWORD = os.environ.get("SUPABASE_DB_PASSWORD")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
SUPABASE_URL = os.environ.get("SUPABASE_URL") 


class ModelPrediction(BaseModel):
    predicted_hazard_type : str
    hazard_confidence: float


class Database_Manager:
    """ Enhanced Database Manager For Report Storing """
    def __init__(self):
        self.SUPABASE_URL = SUPABASE_URL
        self.SUPABASE_KEY = SUPABASE_KEY
        self.supabase = None
        self.connected = False
        self._init_connection()

    def _init_connection(self):
        """ Initialize Supabase connection with error Handling """
        try:
            self.supabase = create_client(self.SUPABASE_URL,self.SUPABASE_KEY)

            # Testing connection
            test_result = self.supabase.table("user_reports").select("user_id").limit(1).execute()
            self.connected = True
            print("✅ Database connection successful")
        except Exception as e:
            print(f"❌ Database connection failed: {str(e)}")
            self.connected = False
            self.supabase = None
    
    def is_connected(self):
        """ Check if Database is Connected or Not """
        return self.connected and self.supabase is not None
    
    def get_report_history(self, session_id: str, limit: int = 10):
        """ Get Submitted Reports that are verified """
        try:
            response = self.supabase.table("user_reports").select("*").eq('session_id',session_id).order('created_at',desc=True).limit(limit).execute()

            return response.data if response.data else []
        except Exception as e:
            print(f"Error getting conversation history: {e}")
            return []
    
    def generate_report_id(self, report_name: str) -> str:
        """Generate unique Report Submission ID"""
        base_id = report_name.replace(" ", "_").upper()[:10]
        unique_suffix = str(uuid.uuid4())[:8].upper()
        return f"REPORT_{base_id}_{unique_suffix}"

    def save_report(self, report_data: Dict[str,Any]) -> Optional[str]:
        """ Save Verified Report in the database """

        if not self.is_connected():
            print("❌ Database not connected")
            return None
        # validate the fields
        req_fields = ['text_description','location','name']
        for field in req_fields:
            if not report_data.get(field):
                print(f"❌ Missing required field: {field}")
                return None
        try:
            if not report_data.get('report_id'):
                report_data['report_id'] = self.generate_report_id(report_data['name'])

            location_coords = self._convert_location_to_coordinates(report_data.get('location'))

            # Preparing Report Submission Data
            profile_report = {
                'report_id': report_data['report_id'],
                'name': report_data.get('name'),
                'text_description': report_data.get('text_description'),
                'location': location_coords,
                'media_urls': self._process_media_urls(report_data.get('media_urls')),
            }

            result = self.supabase.table("user_reports").insert(profile_report).execute()

            if not result.data:
                print("❌ Failed to insert User Report profile")
                return None
            report_id = result.data[0]['report_id']

            print(f"✅ User Report profile saved with ID: {report_id}")

            return report_id
        
        except Exception as e:
            print(f"❌ Error saving Model Prediction profile: {str(e)}")
            return None

    def _process_media_urls(self, media_urls) -> List[str]:
        """Process media_urls to ensure proper array format for PostgreSQL"""
        
        if not media_urls:
            return []
        
        # If it's already a list, return as is
        if isinstance(media_urls, list):
            return media_urls
        
        # If it's a string
        if isinstance(media_urls, str):
            # If it's empty or placeholder text, return empty array
            if media_urls.strip() in ['', 'string', 'null', 'undefined']:
                return []
            
            # If it contains comma-separated URLs, split them
            if ',' in media_urls:
                return [url.strip() for url in media_urls.split(',') if url.strip()]
            
            # Single URL string
            return [media_urls.strip()]
        
        # Fallback
        return []


    def _convert_location_to_coordinates(self, location: str) -> str:
        """Convert location string to proper PostGIS POINT format"""
        
        # Dictionary of major Indian cities with coordinates
        city_coordinates = {
            'mumbai': (72.8777, 19.0760),
            'chennai': (80.2707, 13.0827),
            'kolkata': (88.3639, 22.5726),
            'delhi': (77.1025, 28.7041),
            'bangalore': (77.5946, 12.9716),
            'hyderabad': (78.4867, 17.3850),
            'pune': (73.8567, 18.5204),
            'ahmedabad': (72.5714, 23.0225),
            'kochi': (76.2673, 9.9312),
            'visakhapatnam': (83.3176, 17.6868),
            'goa': (74.1240, 15.2993),
            'puducherry': (79.8083, 11.9416),
            'trivandrum': (76.9366, 8.5241),
            'mangalore': (74.8560, 12.9141),
        }
        
        # Clean and normalize location
        location_clean = location.lower().strip()
        
        # Check if it's already in coordinate format (lat, lon)
        try:
            # Try to parse if it's already coordinates like "19.0760,72.8777"
            if ',' in location:
                parts = location.split(',')
                if len(parts) == 2:
                    lat = float(parts[0].strip())
                    lon = float(parts[1].strip())
                    return f"POINT({lon} {lat})"
        except:
            pass
        
        # Look up city coordinates
        if location_clean in city_coordinates:
            lon, lat = city_coordinates[location_clean]
            return f"POINT({lon} {lat})"
        
        # Default to Mumbai if location not found
        print(f"⚠️ Location '{location}' not found, using Mumbai as default")
        lon, lat = city_coordinates['mumbai']
        return f"POINT({lon} {lat})"



    def save_model_prediction(self,data:ModelPrediction,report_id:str):
            """ Save the Predicted Hazard Type and Confidence in Database """
            try:
                profile_report = {
                    'predicted_hazard_type': data.get('hazard_type'),
                    'hazard_confidence': data.get('confidence'),
                }

                result = self.supabase.table('user_reports').update({"predicted_hazard_type":profile_report["predicted_hazard_type"],"hazard_confidence":profile_report["hazard_confidence"]}).eq("report_id",report_id).execute()

                if not result.data:
                    print("❌ Failed to insert Model Prediction profile")
                    return None
                print(f"✅ Model Prediction profile saved ")
                return
            except Exception as e:
                print(f"❌ Error saving Model Prediction profile: {str(e)}")
                return None
    
    def get_all_report(self,limit: int = 50) -> List[Dict[str,Any]]:
        """ Get all Reports from DB """

        if not self.is_connected():
            print("❌ Database not connected")
            return []
        try:
            query = self.supabase.table('user_reports')\
            .select('location,text_description,predicted_hazard_type,hazard_confidence')\
            .eq('verification_status', 'verified')
            # .eq('is_verified', 'true')

            result = query.order('created_at',desc="true").limit(limit).execute()
            return result.data or []
        except Exception as e:
            print(f"❌ Error retrieving startups: {str(e)}")
            return []
