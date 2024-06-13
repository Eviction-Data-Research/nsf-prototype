FROM python:3.10

WORKDIR /app

COPY ./requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir -r /app/requirements.txt

COPY . /app

EXPOSE 8443

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8443", "--ssl-keyfile", "./key.pem", "--ssl-certfile", "./cert.pem"]
