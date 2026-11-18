
import L from 'leaflet';

export function renderRouteMap(
  container: HTMLElement,
  coordinates: [number, number][]
): L.Map | null {
  if (coordinates.length < 2) {
    container.textContent = 'No hay suficientes puntos para mostrar esta ruta.';
    return null;
  }

  const map = L.map(container).setView(coordinates[0], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const route = L.polyline(coordinates, {
    color: '#ff6b35',
    weight: 5,
    opacity: 0.9
  }).addTo(map);

  L.circleMarker(coordinates[0], {
    radius: 7,
    color: '#ffffff',
    fillColor: '#22c55e',
    fillOpacity: 1
  }).addTo(map);

  L.circleMarker(coordinates[coordinates.length - 1], {
    radius: 7,
    color: '#ffffff',
    fillColor: '#ef4444',
    fillOpacity: 1
  }).addTo(map);

  map.fitBounds(route.getBounds(), { padding: [25, 25] });

  return map;
}
