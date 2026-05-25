import { LineLayer } from '@deck.gl/layers';

function saturationColor(saturation = 0) {
  if (saturation < 0.6) return [34, 197, 94, 220];
  if (saturation < 0.8) return [234, 179, 8, 220];
  return [239, 68, 68, 220];
}

export function buildTrafficLayer(data) {
  return new LineLayer({
    id: 'traffic-layer',
    data,
    pickable: true,
    getSourcePosition: (d) => d.source,
    getTargetPosition: (d) => d.target,
    getColor: (d) => saturationColor(d.saturation),
    getWidth: (d) => Math.max(1, (d.volume || 0) / 120),
    widthMinPixels: 1,
    widthMaxPixels: 10
  });
}
