
export interface GpxActivity {
    date: string;
    distance: number;
    duration: number;
    coordinates: [number, number][];
  }
  
  function calculateDistance(
    coordinates: [number, number][]
  ): number {
    const toRadians = (degrees: number) =>
      degrees * Math.PI / 180;
  
    let total = 0;
  
    for (let i = 1; i < coordinates.length; i++) {
      const [lat1, lon1] = coordinates[i - 1];
      const [lat2, lon2] = coordinates[i];
  
      const earthRadius = 6371;
  
      const dLat = toRadians(lat2 - lat1);
      const dLon = toRadians(lon2 - lon1);
  
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) ** 2;
  
      const c = 2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );
  
      total += earthRadius * c;
    }
  
    return total;
  }
  
  export function readGpxFile(file: File): Promise<GpxActivity> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
  
      reader.onload = () => {
        try {
          const content = String(reader.result);
          const xml = new DOMParser().parseFromString(
            content,
            'application/xml'
          );
  
          if (xml.querySelector('parsererror')) {
            throw new Error('El archivo GPX no tiene un formato válido.');
          }
  
          let points = Array.from(xml.getElementsByTagName('trkpt'));
  
          if (points.length === 0) {
            points = Array.from(xml.getElementsByTagName('rtept'));
          }
  
          const coordinates: [number, number][] = points.map(point => [
            Number(point.getAttribute('lat')),
            Number(point.getAttribute('lon'))
          ]);
  
          if (
            coordinates.length < 2 ||
            coordinates.some(([lat, lon]) =>
              !Number.isFinite(lat) ||
              !Number.isFinite(lon) ||
              Math.abs(lat) > 90 ||
              Math.abs(lon) > 180
            )
          ) {
            throw new Error('El GPX no contiene suficientes coordenadas válidas.');
          }
  
          const timestamps = points
            .map(point => point.querySelector('time')?.textContent)
            .filter((value): value is string => Boolean(value))
            .map(value => new Date(value))
            .filter(date => !Number.isNaN(date.getTime()));
  
          let date = new Date().toLocaleDateString('en-CA');
          let duration = 1;
  
          if (timestamps.length > 0) {
            const first = timestamps[0];
            const last = timestamps[timestamps.length - 1];
  
            date = first.toLocaleDateString('en-CA');
            duration = Math.max(
              1,
              Math.round((last.getTime() - first.getTime()) / 60000)
            );
          }
  
          const distance = calculateDistance(coordinates);
  
          if (distance <= 0) {
            throw new Error('No se pudo calcular la distancia del recorrido.');
          }
  
          resolve({
            date,
            distance: Number(distance.toFixed(2)),
            duration,
            coordinates
          });
        } catch (error) {
          reject(error);
        }
      };
  
      reader.onerror = () => {
        reject(new Error('No se pudo leer el archivo.'));
      };
  
      reader.readAsText(file);
    });
  }
  