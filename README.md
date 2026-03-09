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


## ⚡ Running the Project

### Frontend
```bash
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### Backend *(optional — the demo works without it)*
```bash
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
flask run
```
The Flask server runs on `http://localhost:5000`. Vite automatically proxies `/api/*` requests.

---

## 🗝️ Mapbox API Key

The token is **hardcoded in `src/components/public/Map.tsx`** — no `.env` file is needed. The 3D map works out of the box.

```ts
// src/components/public/Map.tsx — line ~10
const MAPBOX_TOKEN = "pk.eyJ1IjoiY3NmYXJpYTEzI...";
```

> If the map fails to load, the token may have expired — please contact the team.

---

## 🔐 Demo Accounts

| Email | Institution | View |
|---|---|---|
| `name@fct.unl.pt` | FCT NOVA | University campus |
| `name@sbe.unl.pt` | Nova SBE | Carcavelos campus |
| `name@deloitte.pt` | Deloitte | Lagoas Park office |
| `name@accenture.pt` | Accenture | Lagoas Park office |
| `admin@deloitte.pt` | Deloitte Admin | Management dashboard |
| *(button "Enter as Guest")* | Lisboa Public | Tourist spots |

> Any password with **4+ characters** works.

---

## 🔬 Data Model

In production, data would come from passive sensors:

| Source | Method |
|---|---|
| 📶 WiFi probes | Device count per access point |
| 📷 Computer Vision | Raspberry Pi with ceiling camera |
| 📅 Calendar APIs | Meeting rooms and events |

For this demo, everything is simulated via `mockData.ts` with an 8s tick.

```ts
interface ZoneData {
  id, name, shortName, category, floor
  capacity, currentOccupancy
  wifiConnections, cvCount
  waitTime, isOpen
  lng, lat     // map position
  trend        // 12-point sparkline
}
```

---

## Hackathon Context

StepLog demonstrates how **passive sensor data** (WiFi + CV) can be transformed into actionable occupancy intelligence — reducing unnecessary trips, wait times and decision fatigue for students and employees.

The platform is **institution-agnostic**: any campus or office can be onboarded by adding a `CampusConfig`, a set of `ZoneData` records, and optionally a GeoJSON building file.


---

*Built with ☕ for a hackathon. All occupancy data is simulated.*
