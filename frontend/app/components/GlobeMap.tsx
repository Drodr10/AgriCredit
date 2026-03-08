'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Deck } from '@deck.gl/core';
import { GeoJsonLayer } from '@deck.gl/layers';
import { _GlobeView as GlobeView } from '@deck.gl/core';
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
  spei: number;
  category: string;
}

interface SelectedState {
  state: string;
  spei: number;
  category: string;
}

export default function GlobeMap() {
  const [geoData, setGeoData] = useState<any>(null);
  const [worldGeoData, setWorldGeoData] = useState<any>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [selectedState, setSelectedState] = useState<SelectedState | null>(null);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [deck, setDeck] = useState<any>(null);

  // Load GeoJSON data
  useEffect(() => {
    fetch('/india-states-simplified.json')
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error('Failed to load India GeoJSON:', err));

    fetch('/world-countries.json')
      .then((res) => res.json())
      .then((data) => setWorldGeoData(data))
      .catch((err) => console.error('Failed to load world GeoJSON:', err));
  }, []);

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
    if (!deck || !geoData) return;

    const layers = [
      // Ocean / globe background
      new GeoJsonLayer({
        id: 'base-globe',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85],
              ],
            ],
          },
          properties: {},
        },
        filled: true,
        stroked: false,
        getFillColor: [240, 249, 255, 255],
        pickable: false,
      }),
      // World country outlines
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
      // India states choropleth
      new GeoJsonLayer({
        id: 'india-drought-choropleth',
        data: geoData,
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
        onClick: (info: any) => {
          if (info.object) {
            const stateName = info.object.properties?.NAME_1 || 'Unknown';
            const spei = INDIA_DROUGHT_DATA[stateName] ?? 0;
            setSelectedState({
              state: stateName,
              spei,
              category: getDroughtCategory(spei),
            });
          }
        },
        updateTriggers: {
          getFillColor: [INDIA_DROUGHT_DATA],
        },
      }),
    ];

    deck.setProps({ layers });
  }, [deck, geoData, worldGeoData]);

  // Get SPEI severity color for the info panel
  const getSeverityColorCSS = (spei: number): string => {
    if (spei <= -1.5) return '#9a3412';
    if (spei <= -0.5) return '#f59e28';
    if (spei <= 0.5) return '#d6d3d1';
    return '#166534';
  };

  return (
    <div className="india-map-wrapper">
      {/* deck.gl canvas container */}
      <div
        ref={setContainerRef}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
      />

      {/* Tooltip */}
      {hoverInfo && (
        <div
          className="map-tooltip"
          style={{
            left: hoverInfo.x + 12,
            top: hoverInfo.y - 12,
          }}
        >
          <div className="tooltip-state">{hoverInfo.state}</div>
          <div className="tooltip-row">
            <span className="tooltip-label">SPEI:</span>
            <span
              className="tooltip-value"
              style={{
                color: hoverInfo.spei < -0.5
                  ? '#b45309'
                  : hoverInfo.spei > 0.5
                    ? '#166534'
                    : '#78716c',
              }}
            >
              {hoverInfo.spei.toFixed(2)}
            </span>
          </div>
          <div className="tooltip-category">{hoverInfo.category}</div>
        </div>
      )}


      {/* Legend */}
      <div className="map-legend">
        <div className="legend-title">Drought Index (SPEI)</div>
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} className="legend-item">
            <span
              className="legend-swatch"
              style={{ backgroundColor: item.color }}
            />
            <span className="legend-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
