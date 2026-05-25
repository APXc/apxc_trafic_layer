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

export default function MapView({ trafficData }) {
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
      center: [9.67, 45.69],
      zoom: 12
    });

    const deck = new Deck({
      parent: deckContainerRef.current,
      views: [new DeckMapView({ repeat: true })],
      controller: false,
      initialViewState: { longitude: 9.67, latitude: 45.69, zoom: 12, bearing: 0, pitch: 0 },
      layers: []
    });

    map.on('move', () => {
      const center = map.getCenter();
      deck.setProps({
        viewState: {
          longitude: center.lng,
          latitude: center.lat,
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
