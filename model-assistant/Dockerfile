FROM python:3.11-slim-bookworm

ENV PYTHONUNBUFFERED=1
ENV MODELS_ROOT=/models
ENV DATA_DIR=/data
ENV CATALOG_PATH=/app/catalog.json

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY catalog.json .
COPY app ./app
COPY static ./static

RUN mkdir -p /models /data

EXPOSE 8080

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
