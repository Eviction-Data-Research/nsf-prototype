from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, String, Text, Date, Double, Integer, Table
from geoalchemy2 import Geography

Base = declarative_base()


class Eviction(Base):
    __tablename__ = 'evictions'
    caseID = Column(String(50), primary_key=True)
    fileDate = Column(Date)
    plaintiff = Column(Text)
    plaintiffAddress = Column(Text)
    plaintiffCity = Column(String(50))
    defendantAddress1 = Column(Text)
    defendantCity1 = Column(Text)
    standardizedAddress = Column(String(255))
    location = Column(Geography(geometry_type='POINT', srid=4326))


class TempEviction(Base):
    __table__ = Table(
        'new-evictions',
        Base.metadata,
        Column('caseID', String(50), primary_key=True),
        Column('fileDate', Date),
        Column('plaintiff', Text),
        Column('plaintiffAddress', Text),
        Column('plaintiffCity', String(50)),
        Column('defendantAddress1', Text),
        Column('defendantCity1', Text),
        Column('standardizedAddress', String(255)),
        Column('location', Geography(geometry_type='POINT', srid=4326)),
        Column('closestCaresDistance', Double),
        prefixes=['TEMPORARY'],
        postgresql_on_commit='DROP'
    )
