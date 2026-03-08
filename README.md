# StepLog — Find Your Spot Before You Arrive

> **Multi-Spots Intelligence Platform** — real-time occupancy monitoring for campuses and enterprise spaces.

---

## What is StepLog?

StepLog is a mobile-first web app that shows **live occupancy data** for spaces like university canteens, libraries, gyms, and corporate offices — so you can decide where to go *before* you get there.

Built for a hackathon demo, it supports multiple institutions with branded experiences, a 3D interactive map, and hourly crowd forecasts.

---

## Features

### 🗺️ Live 3D Map
- Mapbox GL + DeckGL rendered 3D campus/city map with tilt and bearing
- Colour-coded zone circles: 🟢 quiet · 🟡 moderate · 🔴 full
- Fly-to animation when selecting a zone
- Campus bounds clamping to prevent panning too far

### 📍 Zone Detail Panel
- Real-time occupancy ring with percentage
- Wait time, free spots, and capacity
- **Hourly crowd bars** (7h–23h) with best hour (green) and peak hour (red) highlighted
- **Weekly forecast** — tap any day to see predicted occupancy per hour
- 3h sparkline trend preview

### 🏫 Multi-Institution Support
Each institution gets a fully branded experience (colours, logo, tagline):

| Institution | Type | Accent |
|---|---|---|
| FCT NOVA | University | Blue `#7BC8FF` |
| Nova SBE | Business School | Amber `#F5A623` |
| Deloitte | Enterprise | Green `#86BC25` |
| Accenture | Enterprise | Purple `#A100FF` |
| Lisboa Pública | Public / Guest | Cyan `#7BC8FF` |

### 🔐 Smart Auth
- Email domain detection — type your email and the institution is detected automatically
- Guest access for Lisboa public spots (no account needed)
- Admin role detection for entity dashboard

### 📊 Zone Cards
- Horizontal scroll with compact cards per zone
- Best hour / peak hour badges
- Live pulsing status dot
- Auto-scroll to selected zone

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | React + TypeScript (Vite) |
| Map | Mapbox GL JS + DeckGL (ScatterplotLayer) |
| 3D Buildings | Mapbox fill-extrusion layer |
| Styling | CSS variables + inline styles |
| Fonts | Syne (display) · DM Sans (body/mono) |
| Data | Mock data with live simulation (8s tick) |

---

## Project Structure

```
src/
├── components/
│   ├── AuthPage.tsx          # Login + institution detection
│   ├── student/
│   │   ├── StudentDashboard.tsx   # Campus view (authenticated)
│   │   └── ZoneCard.tsx           # Zone card with hourly pattern
│   ├── public/
│   │   ├── PublicDashboard.tsx    # Lisboa public spots view
│   │   ├── ZoneCard.tsx           # Simplified public card
│   │   └── Map.tsx                # 3D Mapbox + DeckGL map
│   ├── entity/
│   │   └── EntityDashboard.tsx    # Admin/entity view
│   └── ui/
│       ├── OccupancyRing.tsx      # SVG circular progress
│       └── Sparkline.tsx          # SVG trend line
├── data/
│   └── mockData.ts           # All zone data + forecast generator
├── lib/
│   ├── clients.ts            # Campus configs + map configs
│   ├── occupancy.ts          # Colour/label helpers
│   ├── hourlyPattern.ts      # Hourly crowd pattern logic
│   └── icons.ts              # SVG icon paths
├── styles/
│   └── auth.ts               # Auth page CSS string
└── types/
    └── steplog.ts            # TypeScript interfaces
```

---

## Getting Started

```bash
npm install
npm run dev
```

### Demo Accounts

| Email | Institution | Role |
|---|---|---|
| `nome@campus.fct.unl.pt` | FCT NOVA | Student |
| `nome@novasbe.pt` | Nova SBE | Student |
| `nome@deloitte.com` | Deloitte | Employee |
| `nome@accenture.com` | Accenture | Employee |
| *(guest button)* | Lisboa Pública | Guest |

Any password with 4+ characters works.

---

## Data Model

All data is mocked for the hackathon demo. In production, `ZoneData` would be populated via:
- **WiFi probes** — connection counts per access point
- **Computer vision** — people counting via ceiling cameras
- **Calendar APIs** — for meeting room and event spaces

```ts
interface ZoneData {
  id, name, shortName, category, floor
  capacity, currentOccupancy
  wifiConnections, cvCount
  waitTime, isOpen
  lng, lat          // for map placement
  trend             // 12-point sparkline data
}
```

---

## Hackathon Context

StepLog was built to demonstrate how **passive sensor data** (WiFi + CV) can be turned into actionable occupancy intelligence — reducing wasted trips, queue times, and decision fatigue for students and employees.

The platform is **institution-agnostic**: any campus or office can be onboarded by adding a `CampusConfig` entry and a set of `ZoneData` records.

---

*Built with ☕ for a hackathon. All occupancy data is simulated.*