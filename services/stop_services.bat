@echo off
TITLE Stopping Texton.ai Infrastructure

ECHO.
ECHO --- Stopping and Removing All Texton.ai Services ---

ECHO 1/3: Stopping Garage S3 Service...
docker-compose -f docker-compose.garage.yml down

ECHO 2/3: Stopping ChromaDB Vector Store...
docker-compose -f docker-compose.chromadb.yml down

ECHO 3/3: Stopping Apache Tika Service...
docker-compose -f docker-compose.tika.yml down

ECHO.
ECHO All containers and temporary networks have been stopped and removed.
ECHO Your persistent data on the D: drive remains intact.
ECHO.
PAUSE