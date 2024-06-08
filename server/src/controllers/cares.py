import datetime
from typing import List

import pandas as pd
from fastapi import HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from ..utils.consts import PROXIMITY_RADIUS


def _extract_lon_lat(location):
    stripped = location[6:-1]
    split_location = stripped.split(' ')
    return [float(x) for x in split_location]


def populate_default_dates(date_from: datetime.date | None, date_to: datetime.date | None):
    date_from = '2019-01-01' if date_from is None else date_from
    date_to = datetime.date.today().strftime('%Y-%m-%d') if date_to is None else date_to
    return date_from, date_to


def _construct_county_filter_subquery(counties: List[str]):
    return ' OR '.join([f"""counties."name10" = '{county}'""" for county in counties])


def construct_date_filter_subquery(date_from: datetime.date | None = None, date_to: datetime.date | None = None,
                                   first_filter: bool = False):
    if date_from is None and date_to is None:
        return ''
    conjunction = 'WHERE' if first_filter else 'AND'
    statements = []
    if date_from is not None:
        statements.append(f""" e."fileDate" >= '{date_from}' """)
    if date_to is not None:
        statements.append(f""" e."fileDate" <= '{date_to}' """)
    date_filter_subquery = conjunction + ' AND '.join(statements)

    return date_filter_subquery


def get_all_cares_records(db: Session, counties: List[str], dateFrom: datetime.date | None = None,
                          dateTo: datetime.date | None = None,
                          minCount: int = 0, activity: bool = False):
    county_filter_subquery = _construct_county_filter_subquery(counties)

    date_filter_subquery = construct_date_filter_subquery(dateFrom, dateTo)

    query = f"""
        SELECT
            c.id,
            ST_AsText(c.location) AS location,
            COUNT(CASE WHEN r.type IN ('ADDRESS_MATCH', 'MANUAL_MATCH') THEN e."caseID" END) AS count
        FROM cares AS c
        LEFT JOIN "eviction-cares" AS r ON c.id = r."caresId"
        LEFT JOIN evictions AS e ON r."evictionId" = e."caseID"
        LEFT JOIN counties ON ST_Within(c.location::geometry, counties.geom::geometry)
        WHERE ({county_filter_subquery}) {date_filter_subquery}
        GROUP BY c.id
        HAVING COUNT(CASE WHEN r.type IN ('ADDRESS_MATCH', 'MANUAL_MATCH') THEN e."caseID" END) >= {minCount};
    """

    cares_eviction_count = pd.read_sql(query, db.connection())

    if cares_eviction_count.shape[0] == 0:
        return [], 0

    cares_eviction_count_copy = cares_eviction_count.copy()
    cares_eviction_count_copy['location'] = cares_eviction_count.apply(lambda row: _extract_lon_lat(row['location']),
                                                                       axis=1)
    return cares_eviction_count_copy.to_dict(orient='records'), cares_eviction_count_copy['count'].max().item()


_MONTH_KEY = 'month'


def get_property_eviction_count_by_month(db: Session, id: int, dateFrom: datetime.date | None = None,
                                         dateTo: datetime.date | None = None):
    date_filter_subquery = construct_date_filter_subquery(dateFrom, dateTo)
    date_from, date_to = populate_default_dates(dateFrom, dateTo)

    query = f"""
        SELECT
            to_char(months.month, 'MM/YY') AS label,
            COALESCE(record_count, 0) AS value 
        FROM (
            SELECT generate_series(
                date_trunc('month', '{date_from}'::date),
                date_trunc('month', '{date_to}'::date),
                '1 month'::interval
            ) AS month
        ) AS months
        LEFT JOIN (
            SELECT
                date_trunc('month', "fileDate") AS month,
                COUNT(*) AS record_count
            FROM evictions AS e
            LEFT JOIN "eviction-cares" AS r ON e."caseID" = r."evictionId"
            LEFT JOIN cares AS c ON r."caresId" = c.id
            WHERE c.id = {id} AND
                r.type IN ('ADDRESS_MATCH', 'MANUAL_MATCH')
                {date_filter_subquery}
            GROUP BY 1 
        ) AS record_counts
        ON months.month = record_counts.month
        ORDER BY months.month ASC;
--         LIMIT 12; 
    """
    property_eviction_count_by_month = pd.read_sql(query, db.connection())
    if property_eviction_count_by_month.shape[0] > 0:
        return property_eviction_count_by_month.to_dict(orient='records')
    else:
        return []


