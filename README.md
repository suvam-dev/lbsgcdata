# Frammer Data Analytics Engine

A decoupled, full-stack analytics platform built to ingest, process, and visualize video creation and publishing data.

## 🏗️ Project Architecture

The project is logically structured into three main components:

- **Frontend (`/frontend`)**: A React 18 browser application (bootstrapped with Create React App) that acts as the primary user dashboard. It visualizes all CSV data using Recharts.
- **Backend (`/backend`)**: A fast, stateless Python API built with FastAPI. It dynamically loads, parses, and serves CSV data as JSON via Pandas.
- **Data Storage (`/data_analytics_engine`)**: A strict local directory structure acting as our raw database. The backend automatically discovers new client folders and their respective datasets placed here.

---

## 🚀 Getting Started

To run the full stack locally, you need to spin up both the backend API and the frontend React server.

### 1. Start the Backend API (FastAPI)

Ensure you have Python 3.9+ installed.

```bash
cd backend

# (Optional) Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app:app --reload --port 8000
```

*The API will be available at `http://localhost:8000`. You can test it by visiting `http://localhost:8000/docs` to see the automated Swagger UI.*

### 2. Start the Frontend Dashboard (React)

Make sure you have Node.js (v16+) installed. Open a **new** terminal window:

```bash
cd frontend

# Install dependencies Let it finish downloading
npm install

# Start the development server
npm start
```

*The dashboard will automatically open in your browser at `http://localhost:3000`.*

---

## 📂 The Data Pipeline

The dashboard reflects what is stored inside `data_analytics_engine/clients/`. There is no traditional SQL database.

### Adding New Data

If you want to add a new client (e.g., `client_3`), you simply:

1. Create a folder `data_analytics_engine/clients/client_3`
2. Drop standardized CSV files inside it. Essential files include:
   - `by_channel.csv`
   - `by_user.csv`
   - `monthly_counts.csv`
   - `monthly_durations.csv`
3. As soon as the CSV files are placed in the folder, the API automatically detects them and provisions endpoints dynamically. Reloading the frontend dashboard will instantly show the new client in the drop-downs.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Recharts
- **Backend**: FastAPI, Uvicorn, Pandas
- **Data**: CSV (Local Storage)
