FROM python:3.10

WORKDIR /app

COPY ./requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir -r /app/requirements.txt

COPY . /app

EXPOSE 8443

CMD ["uvicorn", "src.main:app", "--workers", "5", "--host", "0.0.0.0", "--port", "8443"]
