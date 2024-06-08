import logging

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..controllers.suggestion import get_suggestion_locations, confirm_suggestion, reject_suggestion, undo_suggestion, \
    retrieve_all_suggestions, retrieve_all_archived_suggestions
from ..utils.db import get_db

logging.basicConfig(format='%(asctime)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/suggestion",
    tags=["suggestion"],
    dependencies=[],
)


@router.get("/")
async def get_all_suggestions(db: Session = Depends(get_db)):
    all_suggestions, num_suggestions = retrieve_all_suggestions(db)
    all_archived_suggestions = retrieve_all_archived_suggestions(db)
    return {
        'suggestions': all_suggestions,
        'archivedSuggestions': all_archived_suggestions,
        'numSuggestions': num_suggestions
    }


@router.get("/map")
async def get_suggestion_verification_metadata(caresId: int, caseID: str, db: Session = Depends(get_db)):
    suggestion_locations = get_suggestion_locations(db, caresId, caseID)
    return suggestion_locations


class Suggestion(BaseModel):
    caresId: int
    caseID: str


@router.post("/confirm")
async def post_confirm_suggestion(suggestion: Suggestion, db: Session = Depends(get_db)):
    return confirm_suggestion(db, suggestion.caresId, suggestion.caseID)


@router.post("/reject")
async def post_reject_suggestion(suggestion: Suggestion, db: Session = Depends(get_db)):
    return reject_suggestion(db, suggestion.caresId, suggestion.caseID)


@router.post("/undo")
async def post_undo_suggestion(suggestion: Suggestion, db: Session = Depends(get_db)):
    return undo_suggestion(db, suggestion.caresId, suggestion.caseID)
