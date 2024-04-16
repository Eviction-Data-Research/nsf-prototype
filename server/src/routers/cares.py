from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, Form, File
from typing_extensions import Annotated
from sqlalchemy.orm import Session
from pydantic import BaseModel
import pandas as pd
import os
from io import BytesIO 
import json
from ..db.db import SessionLocal
import datetime
from ..utils.consts import REQUIRED_COLS
from ..controllers.cares import get_all_cares_records, get_cares_property_records, get_property_eviction_count_by_month
import logging
logging.basicConfig(format='%(asctime)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/cares",
    tags=["cares"],
    dependencies=[],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
async def get_all_cares_properties(counties: Annotated[List[str], Query()], dateFrom: datetime.date | None = None, dateTo: datetime.date | None = None, minCount: int = 0, activity: bool = False, db: Session = Depends(get_db)):
    cares_eviction_records, max_count = get_all_cares_records(db, dateFrom, dateTo, minCount, activity)

    return {
        'records': cares_eviction_records,
        'maxCount': max_count 
    }

@router.get("/single")
async def post_upload_confirm(id: int, db: Session = Depends(get_db)): 
    cares_property_records = get_cares_property_records(db, id)
    property_eviction_count_by_month = get_property_eviction_count_by_month(db, id)

    return {
        'property': cares_property_records,
        'history': property_eviction_count_by_month
    } 

