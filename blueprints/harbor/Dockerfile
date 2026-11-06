# syntax=docker/dockerfile:1
ARG PREPARE_IMAGE=goharbor/prepare:v2.15.4@sha256:79b5614d0d02b5d2c6c9b7b9755f5caaea882797353bfcb6421f77e6d69cc317
FROM ${PREPARE_IMAGE} AS runtime
USER root
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY harbor/common.py harbor/initialize.py /app/
COPY images.lock.json /app/images.lock.json
COPY vendor/harbor.yml.tmpl /app/harbor.yml.tmpl
ENTRYPOINT ["python3", "/app/initialize.py"]

FROM runtime AS test
COPY tests /tests
RUN python3 -m unittest discover -s /tests -v
