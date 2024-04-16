from fastapi import FastAPI, status, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from src.routers import upload 
from src.routers import cares

origins = [
    # "http://localhost:8080",
    "*"
]
app = FastAPI()

app.include_router(upload.router)
app.include_router(cares.router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/health", status_code = status.HTTP_200_OK)
def health_check():
    return
