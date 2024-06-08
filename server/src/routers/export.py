import datetime
import logging
import os

from fastapi import APIRouter, Depends, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..controllers.export import get_cares_property_eviction_file, get_all_evictions_file, \
    get_cares_property_address_permutations_file
from ..utils.db import get_db

logging.basicConfig(format='%(asctime)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/export",
    tags=["export"],
    dependencies=[],
)


@router.post("/all")
async def get_eviction_data(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    evictions_filepath = get_all_evictions_file(db)
    background_tasks.add_task(os.remove, evictions_filepath)
    return FileResponse(evictions_filepath, filename=f'evictions.{datetime.datetime.now().timestamp()}.csv',
                        media_type='text/csv',
                        headers={
                            'Access-Control-Expose-Headers': 'Content-Disposition',
                            'Content-Disposition': f'attachment; filename=evictions.{datetime.datetime.now().timestamp()}.csv'
                        })


class Cares(BaseModel):
    id: int


@router.post("/property")
async def get_property_data(cares: Cares, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    cares_property_eviction_filepath = get_cares_property_eviction_file(db, cares.id)
    background_tasks.add_task(os.remove, cares_property_eviction_filepath)
    return FileResponse(cares_property_eviction_filepath,
                        filename=f'{cares.id}.{datetime.datetime.now().timestamp()}.csv', media_type='text/csv',
                        headers={
                            'Access-Control-Expose-Headers': 'Content-Disposition',
                            'Content-Disposition': f'attachment; filename={cares.id}.{datetime.datetime.now().timestamp()}.csv'
                        })


@router.post("/property/addresses")
async def get_property_name_permutation_data(cares: Cares, background_tasks: BackgroundTasks,
                                             db: Session = Depends(get_db)):
    cares_property_address_permutations_filepath = get_cares_property_address_permutations_file(db, cares.id)
    background_tasks.add_task(os.remove, cares_property_address_permutations_filepath)
    return FileResponse(cares_property_address_permutations_filepath,
                        filename=f'{cares.id}.addresses.{datetime.datetime.now().timestamp()}.csv',
                        media_type='text/csv',
                        headers={
                            'Access-Control-Expose-Headers': 'Content-Disposition',
                            'Content-Disposition': f'attachment; filename={cares.id}.addresses.{datetime.datetime.now().timestamp()}.csv'
                        })
