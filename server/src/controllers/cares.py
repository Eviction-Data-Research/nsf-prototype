from sqlalchemy.orm import Session
import datetime
import pandas as pd
from fastapi import FastAPI, HTTPException

def _extract_lon_lat(row):
    location = row['location']
    stripped = location[6:-1]
    split_location = stripped.split(' ')
    return [float(x) for x in split_location] 


def get_all_cares_records(db: Session, dateFrom: datetime.date | None = None, dateTo: datetime.date | None = None, minCount: int = 0, activity: bool = False):
    query = f"""
        SELECT cares.id AS id, ST_AsText(cares.location) AS location, 
            COUNT(evictions."caresId") AS count
        FROM cares LEFT JOIN evictions 
        ON cares.id = evictions."caresId" 
        GROUP BY cares.id
    """
    
    cares_eviction_count = pd.read_sql(query, db.connection())
    cares_eviction_count_copy = cares_eviction_count.copy()
    cares_eviction_count_copy['location'] = cares_eviction_count.apply(_extract_lon_lat, axis=1)

    return cares_eviction_count_copy.to_dict(orient='records'), cares_eviction_count_copy['count'].max().item()

def _convert_date_to_label(row):
    month = row['month']
    return month.strftime("%m/%y") # "%b %Y" is Mar 2019

def get_property_eviction_count_by_month(db: Session, id: int):
    query = f"""
        SELECT * FROM (
            SELECT DATE_TRUNC('month', evictions."fileDate") AS month, 
                COUNT(evictions."caresId") AS count 
            FROM cares LEFT JOIN evictions ON cares.id = evictions."caresId" 
            WHERE cares.id={id}
            GROUP BY DATE_TRUNC('month', evictions."fileDate") 
            HAVING DATE_TRUNC('month', evictions."fileDate") IS NOT NULL
            ORDER BY DATE_TRUNC('month', evictions."fileDate") DESC
            LIMIT 6
        ) AS month_counts
        ORDER BY DATE_TRUNC('month', month_counts.month) ASC
    """
    property_eviction_count_by_month = pd.read_sql(query, db.connection())
    if property_eviction_count_by_month.shape[0] > 0:
        property_eviction_count_by_month_copy = property_eviction_count_by_month.copy()
        property_eviction_count_by_month_copy['month'] = property_eviction_count_by_month.apply(_convert_date_to_label, axis=1)
        return property_eviction_count_by_month_copy.to_dict(orient='records')
    else:
        return []


def get_cares_property_records(db: Session, id: int):
    query = f"""
        SELECT cares.id, cares.source, cares."propertyName", cares.address, 
            cares.city, cares."zipCode", COUNT(evictions."caresId") AS count
        FROM cares LEFT JOIN evictions
        ON cares.id = evictions."caresId"
        WHERE cares.id = {id}
        GROUP BY cares.id
    """

    cares_property = pd.read_sql(query, db.connection())

    if cares_property.shape[0] != 1:
        raise HTTPException(400, 'Invalid id')

    return cares_property.iloc[0].to_dict()