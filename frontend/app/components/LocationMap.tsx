"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Map, { Marker, NavigationControl, Source, Layer, MapRef } from "react-map-gl/maplibre";
import * as turf from "@turf/turf";
import "maplibre-gl/dist/maplibre-gl.css";
import { scaleSequential } from 'd3-scale';
import { interpolateYlGn, interpolateBlues } from 'd3-scale-chromatic';

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
  inline?: boolean;
}

const CROP_OPTIONS = [
  { value: 'wheat', label: 'Wheat' },
  { value: 'rice', label: 'Rice' },
  { value: 'maize', label: 'Maize' },
  { value: 'cotton', label: 'Cotton' },
  { value: 'sugarcane', label: 'Sugarcane' },
  { value: 'groundnut', label: 'Groundnut' },
];

// Convert RGBA [r,g,b,a] to CSS hex
function rgbaToHex([r, g, b]: [number, number, number, number]): string {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

// Helper function for fuzzy matching district names against API dataset keys
function findMapValue(distName: string, data: Record<string, number>): number | undefined {
  if (!distName || !data) return undefined;
  const lowerName = distName.toLowerCase();
  
  // Exact match
  if (data[lowerName] !== undefined) return data[lowerName];
  
  // Substring Match (e.g. "Nicobar Islands" vs "Nicobar")
  const matchKey = Object.keys(data).find(k => k.includes(lowerName) || lowerName.includes(k));
  if (matchKey) return data[matchKey];
  
  return undefined;
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
  spei?: number;
  category?: string;
  district?: string;
  yieldValue?: number;
  rainfallValue?: number;
}

export default function LocationMap({ coordinates, location, farmSizeHectares, farmCircleColor, farmName, onCoordinatesChange, onLocationChange, children }: LocationMapProps) {
  const [position, setPosition] = useState<{lat: number; lng: number} | null>(null);
  const [stateGeoData, setStateGeoData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [districtGeoData, setDistrictGeoData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const mapRef = useRef<MapRef | null>(null);
  const lastFlyRef = useRef<string>("");

  // Layer state
  const [activeLayer, setActiveLayer] = useState<'drought' | 'crop' | 'rainfall'>('drought');
  const [selectedCrop, setSelectedCrop] = useState<string>('wheat');
  const [selectedYear, setSelectedYear] = useState<number>(2015);
  
  // Crop data state
  const [cropData, setCropData] = useState<Record<string, number>>({});
  const [colorScale, setColorScale] = useState<any>(null);

  // Rainfall data state
  const [rainfallData, setRainfallData] = useState<Record<string, number>>({});
  const [rainfallColorScale, setRainfallColorScale] = useState<any>(null);

  // Fly to a state when the user types its name (skip if farm pin already placed)
  useEffect(() => {
    if (!location || !stateGeoData || location.length < 2) return;

    const timer = setTimeout(() => {
      const query = location.toLowerCase().trim();
      // Find the best-matching state feature
      const match = stateGeoData.features.find((f) => {
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
  }, [location, stateGeoData]);

  // Load GeoJSONs
  useEffect(() => {
    fetch("/india-states-simplified.json")
      .then((r) => r.json())
      .then((data) => setStateGeoData(data))
      .catch((err) => console.error("Failed to load India GeoJSON:", err));

    fetch("/india-districts.json")
      .then((r) => r.json())
      .then((data) => setDistrictGeoData(data))
      .catch((err) => console.error("Failed to load India Districts GeoJSON:", err));
  }, []);

  // Fetch crop data when active layer is 'crop' or parameters change
  useEffect(() => {
    if (activeLayer === 'crop') {
      fetch(`http://localhost:8000/data/crop-yield?crop=${selectedCrop}&year=${selectedYear}`)
        .then(res => {
          if (!res.ok) throw new Error('Data fetch failed');
          return res.json();
        })
        .then(res => {
          const normalizedData: Record<string, number> = {};
          for (const [k, v] of Object.entries(res.data)) {
            normalizedData[k.toLowerCase()] = v as number;
          }
          setCropData(normalizedData);
          
          // Build color scale
          const values = Object.values(normalizedData).filter(v => typeof v === 'number' && v > 0) as number[];
          if (values.length > 0) {
            const min = Math.min(...values);
            const max = Math.max(...values);
            // using d3 color
            const scale = scaleSequential(interpolateYlGn).domain([min, max]);
            setColorScale(() => scale);
          } else {
            setColorScale(null);
          }
        })
        .catch(err => {
          console.error("Error fetching crop yield:", err);
          setCropData({});
          setColorScale(null);
        });
    }
  }, [activeLayer, selectedCrop, selectedYear]);

  // Fetch Rainfall Data
  useEffect(() => {
    if (activeLayer === 'rainfall' && Object.keys(rainfallData).length === 0) {
      fetch(`http://localhost:8000/data/rainfall`)
        .then(res => {
          if (!res.ok) throw new Error('Data fetch failed');
          return res.json();
        })
        .then(res => {
          const normalizedData: Record<string, number> = {};
          for (const [k, v] of Object.entries(res.data)) {
            normalizedData[k.toLowerCase()] = v as number;
          }
          setRainfallData(normalizedData);
          const values = Object.values(normalizedData).filter(v => typeof v === 'number' && v > 0) as number[];
          if (values.length > 0) {
            const min = Math.min(...values);
            const max = Math.max(...values);
            // Cap at 4000mm 
            const scale = scaleSequential(interpolateBlues).domain([min, Math.min(max, 4000)]);
            setRainfallColorScale(() => scale);
          }
        })
        .catch(err => {
          console.error("Error fetching rainfall data:", err);
          setRainfallData({});
        });
    }
  }, [activeLayer, rainfallData]);

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
      if (activeLayer === 'drought') {
          const stateName = feature.properties?.NAME_1 || "Unknown";
          const spei = INDIA_DROUGHT_DATA[stateName] ?? 0;
          setHoverInfo({
            x: e.point.x,
            y: e.point.y,
            state: stateName,
            spei,
            category: getDroughtCategory(spei),
          });
      } else if (activeLayer === 'crop') {
          const distName = feature.properties?.NAME_2 || "Unknown";
          const stateName = feature.properties?.NAME_1 || "Unknown";
          const yieldValue = findMapValue(distName, cropData) ?? 0;
          setHoverInfo({
              x: e.point.x,
              y: e.point.y,
              state: stateName,
              district: distName,
              yieldValue
          });
      } else if (activeLayer === 'rainfall') {
          const distName = feature.properties?.NAME_2 || "Unknown";
          const stateName = feature.properties?.NAME_1 || "Unknown";
          const rainfallValue = findMapValue(distName, rainfallData);

          setHoverInfo({
            x: e.point.x,
            y: e.point.y,
            state: stateName,
            district: distName,
            rainfallValue
          });
      }
    } else {
      setHoverInfo(null);
    }
  }, [showOverlay, activeLayer, cropData]);

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

  const droughtColorExpr = buildColorMatchExpression();
  
  // Build MapLibre match expression for district crop colors
  const cropColorExpr = useMemo(() => {
      if (!colorScale || Object.keys(cropData).length === 0) return "#e5e7eb";
      
      const expr: (string | string[])[] = ["match", ["get", "NAME_2"]];
      const seen = new Set<string>();
      for (const feature of districtGeoData?.features || []) {
          const distName = feature.properties?.NAME_2;
          if (!distName || seen.has(distName)) continue;
          
          const val = findMapValue(distName, cropData);
          if (val !== undefined && val > 0) {
              seen.add(distName);
              expr.push(distName);
              let color = colorScale(val);
              if (color && typeof color === 'string') {
                  expr.push(color);
              } else {
                  expr.push("#e5e7eb");
              }
          }
      }
      if (expr.length === 2) return "#e5e7eb";
      expr.push("#e5e7eb"); // fallback
      return expr as any;
  }, [cropData, colorScale, districtGeoData]);

  // Build MapLibre match expression for district rainfall colors
  const rainfallColorExpr = useMemo(() => {
      if (!rainfallColorScale || Object.keys(rainfallData).length === 0) return "#e5e7eb";
      
      const expr: (string | string[])[] = ["match", ["get", "NAME_2"]];
      const seen = new Set<string>();
      for (const feature of districtGeoData?.features || []) {
          const distName = feature.properties?.NAME_2;
          if (!distName || seen.has(distName)) continue;
          
          const val = findMapValue(distName, rainfallData);
          if (val !== undefined && val > 0) {
              seen.add(distName);
              expr.push(distName);
              let color = rainfallColorScale(val);
              if (color && typeof color === 'string') {
                  expr.push(color);
              } else {
                  expr.push("#e5e7eb");
              }
          }
      }
      if (expr.length === 2) return "#e5e7eb";
      expr.push("#e5e7eb"); // fallback
      return expr as any;
  }, [rainfallData, rainfallColorScale, districtGeoData]);

  return (
    <div style={{ position: "fixed", top: 64, left: 0, right: 0, bottom: 0, zIndex: 40 }}>
      {/* Configuration Control Panel */}
      <div 
        style={{
            position: 'absolute', 
            top: 20, 
            right: 80, 
            zIndex: 50,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
        }}
      >
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>Map Layers</h3>
        
        <div>
            <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', color: '#4b5563', fontWeight: '600' }}>Data View</label>
            <select 
                value={activeLayer} 
                onChange={(e) => setActiveLayer(e.target.value as 'drought' | 'crop' | 'rainfall')}
                style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', background: 'white' }}
            >
                <option value="drought">State Drought Index (SPEI)</option>
                <option value="crop">District Crop Yield History</option>
                <option value="rainfall">District Rainfall (Annual Avg)</option>
            </select>
        </div>

        {activeLayer === 'crop' && (
            <>
                <div>
                    <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', color: '#4b5563', fontWeight: '600' }}>Crop Type</label>
                    <select 
                        value={selectedCrop} 
                        onChange={(e) => setSelectedCrop(e.target.value)}
                        style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', background: 'white' }}
                    >
                        {CROP_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', color: '#4b5563', fontWeight: '600' }}>Year ({selectedYear})</label>
                    <input 
                        type="range" 
                        min={1966} 
                        max={2017} 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>
            </>
        )}
      </div>

      <Map
        ref={mapRef}
        initialViewState={{
          longitude: 78.9629,
          latitude: 20.5937,
          zoom: 4.5,
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
        interactiveLayerIds={
          showOverlay
            ? activeLayer === 'drought'
              ? ["drought-fill"]
              : activeLayer === 'crop'
                ? ["crop-fill"]
                : ["rainfall-fill"]
            : []
        }
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" visualizePitch />

        {/* Drought data overlay */}
        {activeLayer === 'drought' && stateGeoData && showOverlay && (
          <Source id="india-drought" type="geojson" data={stateGeoData}>
            <Layer
              id="drought-fill"
              type="fill"
              paint={{
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                "fill-color": droughtColorExpr as any,
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
        
        {/* District Crop Data layer */}
        {activeLayer === 'crop' && districtGeoData && showOverlay && (
           <Source id="india-crop" type="geojson" data={districtGeoData}>
             <Layer
               id="crop-fill"
               type="fill"
               paint={{
                 "fill-color": cropColorExpr as any,
                 "fill-opacity": 0.65,
               }}
             />
             <Layer
               id="crop-outline"
               type="line"
               paint={{
                 "line-color": "#ffffff",
                 "line-width": 1,
                 "line-opacity": 0.4,
               }}
             />
           </Source>
        )}

        {/* District Rainfall Data layer */}
        {activeLayer === 'rainfall' && districtGeoData && showOverlay && (
           <Source id="india-rainfall" type="geojson" data={districtGeoData}>
             <Layer
               id="rainfall-fill"
               type="fill"
               paint={{
                 "fill-color": rainfallColorExpr as any,
                 "fill-opacity": 0.65,
               }}
             />
             <Layer
               id="rainfall-outline"
               type="line"
               paint={{
                 "line-color": "#ffffff",
                 "line-width": 1,
                 "line-opacity": 0.4,
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
            zIndex: 60,
            boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
            fontSize: 11,
            lineHeight: 1.4,
            maxWidth: 180,
          }}
        >
          {activeLayer === 'drought' && (
              <>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>{hoverInfo.state}</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ color: "#6b7280" }}>SPEI:</span>
                    <span
                    style={{
                        fontWeight: 600,
                        color: hoverInfo.spei !== undefined && hoverInfo.spei < -0.5 ? "#b45309" : hoverInfo.spei !== undefined && hoverInfo.spei > 0.5 ? "#166534" : "#78716c",
                    }}
                    >
                    {hoverInfo.spei?.toFixed(2)}
                    </span>
                </div>
                <div style={{ color: "#9ca3af", fontSize: 10 }}>{hoverInfo.category}</div>
              </>
          )}
          {activeLayer === 'crop' && (
              <>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>{hoverInfo.district}, {hoverInfo.state}</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ color: "#6b7280" }}>Yield:</span>
                    <span style={{ fontWeight: 600, color: "#166534" }}>
                    {hoverInfo.yieldValue ? `${hoverInfo.yieldValue.toFixed(1)} Kg/ha` : 'No Data'}
                    </span>
                </div>
              </>
          )}
          {activeLayer === 'rainfall' && (
              <>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>{hoverInfo.district}, {hoverInfo.state}</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ color: "#6b7280" }}>Annual Rainfall:</span>
                    <span style={{ fontWeight: 600, color: "#2e86c1" }}>
                    {hoverInfo.rainfallValue ? `${hoverInfo.rainfallValue.toFixed(1)} mm` : 'No Data'}
                    </span>
                </div>
              </>
          )}
        </div>
      )}

      {/* Overlay toggle + compact legend for drought */}
      {activeLayer === 'drought' && (
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
      )}

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
