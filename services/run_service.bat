@echo off
ECHO Starting Texton.ai Infrastructure...

ECHO 1/3: Starting Garage S3 Storage...
docker-compose -f docker-compose.garage.yml up -d

ECHO 2/3: Starting ChromaDB Vector Store...
docker-compose -f docker-compose.chromadb.yml up -d

ECHO 3/3: Starting Apache Tika Service...
docker-compose -f docker-compose.tika.yml up -d

ECHO.
ECHO All services are launched. Run 'docker ps' to verify status.
pause