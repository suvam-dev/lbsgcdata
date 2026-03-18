from fastapi import APIRouter
from services.data_loader import load_summary

router = APIRouter()


@router.get("/{client_id}/summary")
def get_summary(client_id: str):
    """KPI totals — derived dynamically from channel + monthly CSVs."""
    return load_summary(client_id)


@router.get("/{client_id}/monthly")
def get_monthly(client_id: str):
    from services.data_loader import load_monthly
    data = load_monthly(client_id)
    return {"client": client_id, "data": data}


@router.get("/{client_id}/channels")
def get_channels(client_id: str):
    from services.data_loader import load_channels
    data = load_channels(client_id)
    return {"client": client_id, "data": data}


@router.get("/{client_id}/users")
def get_users(client_id: str):
    from services.data_loader import load_users
    data = load_users(client_id)
    return {"client": client_id, "data": data}


@router.get("/{client_id}/input-types")
def get_input_types(client_id: str):
    from services.data_loader import load_input_types
    data = load_input_types(client_id)
    return {"client": client_id, "data": data}


@router.get("/{client_id}/output-types")
def get_output_types(client_id: str):
    from services.data_loader import load_output_types
    data = load_output_types(client_id)
    return {"client": client_id, "data": data}


@router.get("/{client_id}/language")
def get_language(client_id: str):
    from services.data_loader import load_language
    data = load_language(client_id)
    return {"client": client_id, "data": data}


@router.get("/{client_id}/platforms")
def get_platforms(client_id: str):
    from services.data_loader import load_platforms
    data = load_platforms(client_id)
    return {"client": client_id, **data}


@router.get("/{client_id}/channel-users")
def get_channel_users(client_id: str):
    from services.data_loader import load_channel_users
    data = load_channel_users(client_id)
    return {"client": client_id, "data": data}
