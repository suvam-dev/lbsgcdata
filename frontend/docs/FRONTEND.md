# Frammer AI Dashboard — Frontend Documentation

## Overview

The Frammer AI Dashboard is a single-page React application that provides analytics for video production pipelines. It connects to a FastAPI backend running at `http://localhost:8000/api` and optionally to the Groq LLM API for natural language data queries.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 (Create React App) |
| Styling | CSS Modules + CSS custom properties |
| Charts | Recharts |
| LLM API | Groq (`llama-3.3-70b-versatile`) |
| Icons | Unicode emoji (no external icon library) |
| Fonts | Inter, JetBrains Mono (Google Fonts) |

---

## Directory Structure

```
frontend/src/
├── api/
│   └── groq.js              # Groq API calls + local knowledge-base fallback
├── components/
│   ├── CustomTooltip.js     # Shared Recharts tooltip
│   ├── CustomTooltip.module.css
│   ├── ErrorBoundary.js     # React error boundary class component
│   ├── ErrorBoundary.module.css
│   ├── KpiCard.js           # Metric card with label/value/badge/subtext
│   ├── KpiCard.module.css
│   ├── SectionTitle.js      # Section heading with optional subtitle
│   ├── SectionTitle.module.css
│   ├── Skeleton.js          # Shimmer skeleton loaders for loading state
│   └── Skeleton.module.css
├── context/
│   ├── DataContext.js       # Global data provider + API orchestration
│   └── DataContext.module.css
├── pages/
│   ├── ChannelAnalysis.js   # Channel-level bar chart + publish rate list
│   ├── ChannelAnalysis.module.css
│   ├── ExecSummary.js       # Executive summary (funnel, KPIs, language breakdown)
│   ├── ExecSummary.module.css
│   ├── NLQInterface.js      # Ask the Data — LLM-powered query interface
│   ├── NLQInterface.module.css
│   ├── TypeMixFunnel.js     # Output/input type breakdown + publish funnel
│   ├── TypeMixFunnel.module.css
│   ├── UsageTrends.js       # Monthly area charts + publish rate trend
│   ├── UsageTrends.module.css
│   ├── VideoExplorer.js     # Filterable video list (search/sort/filter)
│   └── VideoExplorer.module.css
├── utils/
│   ├── constants.js         # COLORS array + CHART semantic constants
│   └── formatters.js        # fmt() number formatter
├── App.js                   # Root layout: header, nav, tab routing
├── App.module.css           # App shell styles + responsive hamburger
├── index.css                # Global CSS custom properties / design tokens
└── index.js                 # React DOM entry point
```

---

## Design System

All visual tokens are defined as CSS custom properties in `index.css` and are available globally. Do not hardcode colors or spacing in component CSS — always reference a token.

### Primary Brand Color

```css
--theme-primary: #00d4ff;
--theme-primary-rgb: 0, 212, 255;
```

To change the brand color across the entire app, update only these two variables in `index.css`.

### Key Color Tokens

| Token | Default | Purpose |
|---|---|---|
| `--color-bg-base` | `#06060e` | Page background |
| `--color-bg-surface` | `#0d0d1a` | Card/surface background |
| `--color-text-primary` | `#f0f0ff` | Main text |
| `--color-text-secondary` | `#9090b0` | Labels, subtitles |
| `--color-text-tertiary` | `#4a4a5e` | Muted text, axis labels |
| `--color-accent-cyan` | `#00d4ff` | Primary accent |
| `--color-accent-purple` | `#8b5cf6` | Secondary accent |
| `--color-accent-green` | `#34d399` | Success / published |
| `--glass-bg` | `rgba(255,255,255,0.03)` | Glass card background |
| `--glass-border` | `rgba(255,255,255,0.06)` | Glass card border |

### Spacing Scale

```
--space-xs: 4px   --space-sm: 8px   --space-md: 16px
--space-lg: 24px  --space-xl: 32px  --space-2xl: 48px
--content-padding: clamp(16px, 2vw, 32px)
```

### Breakpoints

| Breakpoint | Behavior |
|---|---|
| `≤1100px` | Nav labels shrink, chart grids collapse |
| `≤850px` | Hamburger nav, sidebar collapses |
| `≤480px` | Single-column KPI grid, angled chart labels |

---

## Data Flow

```
App.js
  └── DataProvider (DataContext.js)
        └── useEffect: 8 parallel API fetches
              ↓
        Normalizes field names (uploaded_hrs → uploadedHrs)
        Generates synthetic `videos[]` for VideoExplorer
              ↓
        DataContext.Provider provides data to all children
              ↓
        Individual pages consume via useData()
```

### API Endpoints Fetched

All relative to `http://localhost:8000/api/{clientId}`:

| Endpoint | Data |
|---|---|
| `/summary` | Aggregate totals (uploaded, created, published, hours) |
| `/monthly` | Per-month breakdown |
| `/channels` | Per-channel breakdown |
| `/users` | Per-user breakdown |
| `/input-types` | Upload content category breakdown |
| `/output-types` | AI-created output format breakdown |
| `/language` | Language distribution |
| `/platforms` | Publish platform distribution |

### Client Selection

The active client ID is stored in local state in `App.js` and passed as a prop to `DataProvider`. Changing the client triggers a full re-fetch of all 8 endpoints.

