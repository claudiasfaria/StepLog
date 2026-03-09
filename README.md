# StepLog — Find Your Spot Before You Arrive

> **Multi-Spot Intelligence Platform** — real-time occupancy monitoring for campuses and enterprise spaces.

---

## What is StepLog?

StepLog is a mobile-first web app that shows **live occupancy data** for spaces like university canteens, libraries, gyms, and corporate offices — so you can decide where to go *before* you get there.

Built for a hackathon demo, it supports multiple institutions with branded experiences, a 3D interactive map, hourly crowd forecasts, and an indoor floor plan viewer.

---

## Features

### 🗺️ Live 3D Map
- Mapbox GL + DeckGL rendered 3D campus/city map with tilt and bearing
- Colour-coded zone circles: 🟢 quiet · 🟡 moderate · 🔴 full
- Custom GeoJSON building with per-room occupancy colours
- Indoor floor plan viewer — zoom in on a building to see live room-level data
- Multi-floor navigation (P0 → P1 → P3 → P4)
- Fly-to animation when selecting a zone

### 📍 Zone Detail Panel
- Real-time occupancy ring with percentage
- Wait time, free spots, and capacity
- **Hourly crowd bars** (7h–23h) with best hour (green) and peak hour (red)
- **Weekly forecast** — tap any day to see predicted occupancy per hour
- 3h sparkline trend preview

### 🏫 Multi-Institution Support

| Institution | Type | Accent |
|---|---|---|
| FCT NOVA | University | Blue `#7BC8FF` |
| Nova SBE | Business School | Amber `#F5A623` |
| Deloitte | Enterprise | Green `#00a332` |
| Accenture | Enterprise | Purple `#7500c0` |
| Lisboa Pública | Public / Guest | Orange `#FFB347` |

### 🔐 Smart Auth
- Email domain detection — institution detected automatically from email
- Guest access for Lisboa public spots (no account needed)
- Admin role detection for entity dashboard

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + TypeScript (Vite) |
| Backend | Python + Flask |
| Map | Mapbox GL JS + DeckGL (ScatterplotLayer) |
| 3D Buildings | Mapbox fill-extrusion + custom GeoJSON |
| Indoor View | SVG floor plan with live occupancy |
| Styling | CSS variables + inline styles |
| Fonts | Syne (display) · DM Sans (body/mono) |
| Data | Mock data with live simulation (8s tick) |

---

## Getting Started

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
flask run
```

O servidor Flask corre em `http://localhost:5000` por defeito.  
O Vite dev server faz proxy automático de `/api/*` para o Flask.

---

## Estrutura do Projecto

```
steplog/
├── public/
│   └── demo-office.geojson       # 3D building GeoJSON (Edifício 4)
├── src/
│   ├── components/
│   │   ├── AuthPage.tsx
│   │   ├── student/
│   │   │   ├── StudentDashboard.tsx
│   │   │   └── ZoneCard.tsx
│   │   ├── public/
│   │   │   ├── PublicDashboard.tsx
│   │   │   ├── Map.tsx               # Mapbox + DeckGL + GeoJSON
│   │   │   ├── FloorPlan.tsx         # SVG indoor floor plan
│   │   │   └── ZoneCard.tsx
│   │   ├── entity/
│   │   │   └── EntityDashboard.tsx
│   │   └── ui/
│   │       ├── OccupancyRing.tsx
│   │       └── Sparkline.tsx
│   ├── data/
│   │   └── mockData.ts
│   ├── lib/
│   │   ├── clients.ts
│   │   ├── occupancy.ts
│   │   ├── hourlyPattern.ts
│   │   └── icons.ts
│   ├── styles/
│   │   └── auth.ts
│   └── types/
│       └── steplog.ts
├── backend/
│   ├── app.py                    # Flask entry point
│   ├── routes/
│   │   ├── zones.py              # GET /api/zones/:campus
│   │   └── occupancy.py          # GET /api/occupancy/:zone_id
│   └── data/
│       └── mock_zones.py         # Mock sensor data
├── requirements.txt
└── README.md
```

---

## Demo Accounts

| Email | Instituição | Role |
|---|---|---|
| `nome@fct.unl.pt` | FCT NOVA | Student |
| `nome@sbe.unl.pt` | Nova SBE | Student |
| `nome@deloitte.pt` | Deloitte | Employee |
| `nome@accenture.pt` | Accenture | Employee |
| *(guest button)* | Lisboa Pública | Guest |

Qualquer password com 4+ caracteres funciona.

---

## Data Model

Todos os dados são simulados para a demo. Em produção, `ZoneData` seria alimentado por:
- **WiFi probes** — contagem de ligações por access point
- **Computer vision** — contagem de pessoas via câmeras no tecto (Raspberry Pi)
- **Calendar APIs** — para salas de reunião e eventos

```ts
interface ZoneData {
  id, name, shortName, category, floor
  capacity, currentOccupancy
  wifiConnections, cvCount
  waitTime, isOpen
  lng, lat          // posição no mapa
  trend             // sparkline de 12 pontos
}
```

---

## Contexto Hackathon

O StepLog demonstra como **dados passivos de sensores** (WiFi + CV) podem ser transformados em inteligência de ocupação accionável — reduzindo deslocações desnecessárias, tempos de espera e fadiga de decisão para estudantes e colaboradores.

A plataforma é **agnóstica à instituição**: qualquer campus ou escritório pode ser integrado adicionando um `CampusConfig`, um conjunto de `ZoneData`, e opcionalmente um ficheiro GeoJSON do edifício.

---

*Built with ☕ for a hackathon. All occupancy data is simulated.*
