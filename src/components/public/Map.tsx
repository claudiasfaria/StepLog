import { useState, useEffect, useRef, useMemo } from "react";
import Map, { Layer, Source } from "react-map-gl/mapbox";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer } from "@deck.gl/layers";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapViewState, FlyToInterpolator } from "@deck.gl/core";
import { ZoneData } from "@/types/steplog";
import { CampusMapConfig, DEFAULT_MAP_CONFIG } from "@/lib/clients";
import FloorPlan from "@/components/public/FloorPlan";
import { getOccupancyColor, getOccupancyPercent } from "@/lib/occupancy";

const MAPBOX_TOKEN = "pk.eyJ1IjoiY3NmYXJpYTEzIiwiYSI6ImNtbWdldmV5aDBpbXQycnM1eTVqNmVoeWUifQ.ukaEAzJnuDc1ggD8m7sxxg ";

// Converte cor hex "#rrggbb" → [r,g,b]
function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

// Converte cor CSS "var(--x)" / hex para hex string
function occupancyHex(pct: number): string {
  if (pct < 40) return "#00dc82";
  if (pct < 70) return "#ffb400";
  return "#ff3c3c";
}
const FLOOR_LABELS: Record<number, string> = {
  0: "Entrada",
  1: "Open Space",
  2: "Estudo",
  3: "Innovation",
  4: "Meetings",
};
const FLOOR_DISPLAY: Record<number, string> = {
  0: "P-1",
  1: "P0",
  2: "P1",
  3: "P2",
  4: "P3",
};