---

## Components

### `KpiCard`

```jsx
<KpiCard
  label="Total Uploaded"
  value="4,453"
  sub="807 hours of content"
  color={CHART.uploaded}
  badge="FY2025–26"
/>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | string | — | Card heading |
| `value` | string \| number | — | Large display value |
| `sub` | string | — | Subtext below value |
| `color` | string | `var(--theme-primary)` | Accent color for left border + value |
| `badge` | string | — | Optional pill badge in top-right |

### `SectionTitle`

```jsx
<SectionTitle sub="Monthly video counts">Funnel: Upload → Create → Publish</SectionTitle>
```

| Prop | Type | Description |
|---|---|---|
| `sub` | string | Muted subtitle under the heading |
| `children` | ReactNode | Main title text |

### `CustomTooltip`

Drop-in Recharts tooltip. Pass as `content={<CustomTooltip />}` to any Recharts chart element. Automatically formats the payload with the series name and value.

### `ErrorBoundary`

Class component. Wraps `DataProvider` in `App.js`. Catches any unhandled JS errors from any page or component and displays a "Something went wrong" screen with a Reload button instead of a blank white screen.

### `Skeleton` / `SkeletonDashboard`

`SkeletonBlock` renders a single shimmer rectangle. `SkeletonDashboard` renders a full shimmer layout approximating the Executive Summary dashboard structure.

Used by `DataContext.js` — when `loading === true`, `<SkeletonDashboard />` is rendered in place of the actual page content.

---

## Pages

### Executive Summary (`ExecSummary.js`)

- **Alert Banner**: Warns if publish rate falls below a threshold
- **KPI Row**: Total Uploaded, Created, Published, Publish Rate
- **Chart Grid**: Monthly funnel area chart + Channel performance bar chart
- **Bottom Row**: Top Output Types list, Top Platform distribution bars, Language Breakdown donut

### Usage & Trends (`UsageTrends.js`)

- **Mode Toggle**: Switch between video count and duration (hours) views
- **Main Area Chart**: Monthly Created / Uploaded / Published trends
- **Small Charts**: Publish Rate % over time (line) + Output Multiplier per month (bar)

### Channel Analysis (`ChannelAnalysis.js`)

- **KPI Row**: Active Channels, Publishing Channels, Never-Published count (⚠ badge), Top Channel
- **Sort Toggle**: Sort bar chart by Uploaded / Created / Published
- **Bar Chart**: Top 10 channels with 3-bar series
- **List**: Publish rate per channel with color-coded progress bars
- **Cross-table**: Channel × Platform publishing grid

### Type Mix & Funnel (`TypeMixFunnel.js`)

- **Output Type Funnel**: Horizontal bar chart (created vs published per output format)
- **Input Type Distribution**: Horizontal bar chart (uploaded vs published per input category)
- **3-Column Grid**: Output type publish rates, Input type publish rates, Platform distribution bars

### Video Explorer (`VideoExplorer.js`)

- **Sidebar**: Search by title, filter by channel, output type, publish status
- **Sort**: Newest First, Duration High→Low, Duration Low→High
- **List**: Paginated video cards with duration, channel, type, and publish status badges

> Note: The video list is synthetically generated from channels + output types data in `DataContext.js` since no `/videos` API endpoint exists yet. Each channel × output type combination generates up to 3 sample entries.

### Query Engine / Ask the Data (`NLQInterface.js`)

- **Primary path**: Calls Groq `llama-3.3-70b-versatile` with a data-rich system prompt built from the full dataset
- **Fallback path**: If `REACT_APP_GROQ_API_KEY` is absent, keyword-matches the question against a local hardcoded knowledge base (`NLQ_KB` in `groq.js`)
- **Chat history**: Maintains conversation turn history for multi-turn queries
- **Suggestion pills**: Four pre-written example queries to help users get started

---

## Theming

### Chart Colors (CHART constants)

All chart elements must use the semantic constants from `utils/constants.js`, never raw hex values:

```js
import { CHART, COLORS } from "../utils/constants";

CHART.created    // #00d4ff — cyan
CHART.uploaded   // #8b5cf6 — purple
CHART.published  // #34d399 — green
CHART.warn       // #fbbf24 — amber
CHART.danger     // #f87171 — red
CHART.muted      // #4a4a5e — grey
CHART.gridLine   // rgba(255,255,255,0.04)
CHART.axisText   // #4a4a5e
```

`COLORS[]` is a 10-color palette array used for pie/donut charts and multi-series without semantic meaning.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `REACT_APP_GROQ_API_KEY` | Optional | Enables live LLM queries. Without it, the Query Engine falls back to the local knowledge base |

Create a `.env` file in the `frontend/` directory:

```
REACT_APP_GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxx
```

Then restart the dev server (`npm start`) for it to take effect.

---

## Running Locally

```bash
# Install dependencies
cd frontend && npm install

# Start dev server (hot reload)
npm start

# Production build
npm run build
```

The frontend expects the backend at `http://localhost:8000`. Start the backend first:

```bash
cd backend && uvicorn app:app --reload --port 8000
```

---

## Build Output

Production bundle size (gzip):

| File | Size |
|---|---|
| `main.js` | ~162 KB |
| `main.css` | ~6.4 KB |
| `chunk.js` | ~1.8 KB |
