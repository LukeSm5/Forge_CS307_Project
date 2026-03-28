kill -9 $(lsof -ti :8000)
python3 -m uvicorn app.fast_api.api:app --reload --host 0.0.0.0 --port 8000