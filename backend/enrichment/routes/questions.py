import json
from pathlib import Path
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_questions():
    file_path = Path(__file__).parent.parent / "data" / "question_bank.json"
    with open(file_path) as f:
        return json.load(f)