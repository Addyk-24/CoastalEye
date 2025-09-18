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

from database.db_manager import Database_Manager
from ml.models.hazard_classifier import HazardClassifier, model_prediction

db_manager = Database_Manager()
model = HazardClassifier()


class UserReport(BaseModel):
    name: str
    location: str
    text_description : str
    media_urls : str
    hazard_type: Optional[str]

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

app.get("/")
def root():
    return {"message": "API Initialization"}

app.post("/submit")
def save_to_db(data: UserReport):
    """ Save User Report and Predicted Data From Model in Database """
    if not db_manager:
        raise HTTPException(status_code=503,detail="Database not connected...")
    try:
        new_entry = db_manager.save_report(data.model_dump())
        prediction = model_prediction(data["text_description"])
        new_model_entry = db_manager.save_model_prediction(prediction,new_entry)

        return {"status":"success", "id":new_entry,"Prediction":PredictionResponse(Prediction=prediction)}
    
    except Exception as e:
        raise HTTPException(status_code=400,detail=str(e))
    

app.get("/reports",response_model=List[Dict[str, Any]])
def get_all_reports(
        limit: int = 50,
):
    """ API to Get all Reports from the DB """
    if not db_manager:
        raise HTTPException(status_code=503, detail="Database service unavailable")
    try:

        response = db_manager.get_all_report(limit)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching startups: {str(e)}")





    

    