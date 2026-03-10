'use client';

import { useCallback, useEffect, useState } from 'react';
import { Deck } from '@deck.gl/core';
import { GeoJsonLayer } from '@deck.gl/layers';
import { _GlobeView as GlobeView } from '@deck.gl/core';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

import { scaleSequential } from 'd3-scale';
import { interpolateYlGn, interpolateBlues } from 'd3-scale-chromatic';

import {
  INDIA_DROUGHT_DATA,
  getSpeiColor,
  getDroughtCategory,
  LEGEND_ITEMS,
} from '../data/india-drought-data';

const INITIAL_VIEW_STATE = {
  latitude: 20,
  longitude: 78,
  zoom: 1.5,
};

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

const CROP_OPTIONS = [
  { value: 'wheat', label: 'Wheat' },
  { value: 'rice', label: 'Rice' },
  { value: 'maize', label: 'Maize' },
  { value: 'cotton', label: 'Cotton' },
  { value: 'sugarcane', label: 'Sugarcane' },
  { value: 'groundnut', label: 'Groundnut' },
];

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

export default function GlobeMap() {
  const [stateGeoData, setStateGeoData] = useState<any>(null);
  const [districtGeoData, setDistrictGeoData] = useState<any>(null);
  const [worldGeoData, setWorldGeoData] = useState<any>(null);
  
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [deck, setDeck] = useState<any>(null);
  
  // Layer state
  const [activeLayer, setActiveLayer] = useState<'drought' | 'crop' | 'rainfall'>('drought');
  const [selectedCrop, setSelectedCrop] = useState<string>('wheat');
  const [selectedYear, setSelectedYear] = useState<number>(2015);
  
  // Crop data state
  const [cropData, setCropData] = useState<Record<string, number>>({});
  const [cropColorScale, setCropColorScale] = useState<any>(null);
  
  // Rainfall data state
  const [rainfallData, setRainfallData] = useState<Record<string, number>>({});
  const [rainfallColorScale, setRainfallColorScale] = useState<any>(null);

  // Load GeoJSON data
  useEffect(() => {
    fetch('/india-states-simplified.json')
      .then((res) => res.json())
      .then((data) => setStateGeoData(data))
      .catch((err) => console.error('Failed to load India States GeoJSON:', err));

    fetch('/india-districts.json')
      .then((res) => res.json())
      .then((data) => setDistrictGeoData(data))
      .catch((err) => console.error('Failed to load India Districts GeoJSON:', err));

    fetch('/world-countries.json')
      .then((res) => res.json())
      .then((data) => setWorldGeoData(data))
      .catch((err) => console.error('Failed to load world GeoJSON:', err));
  }, []);

  // Fetch crop data
  useEffect(() => {
    if (activeLayer === 'crop') {
      fetch(`${API_URL}/data/crop-yield?crop=${selectedCrop}&year=${selectedYear}`)
        .then(res => {
          if (!res.ok) throw new Error('Data fetch failed');
          return res.json();
        })
        .then((res) => {
          const normalizedData: Record<string, number> = {};
          for (const [k, v] of Object.entries(res.data)) {
            normalizedData[k.toLowerCase()] = v as number;
          }
          setCropData(normalizedData);
          
          const values = Object.values(normalizedData).filter(v => typeof v === 'number' && v > 0) as number[];
          if (values.length > 0) {
            const min = Math.min(...values);
            const max = Math.max(...values);
            const scale = scaleSequential(interpolateYlGn).domain([min, max]);
            setCropColorScale(() => scale);
          }
        })
        .catch(err => {
          console.error("Error fetching crop yield:", err);
          setCropData({});
        });
    }
  }, [activeLayer, selectedCrop, selectedYear]);

  // Fetch rainfall data
  useEffect(() => {
    if (activeLayer === 'rainfall' && Object.keys(rainfallData).length === 0) {
      fetch(`${API_URL}/data/rainfall`)
        .then(res => {
          if (!res.ok) throw new Error('Data fetch failed');
          return res.json();
        })
        .then((res) => {
          const normalizedData: Record<string, number> = {};
          for (const [k, v] of Object.entries(res.data)) {
            normalizedData[k.toLowerCase()] = v as number;
          }
          setRainfallData(normalizedData);
          const values = Object.values(normalizedData).filter(v => typeof v === 'number' && v > 0) as number[];
          if (values.length > 0) {
            const min = Math.min(...values);
            const max = Math.max(...values);
            // Cap visual max to 4000mm to not let MEGHALAYA skew the whole scale
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

  // Convert hex rgb string to deck.gl color array [r, g, b, a]
  const hexToDeckColor = (hex: string): [number, number, number, number] => {
    if (!hex) return [200, 200, 200, 150]; // default gray
    
    // Parse rgb(r, g, b) string from d3-scale if necessary
    if (hex.startsWith('rgb')) {
        const match = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
            return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3]), 255];
        }
    }
    
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b, 255];
  };

  // Initialize deck.gl with GlobeView
  useEffect(() => {
    if (!containerRef) return;

    const deckInstance = new Deck({
      parent: containerRef,
      views: new GlobeView({ id: 'globe', resolution: 10 }),
      initialViewState: INITIAL_VIEW_STATE,
      controller: true,
      style: { width: '100%', height: '100%' },
      getTooltip: () => null,
    });

    setDeck(deckInstance);

    return () => {
      deckInstance.finalize();
    };
  }, [containerRef]);

  // Update layers when data changes
  useEffect(() => {
    if (!deck) return;

    const basemapLayers = [
      new GeoJsonLayer({
        id: 'base-globe',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]],
            ],
          },
          properties: {},
        },
        filled: true,
        stroked: false,
        getFillColor: [240, 249, 255, 255],
        pickable: false,
      }),
      ...(worldGeoData
        ? [
            new GeoJsonLayer({
              id: 'world-countries',
              data: worldGeoData,
              filled: true,
              stroked: true,
              pickable: false,
              getFillColor: [243, 244, 246, 255],
              getLineColor: [209, 213, 219, 255],
              getLineWidth: 600,
              lineWidthMinPixels: 0.5,
              lineWidthMaxPixels: 1.5,
            }),
          ]
        : []),
    ];

    let dataLayer;

    if (activeLayer === 'drought' && stateGeoData) {
      dataLayer = new GeoJsonLayer({
        id: 'india-drought-choropleth',
        data: stateGeoData,
        filled: true,
        stroked: true,
        pickable: true,
        getFillColor: (f: any) => {
          const stateName = f.properties?.NAME_1 || '';
          const spei = INDIA_DROUGHT_DATA[stateName] ?? 0;
          return getSpeiColor(spei);
        },
        getLineColor: [255, 255, 255, 60],
        getLineWidth: 800,
        lineWidthMinPixels: 0.5,
        lineWidthMaxPixels: 2,
        onHover: (info: any) => {
          if (info.object) {
            const stateName = info.object.properties?.NAME_1 || 'Unknown';
            const spei = INDIA_DROUGHT_DATA[stateName] ?? 0;
            setHoverInfo({
              x: info.x,
              y: info.y,
              state: stateName,
              spei,
              category: getDroughtCategory(spei),
            });
          } else {
            setHoverInfo(null);
          }
        },
        updateTriggers: {
          getFillColor: [INDIA_DROUGHT_DATA],
        },
      });
    } else if (activeLayer === 'crop' && districtGeoData && cropColorScale) {
        dataLayer = new GeoJsonLayer({
            id: 'india-crop-choropleth',
            data: districtGeoData,
            filled: true,
            stroked: true,
            pickable: true,
            getFillColor: (f: any) => {
                const distName = f.properties?.NAME_2 || '';
                const yieldVal = findMapValue(distName, cropData);
                if (yieldVal !== undefined && yieldVal > 0) {
                    return hexToDeckColor(cropColorScale(yieldVal));
                }
                return [220, 220, 220, 100]; 
            },
            getLineColor: [255, 255, 255, 40],
            getLineWidth: 200,
            lineWidthMinPixels: 0.2,
            lineWidthMaxPixels: 1,
            onHover: (info: any) => {
              if (info.object) {
                const distName = info.object.properties?.NAME_2 || 'Unknown';
                const stateName = info.object.properties?.NAME_1 || 'Unknown';
                const yieldValue = findMapValue(distName, cropData) ?? 0;
                setHoverInfo({
                  x: info.x,
                  y: info.y,
                  state: stateName,
                  district: distName,
                  yieldValue,
                });
              } else {
                setHoverInfo(null);
              }
            },
            updateTriggers: {
              getFillColor: [cropData, cropColorScale],
            },
          });
    } else if (activeLayer === 'rainfall' && districtGeoData && rainfallColorScale) {
        dataLayer = new GeoJsonLayer({
            id: 'india-rainfall-choropleth',
            data: districtGeoData,
            filled: true,
            stroked: true,
            pickable: true,
            getFillColor: (f: any) => {
                const distName = f.properties?.NAME_2 || '';
                const rainVal = findMapValue(distName, rainfallData);
                if (rainVal !== undefined && rainVal > 0) {
                    return hexToDeckColor(rainfallColorScale(rainVal));
                }
                return [220, 220, 220, 100]; 
            },
            getLineColor: [255, 255, 255, 40],
            getLineWidth: 200,
            lineWidthMinPixels: 0.2,
            lineWidthMaxPixels: 1,
            onHover: (info: any) => {
              if (info.object) {
                const distName = info.object.properties?.NAME_2 || 'Unknown';
                const stateName = info.object.properties?.NAME_1 || 'Unknown';
                
                const rainfallValue = findMapValue(distName, rainfallData);

                setHoverInfo({
                  x: info.x,
                  y: info.y,
                  state: stateName,
                  district: distName,
                  rainfallValue,
                });
              } else {
                setHoverInfo(null);
              }
            },
            updateTriggers: {
              getFillColor: [rainfallData, rainfallColorScale],
            },
          });
    }

    deck.setProps({ layers: [...basemapLayers, ...(dataLayer ? [dataLayer] : [])] });
  }, [deck, stateGeoData, districtGeoData, worldGeoData, activeLayer, cropData, cropColorScale, rainfallData, rainfallColorScale]);


  return (
    <div className="india-map-wrapper" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* deck.gl canvas container */}
      <div
        ref={setContainerRef}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
      />
      
      {/* Configuration Control Panel */}
      <div 
        style={{
            position: 'absolute', 
            top: 20, 
            right: 80, 
            zIndex: 10,
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Map Layers</h3>
        
        <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#4b5563' }}>Data View</label>
            <select 
                value={activeLayer} 
                onChange={(e) => setActiveLayer(e.target.value as 'drought' | 'crop' | 'rainfall')}
                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            >
                <option value="drought">State Drought Index (SPEI)</option>
                <option value="crop">District Crop Yield History</option>
                <option value="rainfall">District Rainfall (Annual Avg)</option>
            </select>
        </div>

        {activeLayer === 'crop' && (
            <>
                <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#4b5563' }}>Crop Type</label>
                    <select 
                        value={selectedCrop} 
                        onChange={(e) => setSelectedCrop(e.target.value)}
                        style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                    >
                        {CROP_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#4b5563' }}>Year ({selectedYear})</label>
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

      {/* Tooltip */}
      {hoverInfo && (
        <div
          className="map-tooltip"
          style={{
            position: 'absolute',
            left: hoverInfo.x + 12,
            top: hoverInfo.y - 12,
            background: 'white',
            border: '1px solid #ccc',
            padding: '8px',
            borderRadius: '4px',
            pointerEvents: 'none',
            fontSize: '12px',
            zIndex: 100
          }}
        >
          {activeLayer === 'drought' && (
              <>
                <div className="tooltip-state" style={{ fontWeight: 'bold' }}>{hoverInfo.state}</div>
                <div className="tooltip-row">
                    <span className="tooltip-label">SPEI: </span>
                    <span
                    className="tooltip-value"
                    style={{
                        color: hoverInfo.spei !== undefined && hoverInfo.spei < -0.5
                        ? '#b45309'
                        : hoverInfo.spei !== undefined && hoverInfo.spei > 0.5
                            ? '#166534'
                            : '#78716c',
                    }}
                    >
                    {hoverInfo.spei?.toFixed(2)}
                    </span>
                </div>
                <div className="tooltip-category">{hoverInfo.category}</div>
              </>
          )}
          {activeLayer === 'crop' && (
              <>
                <div style={{ fontWeight: 'bold' }}>{hoverInfo.district}, {hoverInfo.state}</div>
                <div>Yield: {hoverInfo.yieldValue ? `${hoverInfo.yieldValue.toFixed(1)} Kg/ha` : 'No Data'}</div>
              </>
          )}
          {activeLayer === 'rainfall' && (
              <>
                <div style={{ fontWeight: 'bold' }}>{hoverInfo.district}, {hoverInfo.state}</div>
                <div>Annual Rainfall: {hoverInfo.rainfallValue ? `${hoverInfo.rainfallValue.toFixed(1)} mm` : 'No Data'}</div>
              </>
          )}
        </div>
      )}

      {/* Legend for Drought Index */}
      {activeLayer === 'drought' && (
        <div className="map-legend" style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            background: 'white',
            padding: '12px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            zIndex: 10
        }}>
            <div className="legend-title" style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Drought Index (SPEI)</div>
            {LEGEND_ITEMS.map((item) => (
            <div key={item.label} className="legend-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                <span
                className="legend-swatch"
                style={{ backgroundColor: item.color, width: '16px', height: '16px', display: 'inline-block', marginRight: '8px' }}
                />
                <span className="legend-label" style={{ fontSize: '12px' }}>{item.label}</span>
            </div>
            ))}
        </div>
      )}
    </div>
  );
}
