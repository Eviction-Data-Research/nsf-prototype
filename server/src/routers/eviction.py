import datetime
import logging
from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing_extensions import Annotated

from ..controllers.eviction import get_total_eviction_count, get_agg_count_by_month
from ..utils.db import get_db

logging.basicConfig(format='%(asctime)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/eviction",
    tags=["eviction"],
    dependencies=[],
)


@router.get("/chart")
async def get_chart_details(counties: Annotated[List[str], Query()], dateFrom: datetime.date | None = None,
                            dateTo: datetime.date | None = None,
                            db: Session = Depends(get_db)):
    agg_count_by_month = get_agg_count_by_month(db, counties, dateFrom, dateTo)
    total_eviction_count = get_total_eviction_count(db, counties, dateFrom, dateTo)

    return {
        'countByMonth': agg_count_by_month,
        'evictionCount': total_eviction_count,
    }
