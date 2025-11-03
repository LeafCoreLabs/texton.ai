@echo off
ECHO Starting Texton.ai Infrastructure...

ECHO 1/4: Starting Garage S3 Storage...
docker-compose -f docker-compose.garage.yml up -d

ECHO 2/4: Starting PostgreSQL Database...
docker-compose -f docker-compose.postgres.yml up -d

ECHO 3/4: Starting ChromaDB Vector Store...
docker-compose -f docker-compose.chromadb.yml up -d

ECHO 4/4: Starting ChromaDB Vector Store...
docker-compose -f docker-compose.tika.yml up -d

ECHO.
ECHO All services are launched. Run 'docker ps' to verify status.
pause