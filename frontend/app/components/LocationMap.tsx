"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Map, { Marker, NavigationControl, Source, Layer, MapRef } from "react-map-gl/maplibre";
import * as turf from "@turf/turf";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  INDIA_DROUGHT_DATA,
  getSpeiColor,
  getDroughtCategory,
  LEGEND_ITEMS,
} from "../data/india-drought-data";

interface LocationMapProps {
  coordinates: string;
  location?: string;
  farmSizeHectares?: number;
  farmCircleColor?: string;
  farmName?: string;
  onCoordinatesChange: (coords: string) => void;
  onLocationChange?: (location: string) => void;
  children?: React.ReactNode;
}

// Convert RGBA [r,g,b,a] to CSS hex
function rgbaToHex([r, g, b]: [number, number, number, number]): string {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

// Build a MapLibre match expression for state fill colors
function buildColorMatchExpression(): (string | string[])[] {
  const expr: (string | string[])[] = ["match", ["get", "NAME_1"]];
  for (const [state, spei] of Object.entries(INDIA_DROUGHT_DATA)) {
    expr.push(state as string);
    expr.push(rgbaToHex(getSpeiColor(spei)));
  }
  expr.push("#d6d3d1"); // fallback (Near Normal)
  return expr;
}

interface HoverInfo {
  x: number;
  y: number;
  state: string;
  spei: number;
  category: string;
}

export default function LocationMap({ coordinates, location, farmSizeHectares, farmCircleColor, farmName, onCoordinatesChange, onLocationChange, children }: LocationMapProps) {
  const [position, setPosition] = useState<{lat: number; lng: number} | null>(null);
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const mapRef = useRef<MapRef | null>(null);
  const lastFlyRef = useRef<string>("");

  // Fly to a state when the user types its name (skip if farm pin already placed)
  useEffect(() => {
    if (!location || !geoData || location.length < 2) return;

    const timer = setTimeout(() => {
      const query = location.toLowerCase().trim();
      // Find the best-matching state feature
      const match = geoData.features.find((f) => {
        const name = (f.properties?.NAME_1 || "").toLowerCase();
        return name === query || name.startsWith(query);
      });

      if (match) {
        const matchName = match.properties?.NAME_1 || "";
        // Avoid re-flying to the same state repeatedly
        if (lastFlyRef.current === matchName) return;
        lastFlyRef.current = matchName;

        // If a farm pin is placed with a size, let the farm circle zoom take priority
        if (position && farmSizeHectares && farmSizeHectares > 0) return;

        try {
          const bbox = turf.bbox(match) as [number, number, number, number];
          mapRef.current?.fitBounds(bbox, {
            padding: 40,
            duration: 1200,
            pitch: 60,
          });
        } catch (err) {
          console.log("Failed to fly to typed region:", err);
        }
      } else {
        lastFlyRef.current = "";
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, geoData]);

  // Load India states GeoJSON
  useEffect(() => {
    fetch("/india-states-simplified.json")
      .then((r) => r.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error("Failed to load India GeoJSON:", err));
  }, []);

  useEffect(() => {
    if (coordinates) {
      const [lat, lng] = coordinates.split(",").map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        setPosition({ lat, lng });
      }
    }
  }, [coordinates]);

  // Helper: zoom to fit the farm circle, centered on the point
  const fitToFarmCircle = useCallback((lat: number, lng: number, hectares?: number) => {
    if (!hectares || hectares <= 0) return;
    try {
      const radiusM = Math.sqrt((hectares * 10000) / Math.PI);
      // Calculate zoom level: at zoom Z, 1 pixel ≈ (156543 * cos(lat)) / 2^Z meters
      // We want the circle to fill ~250px radius on screen
      const metersPerPixelTarget = radiusM / 250;
      const zoom = Math.log2((156543 * Math.cos((lat * Math.PI) / 180)) / metersPerPixelTarget);
      mapRef.current?.flyTo({
        center: [lng, lat],
        zoom: Math.min(zoom, 20),
        duration: 800,
        pitch: 60,
      });
    } catch (err) {
      console.log("Failed to fit farm circle:", err);
    }
  }, []);

  // Re-zoom when the farm size slider changes (debounced)
  const prevHectaresRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    // Only react to slider changes, not initial mount or position changes
    if (!position || !farmSizeHectares || farmSizeHectares <= 0) return;
    if (prevHectaresRef.current === farmSizeHectares) return;
    prevHectaresRef.current = farmSizeHectares;

    const timer = setTimeout(() => {
      fitToFarmCircle(position.lat, position.lng, farmSizeHectares);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmSizeHectares, fitToFarmCircle]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMapClick = useCallback((e: any) => {
    const { lat, lng } = e.lngLat;
    setPosition({ lat, lng });
    onCoordinatesChange(`${lat.toFixed(6)},${lng.toFixed(6)}`);

    // Zoom to fit the farm circle
    setTimeout(() => fitToFarmCircle(lat, lng, farmSizeHectares), 50);

    // Check if a drought region was clicked
    if (showOverlay && e.features && e.features.length > 0) {
      const feature = e.features[0];
      const stateName = feature.properties?.NAME_1;
      if (stateName) {
        // Emit region name + mark as already-flown so location useEffect skips it
        lastFlyRef.current = stateName;
        onLocationChange?.(stateName);

        // Only fly to state bounds if no farm size is set (farm circle zoom takes priority)
        if (!farmSizeHectares || farmSizeHectares <= 0) {
          try {
            const bbox = turf.bbox(feature) as [number, number, number, number];
            mapRef.current?.fitBounds(bbox, {
              padding: 40,
              duration: 1200,
              pitch: 60,
            });
          } catch (err) {
            console.log("Failed to compute bbox:", err);
          }
        }
      }
    }
  }, [onCoordinatesChange, onLocationChange, showOverlay, farmSizeHectares, fitToFarmCircle]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleHover = useCallback((e: any) => {
    if (!showOverlay) { setHoverInfo(null); return; }
    const feature = e.features && e.features[0];
    if (feature) {
      const stateName = feature.properties?.NAME_1 || "Unknown";
      const spei = INDIA_DROUGHT_DATA[stateName] ?? 0;
      setHoverInfo({
        x: e.point.x,
        y: e.point.y,
        state: stateName,
        spei,
        category: getDroughtCategory(spei),
      });
    } else {
      setHoverInfo(null);
    }
  }, [showOverlay]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onMapLoad = (e: any) => {
    const map = e.target;
    const style = map.getStyle();
    const layers = style.layers;

    // Find the first symbol/label layer to insert 3D buildings below it
    let labelLayerId: string | undefined;
    for (const layer of layers) {
      if (layer.type === "symbol" && layer.layout && layer.layout["text-field"]) {
        labelLayerId = layer.id;
        break;
      }
    }

    // Add 3D building extrusions
    try {
      map.addLayer(
        {
          id: "3d-buildings",
          source: "carto",
          "source-layer": "building",
          filter: ["has", "render_height"],
          type: "fill-extrusion",
          minzoom: 13,
          paint: {
            "fill-extrusion-color": [
              "interpolate",
              ["linear"],
              ["get", "render_height"],
              0, "#d4e6f1",
              20, "#a9cce3",
              50, "#7fb3d8",
              100, "#5499c7",
              200, "#2e86c1",
            ],
            "fill-extrusion-height": [
              "interpolate",
              ["linear"],
              ["zoom"],
              13, 0,
              13.5, ["get", "render_height"],
            ],
            "fill-extrusion-base": [
              "interpolate",
              ["linear"],
              ["zoom"],
              13, 0,
              13.5, ["get", "render_min_height"],
            ],
            "fill-extrusion-opacity": 0.85,
          },
        },
        labelLayerId
      );
    } catch (err) {
      console.log("Failed to add 3D building layer:", err);
    }

    // Add terrain / hillshade source for 3D terrain
    try {
      map.addSource("terrain-source", {
        type: "raster-dem",
        tiles: [
          "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        maxzoom: 15,
        encoding: "terrarium",
      });
      map.setTerrain({ source: "terrain-source", exaggeration: 1.3 });

      map.addSource("hillshade-source", {
        type: "raster-dem",
        tiles: [
          "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        maxzoom: 15,
        encoding: "terrarium",
      });
      map.addLayer(
        {
          id: "hillshade",
          type: "hillshade",
          source: "hillshade-source",
          paint: {
            "hillshade-illumination-direction": 315,
            "hillshade-exaggeration": 0.6,
            "hillshade-shadow-color": "#473B24",
            "hillshade-highlight-color": "#ffffff",
            "hillshade-accent-color": "#57855c",
          },
        },
        layers[0]?.id
      );
    } catch (err) {
      console.log("Failed to add terrain:", err);
    }
  };

  const colorExpr = buildColorMatchExpression();

  return (
    <div style={{ position: "fixed", top: 64, left: 0, right: 0, bottom: 0, zIndex: 40 }}>
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: 78.9629,
          latitude: 20.5937,
          zoom: 5,
          pitch: 60,
          bearing: -17,
        }}
        maxPitch={85}
        mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
        terrain={{ source: "terrain-source", exaggeration: 1.3 }}
        onClick={handleMapClick}
        onLoad={onMapLoad}
        onMouseMove={handleHover}
        onMouseLeave={() => setHoverInfo(null)}
        interactiveLayerIds={showOverlay ? ["drought-fill"] : []}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" visualizePitch />

        {/* Drought data overlay */}
        {geoData && showOverlay && (
          <Source id="india-drought" type="geojson" data={geoData}>
            <Layer
              id="drought-fill"
              type="fill"
              paint={{
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                "fill-color": colorExpr as any,
                "fill-opacity": 0.55,
              }}
            />
            <Layer
              id="drought-outline"
              type="line"
              paint={{
                "line-color": "#ffffff",
                "line-width": 1,
                "line-opacity": 0.7,
              }}
            />
          </Source>
        )}

        {/* Farm radius circle */}
        {position && farmSizeHectares && farmSizeHectares > 0 && (() => {
          const radiusKm = Math.sqrt((farmSizeHectares * 10000) / Math.PI) / 1000;
          const circle = turf.circle(
            [position.lng, position.lat],
            radiusKm,
            { steps: 64, units: "kilometers" }
          );
          return (
            <Source id="farm-radius" type="geojson" data={circle}>
              <Layer
                id="farm-radius-fill"
                type="fill"
                paint={{
                  "fill-color": farmCircleColor || "#166534",
                  "fill-opacity": 0.15,
                }}
              />
              <Layer
                id="farm-radius-outline"
                type="line"
                paint={{
                  "line-color": farmCircleColor || "#166534",
                  "line-width": 2,
                  "line-opacity": 0.6,
                  "line-dasharray": [3, 2],
                }}
              />
            </Source>
          );
        })()}

        {/* Farm name label inside circle */}
        {position && farmName && farmSizeHectares && farmSizeHectares > 0 && (
          <Marker longitude={position.lng} latitude={position.lat} anchor="center">
            <div style={{
              pointerEvents: "none",
              textAlign: "center",
              color: farmCircleColor || "#166534",
              fontWeight: 900,
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              textShadow: "0 1px 4px rgba(255,255,255,0.9), 0 0px 2px rgba(255,255,255,1)",
              whiteSpace: "nowrap",
              marginTop: 24,
            }}>
              {farmName}
            </div>
          </Marker>
        )}

        {position && (
          <Marker longitude={position.lng} latitude={position.lat} anchor="bottom">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26C32 7.163 24.837 0 16 0z" fill="#2e86c1"/>
                <circle cx="16" cy="14" r="6" fill="white"/>
              </svg>
            </div>
          </Marker>
        )}
      </Map>

      {/* Hover tooltip */}
      {hoverInfo && (
        <div
          style={{
            position: "absolute",
            left: hoverInfo.x + 12,
            top: hoverInfo.y - 12,
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(8px)",
            borderRadius: 10,
            padding: "8px 12px",
            pointerEvents: "none",
            zIndex: 50,
            boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
            fontSize: 11,
            lineHeight: 1.4,
            maxWidth: 180,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 2 }}>{hoverInfo.state}</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ color: "#6b7280" }}>SPEI:</span>
            <span
              style={{
                fontWeight: 600,
                color: hoverInfo.spei < -0.5 ? "#b45309" : hoverInfo.spei > 0.5 ? "#166534" : "#78716c",
              }}
            >
              {hoverInfo.spei.toFixed(2)}
            </span>
          </div>
          <div style={{ color: "#9ca3af", fontSize: 10 }}>{hoverInfo.category}</div>
        </div>
      )}

      {/* Overlay toggle + compact legend */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          right: 24,
          zIndex: 50,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(8px)",
          borderRadius: 12,
          padding: "8px 12px",
          fontSize: 9,
          boxShadow: "0 1px 6px rgba(0,0,0,0.12)",
          maxWidth: 150,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: showOverlay ? 4 : 0,
            cursor: "pointer",
            userSelect: "none",
          }}
          onClick={(e) => { e.stopPropagation(); setShowOverlay(!showOverlay); }}
        >
          <span style={{ fontWeight: 700, fontSize: 10 }}>Drought Index</span>
          <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 6 }}>
            {showOverlay ? "▼" : "▶"}
          </span>
        </div>
        {showOverlay && (
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {LEGEND_ITEMS.map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    backgroundColor: item.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: "#374151" }}>{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pin status badge */}
      {position && (
        <div
          style={{
            position: "absolute",
            bottom: 4,
            right: 24,
            zIndex: 50,
            width: "auto",
            textAlign: "center",
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(6px)",
            borderRadius: 6,
            padding: "2px 6px",
            fontSize: 7,
            fontWeight: 600,
            color: "#166534",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
        </div>
      )}

      {/* Children overlay (form controls) */}
      {children && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 45 }}>
          {children}
        </div>
      )}
    </div>
  );
}
