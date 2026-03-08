import { useState, useEffect, useRef } from "react";
import Map, { Layer } from "react-map-gl/mapbox";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer } from "@deck.gl/layers";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapViewState, FlyToInterpolator } from "@deck.gl/core";
import { ZoneData } from "@/types/steplog";
import { CampusMapConfig, DEFAULT_MAP_CONFIG } from "@/lib/clients";

const MAPBOX_TOKEN = "";

export default function CampusMap3D({
  zones,
  selectedZoneId,
  flyToZone,
  mapConfig,
  onZoneClick
}: {
  zones: ZoneData[]
  selectedZoneId?: string | null
  flyToZone?: ZoneData | null
  mapConfig?: CampusMapConfig | null
  onZoneClick?: (zone: ZoneData) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setDims({ width, height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const cfg = mapConfig ?? DEFAULT_MAP_CONFIG;

  // zoomScale: ~1x at campus zoom 17, ~4.8x at city zoom 12.5 (sqrt keeps it sane)
  const zoomScale = Math.pow(2, Math.max(0, 17 - cfg.zoom) / 2);

  const data = zones.map(z => ({
    position: [z.lng, z.lat] as [number, number],
    occupancy: z.currentOccupancy / z.capacity,
    // radius in metres: 50m base × sqrt(capacity/300) × zoom scale
    // e.g. canteen 280 cap → ~48m campus / ~230m city
    //      park 2000 cap   → ~128m campus / ~614m city
    radius: Math.round(50 * Math.sqrt(z.capacity / 300) * zoomScale),
    id: z.id,
  }));

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

  const DEFAULT_VIEW: MapViewState = {
    longitude: cfg.longitude,
    latitude:  cfg.latitude,
    zoom:      cfg.zoom,
    pitch:     cfg.pitch  ?? 46,
    bearing:   cfg.bearing ?? -20,
  };

  const [viewState, setViewState] = useState<MapViewState>(DEFAULT_VIEW);

  // Re-centre when campus changes (e.g. user switches account)
  useEffect(() => {
    setViewState(DEFAULT_VIEW);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.longitude, cfg.latitude]);

  // Fly to zone when a card is clicked — zoom in just enough to see the circle clearly
  useEffect(() => {
    if (!flyToZone) return;
    const targetZoom = Math.min(16, cfg.zoom + 3);
    setViewState(prev => ({
      ...prev,
      longitude: flyToZone.lng,
      latitude:  flyToZone.lat,
      zoom: targetZoom,
      transitionDuration: 700,
      transitionInterpolator: new FlyToInterpolator({ speed: 1.4 }),
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
    <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative", minHeight: 280 }}>
      {dims && (
        <DeckGL
          viewState={viewState as any}
          onViewStateChange={({ viewState: vs }) => setViewState(clampView(vs as unknown as MapViewState))}
          controller={true}
          layers={layers}
          width={`${dims.width}px`}
          height={`${dims.height}px`}
          style={{ position: "absolute", top: "0", left: "0" }}
          onError={(error) => console.warn("DeckGL error:", error)}
        >
          <Map
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            style={{ width: "100%", height: "100%" }}
          >
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
                  0,   "#1a1a2e",
                  10,  "#16213e",
                  30,  "#0f3460",
                  100, "#533483"
                ],
                "fill-extrusion-height": ["get", "height"],
                "fill-extrusion-base":   ["get", "min_height"],
                "fill-extrusion-opacity": 0.85
              }}
            />
          </Map>
        </DeckGL>
      )}
    </div>
  );
}