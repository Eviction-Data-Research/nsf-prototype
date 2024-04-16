from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, String, Text, Date, Double, Integer
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
    closestCaresDistance = Column(Double)
    caresId = Column(Integer)

class TempEviction(Base):
    __tablename__ = 'new-evictions'
    __table_args__ = {'prefixes': ['TEMPORARY']}
    caseID = Column(String(50), primary_key=True)
    fileDate = Column(Date)
    plaintiff = Column(Text)
    plaintiffAddress = Column(Text)
    plaintiffCity = Column(String(50))
    defendantAddress1 = Column(Text)
    defendantCity1 = Column(Text)
    standardizedAddress = Column(String(255))
    location = Column(Geography(geometry_type='POINT', srid=4326))
    closestCaresDistance = Column(Double)
    caresId = Column(Integer)
