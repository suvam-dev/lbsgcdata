import pandas as pd
from pathlib import Path
from fastapi import HTTPException
import re

# ─── BASE PATH ───────────────────────────────────────────────────────────────
# frammer-api/services/data_loader.py  →  up 2 levels  →  GCCCCCC/data/clients/
DATA_DIR = Path(__file__).parent.parent.parent / "data_analytics_engine" / "clients"

_MONTH_NUM = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}


# ─── HELPERS ─────────────────────────────────────────────────────────────────

def _duration_to_hours(s) -> float:
    """'65:28:28' or '1:05:42' or pandas NaN → float hours."""
    if not s or pd.isna(s):
        return 0.0
    parts = str(s).strip().split(":")
    if len(parts) == 3:
        h, m, sec = int(parts[0]), int(parts[1]), float(parts[2])
        return round(h + m / 60 + sec / 3600, 4)
    return 0.0


def _month_sort_key(s) -> str:
    """'Apr, 2025' → '2025-04' (for sorting)."""
    m = re.match(r"(\w+),?\s*(\d{4})", str(s).strip())
    if m:
        num = _MONTH_NUM.get(m.group(1).lower()[:3], 0)
        return f"{m.group(2)}-{num:02d}"
    return str(s)


def _month_label(s) -> str:
    """'Apr, 2025' → "Apr '25" (for display)."""
    m = re.match(r"(\w+),?\s*(\d{4})", str(s).strip())
    if m:
        return f"{m.group(1)[:3].capitalize()} '{m.group(2)[2:]}"
    return str(s)


def _safe_int(v):
    try:
        return int(v)
    except (ValueError, TypeError):
        return 0


def _get_client_dir(client_id: str) -> Path:
    # Security: prevent path traversal
    if ".." in client_id or "/" in client_id or "\\" in client_id:
        raise HTTPException(status_code=400, detail="Invalid client ID")
    path = DATA_DIR / client_id
    if not path.exists() or not path.is_dir():
        raise HTTPException(status_code=404, detail=f"Client '{client_id}' not found")
    return path


def _require_file(client_dir: Path, filename: str) -> Path:
    p = client_dir / filename
    if not p.exists():
        raise HTTPException(status_code=404, detail=f"Data file '{filename}' not found for this client")
    return p


def _add_publish_rate(df: pd.DataFrame) -> pd.DataFrame:
    if "published" in df.columns and "created" in df.columns:
        df["publish_rate_pct"] = df.apply(
            lambda r: round(r["published"] / r["created"] * 100, 2) if r["created"] > 0 else 0.0,
            axis=1,
        )
    return df


# ─── PUBLIC API ──────────────────────────────────────────────────────────────

def list_clients() -> list[str]:
    """Return all client folder names under data/clients/."""
    if not DATA_DIR.exists():
        return []
    return sorted(d.name for d in DATA_DIR.iterdir() if d.is_dir())


def load_monthly(client_id: str) -> list[dict]:
    d = _get_client_dir(client_id)
    counts = pd.read_csv(_require_file(d, "monthly_counts.csv"))
    durations = pd.read_csv(_require_file(d, "monthly_durations.csv"))

    counts.columns = counts.columns.str.strip()
    durations.columns = durations.columns.str.strip()

    # Use first column as month in both
    month_col_c = counts.columns[0]
    month_col_dur = durations.columns[0]

    counts["_key"] = counts[month_col_c].apply(_month_sort_key)
    counts["month"] = counts[month_col_c].apply(_month_label)
    durations["_key"] = durations[month_col_dur].apply(_month_sort_key)

    # Parse duration columns to float hours
    for col in durations.columns:
        if col not in ("_key", month_col_dur):
            durations[col] = durations[col].apply(_duration_to_hours)

    merged = counts.merge(
        durations.drop(columns=[month_col_dur]), on="_key", how="left"
    ).sort_values("_key").drop(columns=["_key", month_col_c])

    merged = merged.rename(columns={
        "Total Uploaded": "uploaded",
        "Total Created": "created",
        "Total Published": "published",
        "Total Uploaded Duration": "uploaded_hrs",
        "Total Created Duration": "created_hrs",
        "Total Published Duration": "published_hrs",
    })

    # Ensure numeric types
    for col in ("uploaded", "created", "published"):
        if col in merged.columns:
            merged[col] = pd.to_numeric(merged[col], errors="coerce").fillna(0).astype(int)

    merged = _add_publish_rate(merged)
    return merged.to_dict(orient="records")


def _load_standard(client_id: str, filename: str, id_col_rename: str) -> list[dict]:
    """
    Generic loader for CSVs with shape:
      <ID col>, Uploaded Count, Created Count, Published Count,
      Uploaded Duration (hh:mm:ss), Created Duration (hh:mm:ss), Published Duration (hh:mm:ss)
    Any extra columns added to the CSV will pass through automatically.
    """
    d = _get_client_dir(client_id)
    df = pd.read_csv(_require_file(d, filename))
    df.columns = df.columns.str.strip()

    # First column is the identifier — rename dynamically
    first_col = df.columns[0]
    df = df.rename(columns={first_col: id_col_rename})

    # Parse all duration columns
    for col in df.columns:
        if "Duration" in col or "duration" in col:
            df[col] = df[col].apply(_duration_to_hours)

    # Standardize well-known column names (case-insensitive-ish)
    rename_map = {
        "Uploaded Count": "uploaded",
        "Created Count": "created",
        "Published Count": "published",
        "Uploaded Duration (hh:mm:ss)": "uploaded_hrs",
        "Created Duration (hh:mm:ss)": "created_hrs",
        "Published Duration (hh:mm:ss)": "published_hrs",
    }
    df = df.rename(columns={k: v for k, v in rename_map.items() if k in df.columns})

    # Ensure integer counts (CSV sometimes stores them as quoted strings)
    for col in ("uploaded", "created", "published"):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)

    df = _add_publish_rate(df)
    return df.to_dict(orient="records")


