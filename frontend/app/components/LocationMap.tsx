"use client";

import { useEffect, useState } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

interface LocationMapProps {
  coordinates: string;
  onCoordinatesChange: (coords: string) => void;
}

export default function LocationMap({ coordinates, onCoordinatesChange }: LocationMapProps) {
  const [position, setPosition] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (coordinates) {
      const [lat, lng] = coordinates.split(",").map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        setPosition({lat, lng});
      }
    }
  }, [coordinates]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMapClick = (e: any) => {
    const { lat, lng } = e.lngLat;
    setPosition({lat, lng});
    onCoordinatesChange(`${lat.toFixed(6)},${lng.toFixed(6)}`);
  };

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

    // Add sky / atmosphere
    try {
      map.addLayer({
        id: "sky",
        type: "sky" as string,
        paint: {
          "sky-type": "atmosphere",
          "sky-atmosphere-sun": [0.0, 0.0],
          "sky-atmosphere-sun-intensity": 15,
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    } catch (err) {
      console.log("Sky layer not supported:", err);
    }
  };

  return (
    <div className="space-y-3">
      <div className="h-72 rounded-3xl overflow-hidden border border-gray-200 shadow-sm relative z-0 bg-white">
        <Map
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
          style={{ width: "100%", height: "100%" }}
        >
          <NavigationControl position="top-right" visualizePitch />
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
      </div>
      {position ? (
        <p className="text-xs font-bold text-green-800 flex items-center gap-2">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          📍 {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
        </p>
      ) : (
        <p className="text-xs font-medium text-slate-300 italic">Click the map to place a pin on your farm. Zoom into cities to see 3D buildings.</p>
      )}
    </div>
  );
}
