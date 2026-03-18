from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import clients, analytics

app = FastAPI(
    title="Frammer Analytics API",
    description="Dynamic analytics API — reads CSV data per client and returns JSON. Add a new client folder under data/clients/ and all endpoints become available automatically.",
    version="1.0.0",
)

# Allow requests from the React dashboard (localhost:3000/3001) and any future frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://frontend-rosy-eight-27.vercel.app",
    ],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

# ─── ROUTERS ─────────────────────────────────────────────────────────────────
app.include_router(clients.router, prefix="/api", tags=["Clients"])
app.include_router(analytics.router, prefix="/api", tags=["Analytics"])


# ─── HEALTH ──────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "status": "ok",
        "docs": "/docs",
        "available_endpoints": [
            "GET /api/clients",
            "GET /api/{client_id}/summary",
            "GET /api/{client_id}/monthly",
            "GET /api/{client_id}/channels",
            "GET /api/{client_id}/users",
            "GET /api/{client_id}/input-types",
            "GET /api/{client_id}/output-types",
            "GET /api/{client_id}/language",
            "GET /api/{client_id}/platforms",
            "GET /api/{client_id}/channel-users",
        ],
    }
