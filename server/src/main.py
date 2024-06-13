from contextlib import asynccontextmanager

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from src.db.db import engine
from src.db.models.Eviction import Eviction
from src.db.models.Relationship import Relationship
from src.routers import upload, cares, suggestion, export, eviction

import ssl

origins = [
    "http://localhost:8080",
    "*"
]

#
# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     with Session(bind=engine) as session:  # Synchronous session context
#         Eviction.__table__.create(session.bind, checkfirst=True)
#         Relationship.__table__.create(session.bind, checkfirst=True)
#
#     yield


app = FastAPI()

ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ssl_context.load_cert_chain(certfile='./cert.pem', keyfile='./key.pem')

app.include_router(upload.router)
app.include_router(cares.router)
app.include_router(suggestion.router)
app.include_router(export.router)
app.include_router(eviction.router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    return
