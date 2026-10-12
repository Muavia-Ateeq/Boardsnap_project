FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:/usr/local/bin:${PATH}" \
    PORT=7860 \
    VISION_SERVICE_URL=http://127.0.0.1:8000 \
    LLM_SERVICE_URL=http://127.0.0.1:8001 \
    ALLOW_LOCAL_OCR_FALLBACK=false \
    UPLOAD_DIR=/tmp/boardsnap-uploads

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libglib2.0-0 \
        libgomp1 \
        nodejs \
        npm \
        python3-venv \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 1000 user \
    && python -m venv /opt/venv

WORKDIR /home/user/app

COPY vision/requirements-deploy.txt /tmp/vision-requirements.txt
COPY llm/requirements.txt /tmp/llm-requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r /tmp/vision-requirements.txt -r /tmp/llm-requirements.txt

COPY backend/package.json backend/package-lock.json ./backend/
RUN npm ci --omit=dev --prefix backend

COPY --chown=user:user backend ./backend
COPY --chown=user:user vision ./vision
COPY --chown=user:user llm ./llm
COPY --chown=user:user start.sh ./start.sh
RUN chmod +x ./start.sh

USER user
EXPOSE 7860
CMD ["/home/user/app/start.sh"]
