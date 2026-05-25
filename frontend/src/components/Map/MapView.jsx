import { useEffect, useMemo, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { Deck, MapView as DeckMapView } from '@deck.gl/core';
import 'maplibre-gl/dist/maplibre-gl.css';
import { buildTrafficLayer } from './TrafficLayer';

const OSM_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors'
    }
  },
  layers: [
    {
      id: 'osm-tiles',
      type: 'raster',
      source: 'osm'
    }
  ]
};

export default function MapView({ trafficData, center = [9.67, 45.69] }) {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const deckRef = useRef(null);
  const deckContainerRef = useRef(null);

  const layers = useMemo(() => [buildTrafficLayer(trafficData || [])], [trafficData]);

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current || !deckContainerRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: OSM_STYLE,
      center,
      zoom: 13
    });

    const deck = new Deck({
      parent: deckContainerRef.current,
      views: [new DeckMapView({ repeat: true })],
      controller: false,
      initialViewState: { longitude: center[0], latitude: center[1], zoom: 13, bearing: 0, pitch: 0 },
      layers: []
    });

    map.on('move', () => {
      const c = map.getCenter();
      deck.setProps({
        viewState: {
          longitude: c.lng,
          latitude: c.lat,
          zoom: map.getZoom(),
          bearing: map.getBearing(),
          pitch: map.getPitch()
        }
      });
    });

    mapRef.current = map;
    deckRef.current = deck;

    return () => {
      deck.finalize();
      map.remove();
      deckRef.current = null;
      mapRef.current = null;
    };
  }, []);

  // Re-center map when municipality changes
  useEffect(() => {
    if (mapRef.current && center) {
      mapRef.current.flyTo({ center, zoom: 13, duration: 1500 });
    }
  }, [center[0], center[1]]);

  useEffect(() => {
    if (deckRef.current) {
      deckRef.current.setProps({ layers });
    }
  }, [layers]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full" />
      <div ref={deckContainerRef} className="pointer-events-none absolute inset-0" />
    </div>
  );
}
