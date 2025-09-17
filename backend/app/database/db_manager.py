from dotenv import load_dotenv
load_dotenv()
import sys
import os

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, date
import json
from supabase import create_client
from dataclasses import dataclass
import uuid

SUPABASE_DB_PASSWORD = os.environ.get("SUPABASE_DB_PASSWORD")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
SUPABASE_URL = os.environ.get("SUPABASE_URL") 

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
        req_fields = ['text_description','location','file_name']
        for field in req_fields:
            if not report_data.get(req_fields):
                print(f"❌ Missing required field: {field}")
                return None
        try:
            if not report_data.get['report_id']:
                report_data['report_id'] = self.generate_report_id(report_data['name'])

            # Preparing Report Submission Data
            profile_report = {
                'report_id': report_data['report_id'],
                'name': report_data.get('name'),
                'text_description': report_data.get('text_description'),
                'location': report_data.get('location'),
                'file_name': report_data.get('file_name'),
            }
            result = self.supabase.table("user_reports").insert(profile_report).execute()

            if not result.data:
                print("❌ Failed to insert Investor profile")
                return None
            report_id = result.data[0]['investor_id']
            print(f"✅ Investor profile saved with ID: {report_id}")

            return report_id
        except Exception as e:
            print(f"❌ Error saving Investor profile: {str(e)}")
            return None