def load_channels(client_id: str) -> list[dict]:
    return _load_standard(client_id, "by_channel.csv", "channel")


def load_users(client_id: str) -> list[dict]:
    return _load_standard(client_id, "by_user.csv", "user")


def load_input_types(client_id: str) -> list[dict]:
    return _load_standard(client_id, "by_input_type.csv", "type")


def load_output_types(client_id: str) -> list[dict]:
    return _load_standard(client_id, "by_output_type.csv", "type")


def load_language(client_id: str) -> list[dict]:
    return _load_standard(client_id, "by_language.csv", "language")


def load_channel_users(client_id: str) -> list[dict]:
    d = _get_client_dir(client_id)
    df = pd.read_csv(_require_file(d, "by_channel_user.csv"))
    df.columns = df.columns.str.strip()

    for col in df.columns:
        if "Duration" in col or "duration" in col:
            df[col] = df[col].apply(_duration_to_hours)

    df = df.rename(columns={
        df.columns[0]: "channel",
        df.columns[1]: "user",
        "Uploaded Count": "uploaded",
        "Created Count": "created",
        "Published Count": "published",
        "Uploaded Duration (hh:mm:ss)": "uploaded_hrs",
        "Created Duration (hh:mm:ss)": "created_hrs",
        "Published Duration (hh:mm:ss)": "published_hrs",
    })

    for col in ("uploaded", "created", "published"):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)

    df = _add_publish_rate(df)
    return df.to_dict(orient="records")


def load_platforms(client_id: str) -> dict:
    d = _get_client_dir(client_id)
    counts = pd.read_csv(_require_file(d, "channel_platform_counts.csv"))
    durations = pd.read_csv(_require_file(d, "channel_platform_durations.csv"))

    counts.columns = counts.columns.str.strip()
    durations.columns = durations.columns.str.strip()

    channel_col_c = counts.columns[0]
    channel_col_d = durations.columns[0]
    counts = counts.rename(columns={channel_col_c: "channel"})
    durations = durations.rename(columns={channel_col_d: "channel"})

    # Parse durations
    for col in durations.columns:
        if col != "channel":
            durations[col] = durations[col].apply(_duration_to_hours)

    # Ensure counts are integers
    platform_cols = [c for c in counts.columns if c != "channel"]
    for col in platform_cols:
        counts[col] = pd.to_numeric(counts[col], errors="coerce").fillna(0).astype(int)

    # Platform totals (sum across all channels)
    platform_totals = {p: int(counts[p].sum()) for p in platform_cols}

    return {
        "platforms": platform_cols,
        "platform_totals": platform_totals,
        "by_channel": counts.to_dict(orient="records"),
        "by_channel_durations": durations.to_dict(orient="records"),
    }


def load_summary(client_id: str) -> dict:
    channels = load_channels(client_id)
    monthly = load_monthly(client_id)

    total_uploaded = sum(c.get("uploaded", 0) for c in channels)
    total_created = sum(c.get("created", 0) for c in channels)
    total_published = sum(c.get("published", 0) for c in channels)
    total_uploaded_hrs = round(sum(c.get("uploaded_hrs", 0) for c in channels), 2)
    total_created_hrs = round(sum(c.get("created_hrs", 0) for c in channels), 2)
    total_published_hrs = round(sum(c.get("published_hrs", 0) for c in channels), 2)

    # Derive period from monthly data (already sorted chronologically)
    months = [m["month"] for m in monthly]
    period = f"{months[0]} – {months[-1]}" if len(months) >= 2 else (months[0] if months else "")

    # Best publish month
    best_month = max(monthly, key=lambda m: m.get("published", 0), default={})

    # Zero-publish months
    zero_publish_months = [m["month"] for m in monthly if m.get("published", 0) == 0]

    return {
        "client": client_id,
        "period": period,
        "total_uploaded": total_uploaded,
        "total_created": total_created,
        "total_published": total_published,
        "total_uploaded_hrs": total_uploaded_hrs,
        "total_created_hrs": total_created_hrs,
        "total_published_hrs": total_published_hrs,
        "overall_publish_rate_pct": round(total_published / total_created * 100, 2) if total_created > 0 else 0.0,
        "channel_count": len(channels),
        "month_count": len(monthly),
        "peak_upload_month": max(monthly, key=lambda m: m.get("uploaded", 0), default={}).get("month", ""),
        "peak_upload_count": max((m.get("uploaded", 0) for m in monthly), default=0),
        "peak_publish_month": best_month.get("month", ""),
        "peak_publish_count": best_month.get("published", 0),
        "zero_publish_months": zero_publish_months,
        "zero_publish_month_count": len(zero_publish_months),
    }
