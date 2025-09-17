
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional

from database.db_manager import Database_Manager

db_manager = Database_Manager()

class UserReport(BaseModel):
    name: str
    location: str
    text_description : str
    media_urls : str
    hazard_type: Optional[str]


app = FastAPI()

app.post("/submit")
def save_to_db():
    pass

    