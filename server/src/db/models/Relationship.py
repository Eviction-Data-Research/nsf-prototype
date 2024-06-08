from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Table

Base = declarative_base()

RELATIONSHIP_TYPE = ('ADDRESS_MATCH', 'MANUAL_MATCH', 'MANUAL_REJECT')

RelationshipType = ENUM(*RELATIONSHIP_TYPE, name="relationship_type", create_type=False)


class Relationship(Base):
    __tablename__ = 'eviction-cares'
    id = Column(Integer, primary_key=True, autoincrement=True)
    type = Column(RelationshipType)
    evictionId = Column(String(50), nullable=False)
    caresId = Column(Integer, nullable=False)


class TempRelationship(Base):
    __table__ = Table(
        'new-eviction-cares',
        Base.metadata,
        Column('id', Integer, primary_key=True, autoincrement=True),
        Column('type', RelationshipType, nullable=False),
        Column('evictionId', String(50), nullable=False),
        Column('caresId', Integer, nullable=False),
        prefixes=['TEMPORARY'],
        postgresql_on_commit='DROP',
    )
