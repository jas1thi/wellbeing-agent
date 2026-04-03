# Stage 1: Build frontend
FROM node:22-slim AS frontend
WORKDIR /app/journal-app
COPY journal-app/package.json journal-app/package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY journal-app/ ./
RUN npm run build

# Stage 2: Python backend
FROM python:3.12-slim AS backend
WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Install Python deps
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen

# Copy application code
COPY wellbeing_agent/ wellbeing_agent/
COPY main.py .

# Copy built frontend
COPY --from=frontend /app/journal-app/dist journal-app/dist/

# Copy journal entries + images
COPY journals/ journals/

# Set environment
ENV PYTHONUNBUFFERED=1
ENV JOURNAL_DIR=/app/journals

EXPOSE 8000

CMD ["uv", "run", "python", "main.py"]
