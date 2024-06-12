import pandas as pd
from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from src.controllers.cares import _extract_lon_lat


def get_count_suggestions(db: Session):
    query = f"""
        SELECT COUNT(e."caseID") AS count 
        FROM evictions AS e
                 LEFT JOIN "eviction-cares" AS r ON e."caseID" = r."evictionId"
                 CROSS JOIN LATERAL (
            SELECT c.id, c."propertyName", e.location <-> c.location AS dist FROM cares AS c ORDER BY dist LIMIT 1
            ) AS p
        WHERE e.location IS NOT NULL
          AND (r.id IS NULL
            OR r.type = 'MANUAL_REJECT')
          AND dist <= 160;
    """

    count_suggestions = pd.read_sql(query, db.connection())

    return count_suggestions['count'].iloc[0].item()


# To avoid duplicate eviction records appearing in the suggestions popup, each suggestion candidate (eviction record) is
#   suggested to its closest cares property
def retrieve_all_suggestions(db: Session):
    query = f"""
        SELECT e."caseID", 
            e."defendantAddress1" AS address, 
            p.id AS id, 
            p."propertyName" AS "propertyName", 
            2 AS verification
        FROM evictions AS e
                 LEFT JOIN "eviction-cares" AS r ON e."caseID" = r."evictionId"
                 CROSS JOIN LATERAL (
            SELECT c.id, c."propertyName", e.location <-> c.location AS dist FROM cares AS c ORDER BY dist LIMIT 1
            ) AS p
        WHERE e.location IS NOT NULL
          AND (r.id IS NULL
            OR r.type = 'MANUAL_REJECT')
          AND dist <= 160;
    """

    suggestions = pd.read_sql(query, db.connection())

    if suggestions.shape[0] == 0:
        return [], 0

    # TODO: Speedup using json_build_object
    cares_grouped_suggestions = suggestions.groupby(['id', 'propertyName'])[
        ['caseID', 'address', 'verification']].apply(
        lambda g: g.to_dict(orient='records')).reset_index(name='suggestions')

    return cares_grouped_suggestions.to_dict(orient='records'), suggestions.shape[0]


def retrieve_all_archived_suggestions(db: Session):
    query = f"""
        SELECT r."caresId"           AS id,
               CASE
                   WHEN r.type = 'MANUAL_MATCH' THEN 0
                   WHEN r.type = 'MANUAL_REJECT' THEN 1
                   END               AS verification,
               e."caseID",
               e."defendantAddress1" AS address,
               c."propertyName" AS "propertyName"
        FROM "eviction-cares" AS r
                 LEFT JOIN evictions AS e ON r."evictionId" = e."caseID"
                 LEFT JOIN cares AS c ON r."caresId" = c.id
        WHERE r.type IN ('MANUAL_MATCH', 'MANUAL_REJECT')
        ORDER BY r.id DESC
    """

    archived_suggestions = pd.read_sql(query, db.connection())

    if archived_suggestions.shape[0] == 0:
        return []

    # TODO: Speedup possible here
    cares_grouped_archived_suggestions = archived_suggestions.groupby(['id', 'propertyName'])[
        ['caseID', 'address', 'verification']].apply(lambda g: g.to_dict(orient='records')).reset_index(
        name='suggestions')

    return cares_grouped_archived_suggestions.to_dict(orient='records')


def get_suggestion_locations(db: Session, caresId: int, caseID: str):
    query = f"""
        SELECT c.id,
            e."caseID",
            ST_AsText(c.location) AS "caresLocation",
            ST_AsText(e.location) AS "evictionLocation"
        FROM cares AS c
        JOIN evictions AS e ON c.id = {caresId} AND e."caseID" = '{caseID}'
    """

    suggestion_metadata = pd.read_sql(query, db.connection())

    if suggestion_metadata.shape[0] != 1:
        raise HTTPException(400, 'Invalid ids provided')

    suggestion_metadata_copy = suggestion_metadata.copy()
    suggestion_metadata_copy['caresLocation'] = suggestion_metadata.apply(
        lambda row: _extract_lon_lat(row['caresLocation']), axis=1)
    suggestion_metadata_copy['evictionLocation'] = suggestion_metadata.apply(
        lambda row: _extract_lon_lat(row['evictionLocation']), axis=1)

    suggestion = suggestion_metadata_copy.iloc[0]

    return suggestion.to_dict()


def confirm_suggestion(db: Session, caresId: int, caseID: str):
    query = f"""
        INSERT INTO "eviction-cares" (type, "evictionId", "caresId") 
        VALUES ('MANUAL_MATCH', '{caseID}', '{caresId}');
    """
    db.execute(text(query))
    db.commit()
    return


def reject_suggestion(db: Session, caresId: int, caseID: str):
    query = f"""
        INSERT INTO "eviction-cares" (type, "evictionId", "caresId")
        VALUES ('MANUAL_REJECT', '{caseID}', '{caresId}');
    """
    db.execute(text(query))
    db.commit()
    return


def undo_suggestion(db: Session, caresId: int, caseID: str):
    query = f"""
        DELETE FROM "eviction-cares"
        WHERE "caresId" = '{caresId}' AND "evictionId" = '{caseID}'
    """
    db.execute(text(query))
    db.commit()
    return
