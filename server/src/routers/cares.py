import datetime
import logging
from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing_extensions import Annotated

from ..controllers.cares import get_all_cares_records, get_cares_property_records, get_property_eviction_count_by_month, \
    get_property_eviction_count_by_week, get_name_permutations, get_address_permutations, \
    get_inexact_records_by_property, get_archived_suggestions
from ..utils.db import get_db

logging.basicConfig(format='%(asctime)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/cares",
    tags=["cares"],
    dependencies=[],
)


@router.get("/")
async def get_all_cares_properties(counties: Annotated[List[str], Query()], dateFrom: datetime.date | None = None,
                                   dateTo: datetime.date | None = None, minCount: int = 0, activity: bool = False,
                                   db: Session = Depends(get_db)):
    cares_eviction_records, max_count = get_all_cares_records(db, counties, dateFrom, dateTo, minCount,
                                                              activity)
    return {
        'records': cares_eviction_records,
        'maxCount': max_count,
    }


@router.get("/property")
# History and property fields intended for property popup - not to be used for property page (history and property
#   fetch must be done independently)
async def get_property_details(id: int, dateFrom: datetime.date | None = None, dateTo: datetime.date | None = None,
                               db: Session = Depends(get_db)):
    cares_property_records = get_cares_property_records(db, id, dateFrom, dateTo)
    # property_eviction_count_dynamic = get_property_eviction_count_by_dynamic_time_range(db, id, dateFrom, dateTo)

    property_eviction_count_by_month = get_property_eviction_count_by_month(db, id, dateFrom, dateTo)
    property_eviction_count_by_week = get_property_eviction_count_by_week(db, id, dateFrom, dateTo)

    # dateFrom and dateTo not needed, only used for popup
    suggestions = get_inexact_records_by_property(db, id)
    archived_suggestions = get_archived_suggestions(db, id)
    name_permutations = get_name_permutations(db, id)
    address_permutations = get_address_permutations(db, id)

    return {
        'property': cares_property_records,
        'history': {
            'month': property_eviction_count_by_month,
            'week': property_eviction_count_by_week,
        },
        'suggestions': suggestions,
        'archivedSuggestions': archived_suggestions,
        'namePermutations': name_permutations,
        'addressPermutations': address_permutations,
    }


@router.get("/property/trend")
async def get_property_trend(id: int, dateFrom: datetime.date, dateTo: datetime.date, db: Session = Depends(get_db)):
    cares_property_records = get_cares_property_records(db, id, dateFrom, dateTo)

    property_eviction_count_by_month = get_property_eviction_count_by_month(db, id, dateFrom, dateTo)
    property_eviction_count_by_week = get_property_eviction_count_by_week(db, id, dateFrom, dateTo)

    return {
        'property': cares_property_records,
        'history': {
            'month': property_eviction_count_by_month,
            'week': property_eviction_count_by_week,
        },
    }
