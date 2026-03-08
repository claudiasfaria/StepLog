import { ZoneData } from "@/types/steplog";

export const CATEGORY_EMOJI: Record<string, string> = {
  food:    "🍽️",
  study:   "📚",
  sport:   "⚽",
  service: "🏛️",
  outdoor: "🌿",
  meeting: "💼",
  lab:     "🔬",
  health:  "🏥",
};

function generateTrend(base: number) {
  return Array.from({ length: 12 }, (_, i) => ({
    time: `${i * 15}m`,
    predicted: Math.min(100, Math.max(5, base + (Math.random() - 0.5) * 20 + Math.sin(i / 3) * 10)),
  }));
}

// ── FCT NOVA (Caparica) ─────────────────────────────────────────────────────
export const FCT_ZONES: ZoneData[] = [
  // Cantina Central — edifício da Cantina, zona sul-central
  { id: "canteen",     name: "Cantina Central",     shortName: "Cantina",   category: "food",    floor: "Ground",  capacity: 280, currentOccupancy: 210, wifiConnections: 523, cvCount: 195, waitTime: 12, isOpen: true,  historicalPeak: 650, coordinates: { x: 22, y: 68, radius: 14 }, lng: -9.2047, lat: 38.6616, trend: generateTrend(75) },
  // Biblioteca Central — edifício norte, 3 pisos
  { id: "library",     name: "Biblioteca Central",  shortName: "Biblioteca",category: "study",   floor: "1F–3F",   capacity: 400, currentOccupancy: 140, wifiConnections: 280, cvCount: 130, waitTime:  0, isOpen: true,  historicalPeak: 800, coordinates: { x: 71, y: 30, radius: 16 }, lng: -9.2053, lat: 38.6626, trend: generateTrend(35) },
  // Bar "Tanto Faz" — Associação de Estudantes, Hangar I
  { id: "tanto-faz-bar",  name: "Tanto Faz Academic Bar",     shortName: "Tanto Faz",category: "food",   floor: "Ground",  capacity:  80, currentOccupancy:  62, wifiConnections: 50, cvCount:  20, waitTime:  5, isOpen: true,  historicalPeak: 50, coordinates: { x: 16, y: 40, radius:  9 }, lng: -9.2066, lat: 38.6614, trend: generateTrend(78) },
   // Pavilhão Desportivo Gil Eanes — ala sul do campus
  { id: "sports",      name: "Rackets Pro Nova",      shortName: "Desporto",  category: "sport",   floor: "Sul",     capacity: 200, currentOccupancy:  45, wifiConnections:  90, cvCount:  42, waitTime:  0, isOpen: true,  historicalPeak: 400, coordinates: { x: 76, y: 72, radius: 12 }, lng: -9.2047, lat: 38.6584, trend: generateTrend(22) },
  // Serviços Académicos — Edifício I, entrada principal
  { id: "admin",       name: "Serv. Académicos",    shortName: "SA",        category: "service", floor: "1F",      capacity:  30, currentOccupancy:  24, wifiConnections:  48, cvCount:  22, waitTime: 15, isOpen: true,  historicalPeak:  60, coordinates: { x: 50, y: 18, radius:  7 }, lng: -9.2059, lat: 38.6623, trend: generateTrend(80) },
  ];

// ── Nova SBE (Carcavelos) ───────────────────────────────────────────────────
const SBE_ZONES: ZoneData[] = [
  // Cantina — Hovione Atrium, preços sociais
  { id: "sbe-canteen",  name: "Cantina SBE",          shortName: "Cantina",  category: "food",    floor: "Ground",   capacity: 200, currentOccupancy: 145, wifiConnections: 380, cvCount: 135, waitTime:  8, isOpen: true, historicalPeak: 380, coordinates: { x: 35, y: 55, radius: 13 }, lng: -9.3264, lat: 38.6781, trend: generateTrend(72) },
// Biblioteca — The Navigator building
  { id: "sbe-lib",      name: "Biblioteca SBE",       shortName: "Biblioteca",category: "study",  floor: "1F–2F",    capacity: 350, currentOccupancy: 120, wifiConnections: 240, cvCount: 110, waitTime:  0, isOpen: true, historicalPeak: 600, coordinates: { x: 65, y: 25, radius: 14 }, lng: -9.325339, lat: 38.6786, trend: generateTrend(34) }, 
  { id: "clinica-cuf",      name: "Clínica CUF",   shortName: "cuf",       category: "health",  floor: "Ground",   capacity:  80, currentOccupancy:  28, wifiConnections: 110, cvCount:  26, waitTime:  0, isOpen: true, historicalPeak: 140, coordinates: { x: 70, y: 65, radius:  9 }, lng: -9.32573, lat: 38.679099, trend: generateTrend(35) }
];