export default function CampusMap3D({
  zones,
  selectedZoneId,
  flyToZone,
  mapConfig,
  onZoneClick,
  onMapClick,
}: {
  zones: ZoneData[];
  selectedZoneId?: string | null;
  flyToZone?: ZoneData | null;
  mapConfig?: CampusMapConfig | null;
  onZoneClick?: (zone: ZoneData) => void;
  onMapClick?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const prevFlyZoneIdRef = useRef<string | null>(null);
  const [activeFloor, setActiveFloor] = useState<number>(0);

  const cfg = mapConfig ?? DEFAULT_MAP_CONFIG;

  const DEFAULT_VIEW: MapViewState = {
    longitude: cfg.longitude,
    latitude:  cfg.latitude,
    zoom:      cfg.zoom,
    pitch:     cfg.pitch  ?? 46,
    bearing:   cfg.bearing ?? -20,
  };

  const [viewState, setViewState] = useState<MapViewState>(DEFAULT_VIEW);

  // ── Separação indoor / outdoor ────────────────────────────────────────────
  const indoorZones  = zones.filter(z => /(?:dl|fct)-p\d/.test(z.id));
  const outdoorZones = zones.filter(z => !/(?:dl|fct)-p\d/.test(z.id));
  const hasIndoor    = indoorZones.length > 0;

  // ── Indoor mode: campus tem geojson + utilizador está perto + zoom alto ──
  const INDOOR_RADIUS = 0.002;
  const bldLng = cfg.buildingLng ?? cfg.longitude;
  const bldLat = cfg.buildingLat ?? cfg.latitude;
  const nearBuilding =
    Math.abs((viewState.longitude as number) - bldLng) < INDOOR_RADIUS &&
    Math.abs((viewState.latitude  as number) - bldLat) < INDOOR_RADIUS;
  // floorVisible / indoorMode: same threshold — UI and rooms appear together
  const floorVisible = !!cfg.buildingGeoJSON && nearBuilding && (viewState.zoom as number) > 17.6;
  const indoorMode   = floorVisible;

  // ── GeoJSON dinâmico — cores das salas por occupancy ─────────────────────
  const [buildingGeoJSON, setBuildingGeoJSON] = useState<any>(null);

  useEffect(() => {
    if (!cfg.buildingGeoJSON) { setBuildingGeoJSON(null); return; }
    fetch(cfg.buildingGeoJSON)
      .then(r => r.json())
      .then(raw => setBuildingGeoJSON(raw));
  }, [cfg.buildingGeoJSON]);

  const coloredGeoJSON = useMemo(() => {
    if (!buildingGeoJSON) return null;
    const features = buildingGeoJSON.features.map((f: any) => {
      if (f.properties.type !== "room") return f;
      const zone = zones.find(z => z.id === f.properties.zone_id);
      const color = zone ? occupancyHex(getOccupancyPercent(zone)) : "#1e3a6e";
      return { ...f, properties: { ...f.properties, color } };
    });
    return { ...buildingGeoJSON, features };
  }, [buildingGeoJSON, zones]);

  // ── Dynamic floor list derived from loaded GeoJSON ─────────────────────────
  const geoFloors = useMemo(() => {
    if (!coloredGeoJSON) return [] as number[];
    const nums = [...new Set(
      coloredGeoJSON.features
        .filter((f: any) => f.properties.type === "room")
        .map((f: any) => f.properties.floor as number)
    )].sort((a, b) => b - a); // descending: highest floor at top
    return nums;
  }, [coloredGeoJSON]);

  // ── Average occupancy % for a floor (used by floor selector) ─────────────
  const floorAvgPct = (floor: number): number => {
    if (!coloredGeoJSON) return 0;
    const roomIds = coloredGeoJSON.features
      .filter((f: any) => f.properties.type === "room" && f.properties.floor === floor)
      .map((f: any) => f.properties.zone_id as string);
    const floorZones = indoorZones.filter(z => roomIds.includes(z.id));
    if (!floorZones.length) return 0;
    return Math.round(floorZones.reduce((s, z) => s + getOccupancyPercent(z), 0) / floorZones.length);
  };

  // zoomScale: ~1x at campus zoom 17, ~4.8x at city zoom 12.5 (sqrt keeps it sane)
  const zoomScale = Math.pow(2, Math.max(0, 17 - cfg.zoom) / 2);

  // Don't show building dot when campus has a GeoJSON building — outdoor zone circles
  // (e.g. "library") already sit at the building location and would overlap.
  const buildingDot = hasIndoor && !indoorMode && !cfg.buildingGeoJSON ? (() => {
    const totalCap = indoorZones.reduce((s, z) => s + z.capacity, 0);
    const totalOcc = indoorZones.reduce((s, z) => s + z.currentOccupancy, 0);
    return {
      position: [bldLng, bldLat] as [number, number],
      occupancy: totalOcc / totalCap,
      radius: Math.round(18 * Math.sqrt(totalCap / 300) * zoomScale),
      id: "__building__",
    };
  })() : null;

  const data = [
    ...outdoorZones.map(z => ({
      position: [z.lng, z.lat] as [number, number],
      occupancy: z.currentOccupancy / z.capacity,
      radius: Math.round(18 * Math.sqrt(z.capacity / 300) * zoomScale),
      id: z.id,
    })),
    ...(buildingDot ? [buildingDot] : []),
  ];

  const getColor = (occupancy: number, selected: boolean): [number, number, number, number] => {
    if (selected)        return [0, 200, 255, 180];
    if (occupancy < 0.4) return [0, 220, 130, 160];
    if (occupancy < 0.7) return [255, 180, 0, 160];
    return [255, 60, 60, 160];
  };

  const layers = [
    // Inner soft glow fill — pickable hit area
    new ScatterplotLayer({
      id: "zone-fill",
      data,
      getPosition: (d: any) => d.position,
      getRadius: (d: any) => d.radius,
      getFillColor: (d: any) => {
        const [r, g, b] = getColor(d.occupancy, d.id === selectedZoneId);
        return [r, g, b, d.id === selectedZoneId ? 55 : 35] as [number, number, number, number];
      },
      stroked: false,
      pickable: true,
      radiusUnits: "meters",
      updateTriggers: { getFillColor: selectedZoneId },
      onClick: (info: any) => {
        if (info.object?.id === "__building__") {
          setViewState(prev => ({
            ...prev,
            longitude: bldLng,
            latitude:  bldLat,
            zoom: 18,
            transitionDuration: 1200,
            transitionInterpolator: new FlyToInterpolator({ speed: 1.0 }),
          } as any));
          return;
        }
        const zone = zones.find(z => z.id === info.object?.id);
        if (zone) onZoneClick?.(zone);
      }
    }),
    // Outer ring — purely visual, not pickable
    new ScatterplotLayer({
      id: "zone-ring",
      data,
      getPosition: (d: any) => d.position,
      getRadius: (d: any) => d.radius,
      getFillColor: [0, 0, 0, 0],
      getLineColor: (d: any) => {
        const c = getColor(d.occupancy, d.id === selectedZoneId);
        return [c[0], c[1], c[2], d.id === selectedZoneId ? 255 : 200] as [number, number, number, number];
      },
      stroked: true,
      filled: false,
      getLineWidth: (d: any) => d.id === selectedZoneId ? 3 : 1.5,
      lineWidthUnits: "pixels",
      lineWidthMinPixels: 1,
      pickable: false,
      radiusUnits: "meters",
      updateTriggers: { getLineColor: selectedZoneId, getLineWidth: selectedZoneId },
    }),
  ];

  // Re-centre when campus changes (e.g. user switches account)
  useEffect(() => {
    setViewState(DEFAULT_VIEW);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.longitude, cfg.latitude]);

  // ── Boost pitch when entering indoorMode so rooms look 3D ────────────────
  const prevIndoorRef = useRef(false);
  useEffect(() => {
    if (indoorMode && !prevIndoorRef.current) {
      setViewState(prev => ({
        ...prev,
        pitch: 68,
        transitionDuration: 400,
        transitionInterpolator: new FlyToInterpolator({ speed: 1.5 }),
      } as any));
    }
    prevIndoorRef.current = indoorMode;
  }, [indoorMode]);

  // ── Room click via Mapbox queryRenderedFeatures ───────────────────────────
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!indoorMode) return;
    const map = mapRef.current?.getMap?.();
    if (!map) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const features = map.queryRenderedFeatures(
      [e.clientX - rect.left, e.clientY - rect.top],
      { layers: ["ed4-rooms"] }
    );
    if (features?.length) {
      const zone = zones.find(z => z.id === features[0].properties?.zone_id);
      if (zone) onZoneClick?.(zone);
      else onMapClick?.();
    } else {
      onMapClick?.();
    }
  };

  // Fly to zone when a card is clicked — zoom in just enough to see the circle clearly
  useEffect(() => {
    if (!flyToZone) { prevFlyZoneIdRef.current = null; return; }
    // Only fly when the selected zone actually changes (not on every zones re-render)
    if (flyToZone.id === prevFlyZoneIdRef.current) return;
    prevFlyZoneIdRef.current = flyToZone.id;
    // Fly into building zoom when the zone is at/near the GeoJSON building
    const nearBld = cfg.buildingGeoJSON &&
      Math.abs(flyToZone.lng - bldLng) < 0.002 &&
      Math.abs(flyToZone.lat - bldLat) < 0.002;
    const targetZoom = nearBld ? 19 : 17.5;
    setViewState(prev => ({
      ...prev,
      longitude: flyToZone.lng,
      latitude:  flyToZone.lat,
      zoom: targetZoom,
      transitionDuration: 1200,
      transitionInterpolator: new FlyToInterpolator({ speed: 1.0 }),
    } as any));
  }, [flyToZone]);

  // Campus bounds — prevent panning too far away
  const BOUNDS = cfg.bounds;
  const clampView = (vs: MapViewState): MapViewState => ({
    ...vs,
    longitude: Math.min(BOUNDS.maxLng, Math.max(BOUNDS.minLng, vs.longitude as number)),
    latitude:  Math.min(BOUNDS.maxLat, Math.max(BOUNDS.minLat, vs.latitude  as number)),
    zoom:      Math.min(19, Math.max(cfg.zoom - 0.5, vs.zoom as number)),
  });

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", position: "relative", minHeight: 280, outline: "none", border: "none" }}
      onClick={handleContainerClick}
    >
      <DeckGL
          viewState={viewState as any}
          onViewStateChange={({ viewState: vs, interactionState }) => {
            if ((interactionState as any)?.isDragging || (interactionState as any)?.isPanning ||
                (interactionState as any)?.isZooming || (interactionState as any)?.isRotating) {
              setViewState(clampView(vs as unknown as MapViewState));
            } else {
              // During transitions, pass through without clamping interruption
              setViewState(vs as any);
            }
          }}
          controller={true}
          layers={layers}
          onClick={(info: any) => { if (!info.object) onMapClick?.(); }}
          style={{ position: "absolute", width: "100%", height: "100%" }}
          onError={(error) => console.warn("DeckGL error:", error)}
        >
          <Map
            ref={mapRef}
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            style={{ width: "100%", height: "100%" }}
          >
            {/* Edifícios genéricos Mapbox */}
            <Layer
              id="3d-buildings"
              source="composite"
              source-layer="building"
              filter={["==", "extrude", "true"]}
              type="fill-extrusion"
              minzoom={15}
              paint={{
                "fill-extrusion-color": [
                  "interpolate", ["linear"], ["get", "height"],
                  0, "#1a1a2e", 10, "#16213e", 30, "#0f3460", 100, "#533483",
                ],
                "fill-extrusion-height":  ["get", "height"],
                "fill-extrusion-base":    ["get", "min_height"],
                "fill-extrusion-opacity": floorVisible ? 0 : 0.85,
              }}
            />

            {/* Custom building with occupancy colors */}
            {coloredGeoJSON && (
              <Source id="demo-office" type="geojson" data={coloredGeoJSON}>
                {/* Shell — white outside, fully hidden indoors */}
                <Layer id="ed4-shell" type="fill-extrusion"
                  filter={["==", ["get", "type"], "building-shell"]}
                  paint={{
                    "fill-extrusion-color":   "#ddeeff",
                    "fill-extrusion-height":  ["+", ["get", "base_height"], ["get", "height"]],
                    "fill-extrusion-base":    ["get", "base_height"],
                    "fill-extrusion-opacity": 0,
                  }}
                />
                {/* Ghost rooms — ALL non-active floors (above and below), dim occupancy color */}
                <Layer id="ed4-rooms-ghost" type="fill-extrusion"
                  filter={
                    floorVisible
                      ? ["all", ["==", ["get", "type"], "room"], ["!=", ["get", "floor"], activeFloor]]
                      : ["boolean", false]
                  }
                  paint={{
                    "fill-extrusion-color":   ["get", "color"],
                    "fill-extrusion-height":  ["+", ["get", "base_height"], ["get", "height"]],
                    "fill-extrusion-base":    ["get", "base_height"],
                    "fill-extrusion-opacity": 0.15,
                  }}
                />
                {/* Active floor rooms — full color, rendered on top */}
                <Layer id="ed4-rooms" type="fill-extrusion"
                  filter={
                    floorVisible
                      ? ["all", ["==", ["get", "type"], "room"], ["==", ["get", "floor"], activeFloor]]
                      : ["boolean", false]
                  }
                  paint={{
                    "fill-extrusion-color":   ["get", "color"],
                    "fill-extrusion-height":  ["+", ["get", "base_height"], ["get", "height"]],
                    "fill-extrusion-base":    ["get", "base_height"],
                    "fill-extrusion-opacity": 0.95,
                  }}
                />
                {/* Roof — light cap outside, hidden indoors */}
                <Layer id="ed4-roof" type="fill-extrusion"
                  filter={["==", ["get", "type"], "roof"]}
                  paint={{
                    "fill-extrusion-color":   "#c8dcef",
                    "fill-extrusion-height":  ["+", ["get", "base_height"], ["get", "height"]],
                    "fill-extrusion-base":    ["get", "base_height"],
                    "fill-extrusion-opacity": 0,
                  }}
                />
              </Source>
            )}
          </Map>
        </DeckGL>

      {/* ── IBM-style vertical floor selector ── */}
      {indoorMode && (
        <div
          style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            display: "flex", flexDirection: "column", gap: 4, zIndex: 10,
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Exit button */}
          <button
            onClick={() => setViewState(prev => ({
              ...prev, zoom: cfg.zoom,
              transitionDuration: 500,
              transitionInterpolator: new FlyToInterpolator({ speed: 1.2 }),
            } as any))}
            style={{
              background: "rgba(10,14,28,0.85)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8, cursor: "pointer", color: "rgba(255,255,255,0.45)",
              fontSize: 13, padding: "5px 10px", marginBottom: 4,
              fontFamily: "var(--font-mono)", backdropFilter: "blur(8px)",
            }}
          >✕</button>

          {geoFloors.map(f => {
            const pct      = floorAvgPct(f);
            const color    = pct < 40 ? "#2DD880" : pct < 70 ? "#F07840" : "#E04060";
            const isActive = activeFloor === f;
            return (
              <button key={f} onClick={() => setActiveFloor(f)} style={{
                width: 72, padding: "9px 4px", borderRadius: 10, cursor: "pointer",
                border: `1px solid ${isActive ? color : `${color}55`}`,
                background: isActive ? `${color}28` : `${color}0d`,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                transition: "all 0.15s", backdropFilter: "blur(8px)",
                boxShadow: isActive ? `0 0 14px ${color}50` : `0 0 4px ${color}18`,
              }}>
                <span style={{
                  fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 700,
                  color: isActive ? color : `${color}cc`,
                }}>{FLOOR_DISPLAY[f] ?? `P${f}`}</span>
                <span style={{
                  fontSize: 7, fontFamily: "var(--font-mono)", letterSpacing: "0.04em",
                  color: isActive ? color : `${color}99`,
                  textAlign: "center", lineHeight: 1.3,
                }}>{FLOOR_LABELS[f]}</span>
                <div style={{ width: 40, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.07)", marginTop: 2 }}>
                  <div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: color }} />
                </div>
                <span style={{
                  fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700,
                  color: isActive ? color : `${color}bb`,
                }}>{pct}%</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}