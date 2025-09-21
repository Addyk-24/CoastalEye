from dotenv import load_dotenv
load_dotenv()

import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from pydantic import BaseModel
from typing import Optional,List,Dict,Any

from app.database.db_manager import Database_Manager
from app.ml.models.hazard_classifier import HazardClassifier, model_prediction

db_manager = Database_Manager()
model = HazardClassifier()


class UserReport(BaseModel):
    name: str
    location: str
    text_description : str
    media_urls : str = ""

class PredictionResponse(BaseModel):
    Prediction: str

app = FastAPI(
    title="CoastalEye API",
    description="API for Crowdsourced data and prediction of Hazardous factor is affecting",
    version="1.0.0"
)

# CORS middleware for development
origins = [
    "http://localhost:3000",
    "http://localhost:4000", 
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:4000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:4001",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "API Initialization"}

@app.post("/submit")
def save_to_db(data: UserReport):
    """ Save User Report and Predicted Data From Model in Database """
    if not db_manager:
        raise HTTPException(status_code=503,detail="Database not connected...")
    try:
        report_data = data.model_dump()
        if 'file_name' not in report_data:
            report_data['file_name'] = f"{data.name}_{data.location}_report.txt"

        new_entry = db_manager.save_report(report_data)

        if not new_entry:
            raise HTTPException(status_code=400, detail="Failed to save report")
        
        prediction_result = model_prediction(data.text_description)

        if not prediction_result:
            raise HTTPException(status_code=500, detail="Failed to get model prediction")
        
        db_manager.save_model_prediction(prediction_result, new_entry)


        return {
            "status": "success", 
            "report_id": new_entry,
            "prediction": prediction_result
        }    
    except Exception as e:
        print(f"Error in save_to_db: {str(e)}")
        raise HTTPException(status_code=400,detail=str(e))
    

@app.get("/reports",response_model=List[Dict[str, Any]])
def get_all_reports(
        limit: int = 50,
):
    """ API to Get all Reports from the DB """
    if not db_manager.is_connected():
        raise HTTPException(status_code=503, detail="Database service unavailable")
    try:

        response = db_manager.get_all_report(limit)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching startups: {str(e)}")

@app.get("/report/{report_id}")
def get_specific_report(report_id : str):
    """ API for getting specific report """
    if not db_manager.is_connected():
        raise HTTPException(status_code=503, detail="Database service unavailable")
    try:
        specific_report = db_manager.get_report_by_name_or_id(report_id)

        if not specific_report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        return {f"Specific Report with {report_id} " : specific_report}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching startup: {str(e)}")

@app.get("/predict/{location}")
def get_location_prediction(location: str):
    """Get hazard prediction for a specific location"""
    if not db_manager.is_connected():
        raise HTTPException(status_code=503, detail="Database service unavailable")
    
    try:
        # Search by location_name instead of coordinates
        reports = db_manager.supabase.table('user_reports')\
            .select('predicted_hazard_type,hazard_confidence,verification_status,created_at,name,location_name')\
            .ilike('location_name', f'%{location}%')\
            .order('created_at', desc=True)\
            .limit(10)\
            .execute()
        
        # Return None if no reports found
        if not reports.data:
            return {
                "location": location,
                "has_data": False,
                "message": f"No reports found for {location} in database"
            }
        
        # Get the most recent verified report, or most recent unverified if no verified exists
        verified_reports = [r for r in reports.data if r.get('verification_status') == 'verified' and r.get('predicted_hazard_type')]
        all_reports_with_prediction = [r for r in reports.data if r.get('predicted_hazard_type') and r.get('hazard_confidence')]
        
        # Use verified report first, otherwise most recent with prediction
        target_report = None
        if verified_reports:
            target_report = verified_reports[0]
        elif all_reports_with_prediction:
            target_report = all_reports_with_prediction[0]
        
        if not target_report:
            return {
                "location": location,
                "has_data": False,
                "message": f"No ML predictions available for {location}"
            }
        
        # Return actual database prediction
        return {
            "location": location,
            "has_data": True,
            "predicted_hazard_type": target_report['predicted_hazard_type'],
            "hazard_confidence": float(target_report['hazard_confidence']),
            "verification_status": target_report['verification_status'],
            "report_date": target_report['created_at'],
            "total_reports": len(reports.data),
            "verified_reports": len(verified_reports)
        }
        
    except Exception as e:
        print(f"Error in get_location_prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )

# run : uv run fastapi dev

# Example 

# {
#   "name": "Tapu",
#   "location": "Mumbai",
#   "text_description": "High waves and Long narrow wave incoming with aggressive waves hitting on the shore",
#   "media_urls": "",
#   "hazard_type": "Heatwave"
# }