// ── Lagoas Park — infraestruturas partilhadas ───────────────────────────────
// Deloitte está no Edifício 4, Accenture no Edifício 10

// ── Deloitte (Edifício 4, Lagoas Park) ─────────────────────────────────────
const DELOITTE_ZONES: ZoneData[] = [
  // Restaurante interno Edifício 4 — cantina de empresa
  { id: "dl-canteen",  name: "Cantina Edifício 4",   shortName: "Cantina",   category: "food",    floor: "Ground",  capacity: 180, currentOccupancy: 130, wifiConnections: 360, cvCount: 120, waitTime:  7, isOpen: true, historicalPeak: 300, coordinates: { x: 30, y: 65, radius: 12 }, lng: -9.3082, lat: 38.71465, trend: generateTrend(72) },
  // Solinca Health Club — partilhado Lagoas Park, Edifício Lt 6
  { id: "dl-gym",      name: "Solinca Health Club",  shortName: "Solinca",   category: "sport",   floor: "Ground",  capacity: 150, currentOccupancy:  55, wifiConnections: 130, cvCount:  50, waitTime:  0, isOpen: true, historicalPeak: 250, coordinates: { x: 55, y: 70, radius: 11 }, lng: -9.3081, lat: 38.7145, trend: generateTrend(37) },
  // Centro de Congressos — auditório 600 pessoas + salas de reunião
  { id: "dl-congress", name: "Centro de Congressos", shortName: "Congressos",category: "service", floor: "Ground",  capacity: 600, currentOccupancy: 120, wifiConnections: 300, cvCount: 110, waitTime:  0, isOpen: true, historicalPeak: 900, coordinates: { x: 60, y: 30, radius: 14 }, lng: -9.3094, lat: 38.7152, trend: generateTrend(20) },
  // Innovation Lab — Edifício 4, piso 3
  { id: "dl-lab",      name: "Innovation Lab",       shortName: "iLab",      category: "service", floor: "3F",      capacity:  50, currentOccupancy:  28, wifiConnections:  90, cvCount:  25, waitTime:  0, isOpen: true, historicalPeak:  80, coordinates: { x: 50, y: 45, radius:  8 }, lng: -9.3082, lat: 38.7145, trend: generateTrend(56) },
];

// ── Accenture (Edifício 10, Lagoas Park) ────────────────────────────────────
const ACCENTURE_ZONES: ZoneData[] = [
  // Cantina Edifício 10
  { id: "ac-canteen",  name: "Cantina Edifício 10",  shortName: "Cantina",   category: "food",    floor: "Ground",  capacity: 140, currentOccupancy:  95, wifiConnections: 275, cvCount:  88, waitTime:  4, isOpen: true, historicalPeak: 240, coordinates: { x: 28, y: 68, radius: 11 }, lng: -9.3109, lat: 38.7129, trend: generateTrend(68) },
  // Solinca Health Club — partilhado Lagoas Park
  { id: "ac-gym",      name: "Solinca Health Club",  shortName: "Solinca",   category: "sport",   floor: "Ground",  capacity: 150, currentOccupancy:  40, wifiConnections: 120, cvCount:  38, waitTime:  0, isOpen: true, historicalPeak: 250, coordinates: { x: 55, y: 70, radius: 11 }, lng: -9.3088, lat: 38.7141, trend: generateTrend(27) },
 // Open Floor colaborativo — piso 2
  { id: "ac-open",     name: "Open Floor",           shortName: "Open",      category: "study",   floor: "2F",      capacity: 180, currentOccupancy: 135, wifiConnections: 270, cvCount: 125, waitTime:  0, isOpen: true, historicalPeak: 300, coordinates: { x: 50, y: 50, radius: 12 }, lng: -9.3102, lat: 38.7131, trend: generateTrend(75) },
];

