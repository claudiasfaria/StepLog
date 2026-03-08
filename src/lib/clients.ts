import { CampusConfig } from "@/types/steplog";

export interface CampusMapConfig {
  longitude: number;
  latitude:  number;
  zoom:      number;
  pitch?:    number;
  bearing?:  number;
  bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number };
  buildingGeoJSON?: string; // path served from public/, e.g. "/building-ed4.geojson"
  buildingLng?: number;     // building center if different from campus camera center
  buildingLat?: number;
}

/** Map view + bounds for each campus/enterprise id */
export const CAMPUS_MAP_CONFIG: Record<string, CampusMapConfig> = {
  // FCT NOVA — Caparica (indoor: Biblioteca FCT/UNL)
  fct:  { longitude: -9.2057, latitude: 38.6612, zoom: 16.5, pitch: 60, bearing: -20,
          bounds: { minLng: -9.2110, maxLng: -9.2000, minLat: 38.6580, maxLat: 38.6670 },
          buildingGeoJSON: "/building-fct.geojson",
          buildingLng: -9.205325, buildingLat: 38.662712 },
  // Nova SBE — Carcavelos (campus + praia)
  sbe:  { longitude: -9.325923, latitude: 38.678768, zoom: 16.5, pitch: 55, bearing: 10, 
    bounds: { minLng: -9.3420, maxLng: -9.3180, minLat: 38.6710, maxLat: 38.6830 } 
},
  // Deloitte — Lagoas Park, Oeiras
  Deloitte: { longitude: -9.3085, latitude: 38.7148, zoom: 17, pitch: 45, bearing: 0,
                  bounds: { minLng: -9.3140, maxLng: -9.3020, minLat: 38.7110, maxLat: 38.7195 } },
  // Edifício 4 Demo — coordenadas reais do GeoJSON (centro do polígono shell)
  ed4: { longitude: -9.30627, latitude: 38.71547, zoom: 17.5, pitch: 52, bearing: -10,
         bounds: { minLng: -9.3140, maxLng: -9.2990, minLat: 38.7100, maxLat: 38.7210 },
         buildingGeoJSON: "/building-ed4.geojson" },
  // Accenture — Lagoas Park, Porto Salvo
  Accenture: { longitude: -9.3018, latitude: 38.7095, zoom: 17, pitch: 45, bearing: 5,
               bounds: { minLng: -9.3080, maxLng: -9.2960, minLat: 38.7060, maxLat: 38.7135 } },
  // Lisboa pública — cidade inteira
  lisbon: { longitude: -9.1560, latitude: 38.7150, zoom: 12.5, pitch: 45, bearing: 0,
            bounds: { minLng: -9.2500, maxLng: -9.0500, minLat: 38.6600, maxLat: 38.7800 } },
};

/** Fallback map config when campus is unknown */
export const DEFAULT_MAP_CONFIG: CampusMapConfig = {
  longitude: -9.2057, latitude: 38.6612, zoom: 16, pitch: 50, bearing: 0,
  bounds: { minLng: -9.2200, maxLng: -9.1900, minLat: 38.6500, maxLat: 38.6700 },
};

/**
 * Emails que têm acesso à vista de gestão (EntityDashboard),
 * independentemente do tab "Particular" / "Private" escolhido no login.
 * Num sistema real isto viria de um campo `role` na base de dados.
 */
export const ADMIN_EMAILS: string[] = [
  // FCT
  "admin@fct.unl.pt",
  // SBE
  "admin@sbe.unl.pt",
  // Deloitte
  "admin@deloitte.pt",
  // Accenture
  "admin@accenture.pt",
  // Edifício 4 Demo
  "admin@ed4.demo",
];

export const CAMPUSES: CampusConfig[] = [
  {
    id:       "fct",
    name:     "FCT NOVA",
    shortName:"FCT",
    domain:   "@fct.unl.pt",
    tagline:  "Faculty of Science & Technology",
    color:    "#7BC8FF",
    colorRaw: "123,200,255",
    logo:     "⚗️",
  },
  {
    id:       "sbe",
    name:     "Nova SBE",
    shortName:"SBE",
    domain:   "@sbe.unl.pt",
    tagline:  "School of Business & Economics",
    color:    "#7BC8FF",
    colorRaw: "123,200,255",
    logo:     "📊",
  },
];

export const ENTERPRISE: CampusConfig[] = [
  {
  id:       "Deloitte",
  name:     "Deloitte Portugal",
  shortName:"Dpt",
  domain:   "@deloitte.pt",
  tagline:  "Deloitte Portugal",
  color:     "#00a332", 
  colorRaw:  "0,163,50",
  logo:     "🏢",
},
{
   id:      "Accenture",
  name:     "Accenture",
  shortName:"acc",
  domain:   "@accenture.pt",
  tagline:  "Accenture",
  color:     "#7500c0", 
  colorRaw:  "117,0,192",
  logo:     "🏢",
}
];

/** Configuração pública — visitante sem conta */
export const LISBON_PUBLIC: CampusConfig = {
  id:       "lisbon",
  name:     "Lisboa",
  shortName:"LX",
  domain:   "@guest.steplog.app",
  tagline:  "Pontos públicos em tempo real",
  color:    "#FFB347",
  colorRaw: "255,179,71",
  logo:     "🗺️",
  isPublic: true,
};
