import pandas as pd
from sqlalchemy.orm import Session
import uuid


def get_all_evictions_file(db: Session):
    query = f"""
        SELECT e."caseID",
            e."fileDate",
            e.plaintiff,
            e."plaintiffAddress",
            e."plaintiffCity",
            e."defendantAddress1" AS "defendantAddress",
            e."defendantCity1" AS "defendantCity"
        FROM evictions AS e 
    """

    filename = f"./tmp/evictions_{str(uuid.uuid4())}.csv"

    property_evictions = pd.read_sql(query, db.connection())

    property_evictions.to_csv(filename, index=False)
    del property_evictions
    return filename


def get_cares_property_eviction_file(db: Session, id: int):
    query = f"""
        SELECT e."caseID",
            e."fileDate",
            e.plaintiff,
            e."plaintiffAddress",
            e."plaintiffCity",
            e."defendantAddress1" AS "defendantAddress",
            e."defendantCity1" AS "defendantCity"
        FROM evictions AS e 
        LEFT JOIN "eviction-cares" AS r 
            ON e."caseID" = r."evictionId" 
        LEFT JOIN cares AS c
            ON c.id = r."caresId"
        WHERE c.id = {id} 
            AND r.type IN ('ADDRESS_MATCH', 'MANUAL_MATCH')
    """

    filename = f"./tmp/{str(id)}_{str(uuid.uuid4())}.csv"

    property_evictions = pd.read_sql(query, db.connection())

    property_evictions.to_csv(filename, index=False)
    del property_evictions
    return filename


def get_cares_property_address_permutations_file(db: Session, id: int):
    query = f"""
        SELECT CONCAT(e."defendantAddress1", ', ', e."defendantCity1") AS address 
        FROM evictions AS e 
        LEFT JOIN "eviction-cares" AS r 
            ON e."caseID" = r."evictionId"
        WHERE r."caresId" = {id} 
            AND r.type IN ('ADDRESS_MATCH', 'MANUAL_MATCH');
    """

    filename = f"./tmp/{str(id)}_addresses_{str(uuid.uuid4())}.csv"

    address_permutations = pd.read_sql(query, db.connection())

    address_permutations.to_csv(filename, index=False)
    del address_permutations
    return filename
