
from fastapi import FastAPI
from pydantic import BaseModel

from database.db_manager import Database_Manager

db_manager = Database_Manager()

class UserReport(BaseModel):
    location: str
    text_description : str
    file_name : str


app = FastAPI()

app.post("/submit")
def save_to_db():
    pass

    