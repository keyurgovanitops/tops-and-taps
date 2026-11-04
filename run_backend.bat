@echo off
echo Starting HomeServe FastAPI Backend on port 8000...
.\backend\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
pause