// ── Lisboa Pública ───────────────────────────────────────────────────────────
export const LISBON_PUBLIC_ZONES: ZoneData[] = [
  { id: "belem-tower",   name: "Torre de Belém",          shortName: "Torre",     category: "outdoor", floor: "Exterior", capacity: 300, currentOccupancy: 240, wifiConnections:  80, cvCount: 230, waitTime: 25, isOpen: true, historicalPeak: 500, coordinates: { x: 20, y: 70, radius: 10 }, lng: -9.2160, lat: 38.6916, trend: generateTrend(80) },
  { id: "pasteis",       name: "Pastéis de Belém",        shortName: "Pastéis",   category: "food",    floor: "Ground",   capacity: 120, currentOccupancy: 110, wifiConnections:  40, cvCount: 105, waitTime: 35, isOpen: true, historicalPeak: 200, coordinates: { x: 22, y: 68, radius:  9 }, lng: -9.2037, lat: 38.6974, trend: generateTrend(92) },
  { id: "maat",          name: "MAAT",                    shortName: "MAAT",      category: "service", floor: "Ground",   capacity: 250, currentOccupancy:  90, wifiConnections: 120, cvCount:  85, waitTime:  5, isOpen: true, historicalPeak: 400, coordinates: { x: 25, y: 60, radius: 11 }, lng: -9.2127, lat: 38.6957, trend: generateTrend(36) },
  { id: "timeout",       name: "Time Out Market",         shortName: "Time Out",  category: "food",    floor: "Ground",   capacity: 800, currentOccupancy: 590, wifiConnections: 350, cvCount: 560, waitTime: 15, isOpen: true, historicalPeak:1200, coordinates: { x: 45, y: 62, radius: 13 }, lng: -9.1481, lat: 38.7063, trend: generateTrend(74) },
  { id: "lx-factory",   name: "LX Factory",              shortName: "LX",        category: "service", floor: "Ground",   capacity: 600, currentOccupancy: 320, wifiConnections: 180, cvCount: 300, waitTime:  0, isOpen: true, historicalPeak: 900, coordinates: { x: 38, y: 58, radius: 12 }, lng: -9.1785, lat: 38.7020, trend: generateTrend(53) },
  { id: "castelo",       name: "Castelo de S. Jorge",     shortName: "Castelo",   category: "outdoor", floor: "Exterior", capacity: 500, currentOccupancy: 380, wifiConnections: 100, cvCount: 365, waitTime: 20, isOpen: true, historicalPeak: 800, coordinates: { x: 55, y: 45, radius: 11 }, lng: -9.1333, lat: 38.7139, trend: generateTrend(76) },
  { id: "azulejo",       name: "Museu do Azulejo",        shortName: "Azulejo",   category: "service", floor: "Ground",   capacity: 180, currentOccupancy:  65, wifiConnections:  90, cvCount:  60, waitTime:  0, isOpen: true, historicalPeak: 300, coordinates: { x: 68, y: 42, radius: 10 }, lng: -9.1195, lat: 38.7225, trend: generateTrend(36) },
  { id: "oceanario",     name: "Oceanário de Lisboa",     shortName: "Oceano",    category: "service", floor: "Ground",   capacity: 400, currentOccupancy: 310, wifiConnections: 150, cvCount: 295, waitTime: 18, isOpen: true, historicalPeak: 600, coordinates: { x: 80, y: 30, radius: 12 }, lng: -9.0935, lat: 38.7631, trend: generateTrend(78) },
  { id: "estrela",       name: "Jardim da Estrela",       shortName: "Estrela",   category: "outdoor", floor: "Exterior", capacity: 400, currentOccupancy: 180, wifiConnections:  60, cvCount: 170, waitTime:  0, isOpen: true, historicalPeak: 700, coordinates: { x: 40, y: 55, radius: 11 }, lng: -9.1596, lat: 38.7148, trend: generateTrend(45) },
  { id: "sintra-palacio",name: "Palácio Nacional Sintra", shortName: "Sintra",    category: "outdoor", floor: "Exterior", capacity: 350, currentOccupancy: 200, wifiConnections:  70, cvCount: 190, waitTime: 30, isOpen: true, historicalPeak: 600, coordinates: { x: 10, y: 20, radius: 11 }, lng: -9.3883, lat: 38.7975, trend: generateTrend(57) },
  { id: "alfama",        name: "Miradouro da Graça",      shortName: "Graça",     category: "outdoor", floor: "Exterior", capacity: 200, currentOccupancy: 145, wifiConnections:  55, cvCount: 138, waitTime:  0, isOpen: true, historicalPeak: 350, coordinates: { x: 57, y: 44, radius:  9 }, lng: -9.1280, lat: 38.7162, trend: generateTrend(72) },
];

export function generateDailyForecast(baseOccupancy: number) {
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const today = new Date().getDay(); // 0=Dom, 1=Seg...
  return days.map((label, i) => ({
    label,
    isToday: i === (today === 0 ? 6 : today - 1),
    peak: Math.round(Math.min(100, baseOccupancy + (Math.random() - 0.3) * 30)),
    bestHour: Math.floor(Math.random() * 4) + 8, // entre 8h e 12h
    hours: Array.from({ length: 16 }, (_, h) => ({
      h: h + 7,
      v: Math.min(1, Math.max(0.05,
        (baseOccupancy / 100) + (Math.random() - 0.5) * 0.4 + Math.sin((h - 4) / 2.5) * 0.25
      )),
    })),
  }));
}

export const ZONES_BY_CAMPUS: Record<string, ZoneData[]> = {
  fct:       FCT_ZONES,
  sbe:       SBE_ZONES,
  Deloitte:  DELOITTE_ZONES,
  Accenture: ACCENTURE_ZONES,
  lisbon:    LISBON_PUBLIC_ZONES,
};