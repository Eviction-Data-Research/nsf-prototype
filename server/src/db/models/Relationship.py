from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Table, UniqueConstraint

Base = declarative_base()

RELATIONSHIP_TYPE = ('ADDRESS_MATCH', 'MANUAL_MATCH', 'MANUAL_REJECT')

RelationshipType = ENUM(*RELATIONSHIP_TYPE, name="relationship_type", create_type=False)


class Relationship(Base):
    __table__ = Table(
        'eviction-cares',
        Base.metadata,
        Column('id', Integer, primary_key=True, autoincrement=True),
        Column('type', RelationshipType),
        Column('evictionId', String(50), nullable=False),
        Column('caresId', Integer, nullable=False),
        UniqueConstraint('evictionId', 'caresId')
    )


class TempRelationship(Base):
    __table__ = Table(
        'new-eviction-cares',
        Base.metadata,
        Column('id', Integer, primary_key=True, autoincrement=True),
        Column('type', RelationshipType, nullable=False),
        Column('evictionId', String(50), nullable=False),
        Column('caresId', Integer, nullable=False),
        UniqueConstraint('evictionId', 'caresId'),
        prefixes=['TEMPORARY'],
        postgresql_on_commit='DROP',
    )