def get_property_eviction_count_by_week(db: Session, id: int, dateFrom: datetime.date | None = None,
                                        dateTo: datetime.date | None = None):
    date_filter_subquery = construct_date_filter_subquery(dateFrom, dateTo)
    date_from, date_to = populate_default_dates(dateFrom, dateTo)

    query = f"""
        SELECT
--             to_char(weeks.week, 'MM/DD/YY') || '-' || to_char(weeks.week + interval '6 days', 'MM/DD/YY') AS label,
            to_char(weeks.week, 'MM/DD/YY') AS label,
            COALESCE(record_count, 0) AS value 
        FROM (
            SELECT generate_series(
                date_trunc('week', '{date_from}'::date) - interval '1 day', -- Start on Sunday
                date_trunc('week', '{date_to}'::date) - interval '1 day' + interval '1 week',
                '1 week'::interval
            ) AS week
        ) AS weeks
        LEFT JOIN (
            SELECT
                date_trunc('week', "fileDate") - interval '1 day' AS week,
                COUNT(*) AS record_count
            FROM evictions AS e
            LEFT JOIN "eviction-cares" AS r ON e."caseID" = r."evictionId"
            LEFT JOIN cares AS c ON r."caresId" = c.id
            WHERE c.id = {id} AND
                r.type IN ('ADDRESS_MATCH', 'MANUAL_MATCH')
                {date_filter_subquery}
            GROUP BY 1
        ) AS record_counts
        ON weeks.week = record_counts.week
        ORDER BY weeks.week;
--         LIMIT 20;
    """
    property_eviction_count_by_week = pd.read_sql(query, db.connection())
    if property_eviction_count_by_week.shape[0] > 0:
        return property_eviction_count_by_week.to_dict(orient='records')
    else:
        return []


# Number of days in filtered date range to trigger a year-long temporal aggregation
YEAR_RANGE_THRESHOLD = 365 * 2

# Number of days in filtered date range to trigger a month-long temporal aggregation
MONTH_RANGE_THRESHOLD = 7 * 24


def get_property_eviction_count_by_dynamic_time_range(db: Session, id: int, dateFrom: datetime.date | None,
                                                      dateTo: datetime.date | None):
    date_from = datetime.date(2019, 1, 1) if dateFrom is None else dateFrom
    date_to = datetime.date.today() if dateTo is None else dateTo
    delta_days = (date_to - date_from).days

    if delta_days > YEAR_RANGE_THRESHOLD:
        agg_query = f"""
           SELECT
                to_char(months.month, 'MM/YY') AS label,
                COALESCE(record_count, 0) AS value 
            FROM (
                SELECT generate_series(
                    '{date_from}'::date, 
                    '{date_to}'::date, 
                    '1 year'::interval
                ) AS month
            ) AS months
            LEFT JOIN (
                SELECT
                    date_trunc('year', "fileDate") AS month,
                    COUNT(*) AS record_count
                FROM evictions AS e
                LEFT JOIN "eviction-cares" AS r ON e."caseID" = r."evictionId"
                LEFT JOIN cares AS c ON r."caresId" = c.id
                WHERE c.id = {id} AND
                    r.type IN ('ADDRESS_MATCH', 'MANUAL_MATCH')
                GROUP BY 1 
            ) AS record_counts
            ON months.month = record_counts.month
            ORDER BY months.month ASC; 
        """
    elif delta_days > MONTH_RANGE_THRESHOLD:
        # agg_query =
        pass
    else:
        # agg_query =
        pass
    print(delta_days)
    pass


