from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Text
from geoalchemy2 import Geography

Base = declarative_base()


class Cares(Base):
    __tablename__ = 'cares'
    id = Column(Integer, primary_key=True)
    source = Column(String)
    propertyName = Column(Text)
    address = Column(Text)
    standardizedAddress = Column(String(255))
    city = Column(String)
    zipCode = Column(Integer)
    location = Column(Geography(geometry_type='POINT', srid=4326))
