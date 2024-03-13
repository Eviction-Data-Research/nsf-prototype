FROM continuumio/miniconda

WORKDIR /app

COPY . .

RUN conda env create -f nsf-prototype-server.yml

EXPOSE 8000 

CMD ["conda", "run", "-n", "nsf-prototype-server", "uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]