def get_inexact_records_by_property(db: Session, id: int):
    # inexact records (suggestions) should be within 160m
    query = f"""
        WITH property AS (
            SELECT id, location FROM cares WHERE cares.id = {id} 
        )
        SELECT "caseID", 
            (SELECT id FROM property),
            "defendantAddress1" AS address,
            2 AS verification
        FROM evictions AS e
        LEFT JOIN "eviction-cares" AS r
        ON e."caseID" = r."evictionId"
        WHERE ST_DWithin(
            (SELECT location FROM property)::geography, 
            e.location::geography, 
            {PROXIMITY_RADIUS}, 
            true
        ) AND (
            r.type IS NULL OR 
            (r."caresId" != {id} AND r.type = 'MANUAL_REJECT')
        );
    """
    suggestions = pd.read_sql(query, db.connection())
    if suggestions.shape[0] == 0:
        return []
    return suggestions.to_dict(orient='records')


def get_archived_suggestions(db: Session, caresId: int):
    query = f"""
        SELECT r."caresId" AS id, 
            CASE 
                WHEN r.type = 'MANUAL_MATCH' THEN 0
                WHEN r.type = 'MANUAL_REJECT' THEN 1
            END AS verification,
            e."caseID", 
            e."defendantAddress1" AS address
        FROM "eviction-cares" AS r
        LEFT JOIN evictions AS e ON e."caseID" = r."evictionId"
        WHERE "caresId" = {caresId} AND type != 'ADDRESS_MATCH'
    """

    archived_suggestions = pd.read_sql(query, db.connection())

    if archived_suggestions.shape[0] == 0:
        return []

    return archived_suggestions.to_dict(orient='records')


def get_name_permutations(db: Session, id: int):
    query = f"""
        SELECT plaintiff, COUNT(plaintiff), MAX("fileDate") AS "mostRecentlySeen"
        FROM evictions AS e 
        LEFT JOIN "eviction-cares" AS r ON e."caseID" = r."evictionId"
        WHERE r."caresId" = {id} AND r.type IN ('ADDRESS_MATCH', 'MANUAL_MATCH') 
        GROUP BY plaintiff 
        ORDER BY "mostRecentlySeen" DESC;
    """
    name_permutations = pd.read_sql(query, db.connection())
    return name_permutations.to_dict(orient='records')


def get_address_permutations(db: Session, id: int):
    query = f"""
        SELECT CONCAT(e."defendantAddress1", ', ', e."defendantCity1") AS address 
        FROM evictions AS e LEFT JOIN "eviction-cares" AS r ON e."caseID" = r."evictionId"
        WHERE r."caresId" = {id} AND r.type IN ('ADDRESS_MATCH', 'MANUAL_MATCH');
    """
    address_permutations = pd.read_sql(query, db.connection())
    if address_permutations.shape[0] == 0:
        return []

    return address_permutations.to_dict(orient='records')


def get_cares_property_records(db: Session, id: int, dateFrom: datetime.date | None = None,
                               dateTo: datetime.date | None = None):
    date_filter_subquery = ''
    date_filter_subquery += f"""AND e."fileDate" >= '{dateFrom}'""" if dateFrom is not None else ''
    date_filter_subquery += f"""AND e."fileDate" <= '{dateTo}'""" if dateTo is not None else ''
    query = f"""
        SELECT c.id, 
            c.source, 
            c."propertyName", 
            c.address, 
            c.city, 
            c."zipCode", 
            COUNT(CASE WHEN 
                r.type IN ('ADDRESS_MATCH', 'MANUAL_MATCH') 
                {date_filter_subquery} 
                THEN e."caseID" END) AS count
        FROM cares AS c 
        LEFT JOIN "eviction-cares" AS r ON c.id = r."caresId"
        LEFT JOIN evictions AS e ON r."evictionId" = e."caseID"
        WHERE c.id = {id} 
        GROUP BY c.id;
    """

    cares_property = pd.read_sql(query, db.connection())

    if cares_property.shape[0] != 1:
        raise HTTPException(400, 'Invalid id')

    return cares_property.iloc[0].to_dict()
