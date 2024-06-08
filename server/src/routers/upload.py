from fastapi import APIRouter, Depends, HTTPException, UploadFile, Form, File
from typing_extensions import Annotated
from sqlalchemy.orm import Session
from pydantic import BaseModel
import pandas as pd
import os
from io import BytesIO
import json
from ..db.db import SessionLocal
from ..utils.consts import REQUIRED_COLS
from ..controllers.eviction import transform_eviction_data, get_matches
import logging
from ..db.models.Eviction import Eviction
from ..utils.db import get_db

logging.basicConfig(format='%(asctime)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/upload",
    tags=["upload"],
    dependencies=[],
)


@router.post("/request")
async def post_upload_request(file: UploadFile):
    input_df = pd.read_csv(BytesIO(file.file.read()))

    input_df.fillna("", inplace=True)
    head = input_df.head()

    return head.to_dict(orient='list')


@router.post("/confirm")
async def post_upload_confirm(file: UploadFile, cols: Annotated[str, Form()], db: Session = Depends(get_db)):
    input_df = pd.read_csv(BytesIO(file.file.read()))

    logger.info(f"Number of records (pre-deduplication): {input_df.shape[0]}")

    col_map = json.loads(cols)
    # TODO: Check if all required cols are keys in col_map

    transformed_input_df = transform_eviction_data(input_df, col_map)

    await get_matches(db, transformed_input_df)

    pass
