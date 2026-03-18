from fastapi import APIRouter
from services.data_loader import list_clients

router = APIRouter()


@router.get("/clients")
def get_clients():
    """List all available client IDs (auto-discovered from data/clients/ folder)."""
    clients = list_clients()
    return {"clients": clients, "count": len(clients)}
