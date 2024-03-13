from typing import Union

from fastapi import FastAPI, status

app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/health", status_code = status.HTTP_200_OK)
def health_check():
    print('here')
    return "OK"


