/**
 * Algoritmo oficial de Google / Strava para Encoded Polyline y simplificación Douglas-Peucker
 * Reduce un track GPS de miles de puntos a una cadena compacta de texto (ahorro >98% de almacenamiento).
 */

export interface LatLngPoint {
  lat: number;
  lng: number;
}

/**
 * Codifica un array de coordenadas [lat, lng] a la cadena de texto oficial de Google / Strava
 */
export function encodePolyline(points: [number, number][]): string {
  let output = '';
  let prevLat = 0;
  let prevLng = 0;

  for (let i = 0; i < points.length; i++) {
    const [lat, lng] = points[i];
    const latE5 = Math.round(lat * 1e5);
    const lngE5 = Math.round(lng * 1e5);

    output += encodeSignedNumber(latE5 - prevLat);
    output += encodeSignedNumber(lngE5 - prevLng);

    prevLat = latE5;
    prevLng = lngE5;
  }

  return output;
}

/**
 * Decodifica una cadena de Polyline comprimida a un array de coordenadas [lat, lng]
 */
export function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

function encodeSignedNumber(num: number): string {
  let sgn_num = num < 0 ? ~(num << 1) : (num << 1);
  let encodeString = '';
  while (sgn_num >= 0x20) {
    encodeString += String.fromCharCode((0x20 | (sgn_num & 0x1f)) + 63);
    sgn_num >>= 5;
  }
  encodeString += String.fromCharCode(sgn_num + 63);
  return encodeString;
}

/**
 * Algoritmo de Ramer-Douglas-Peucker (RDP) para simplificar coordenadas geográficas
 * Elimina puntos redundantes en rectas conservando con fidelidad todas las curvas.
 * epsilon: tolerancia en grados (0.00008 ≈ 8 metros)
 */
export function simplifyCoordinates(points: [number, number][], epsilon: number = 0.00008): [number, number][] {
  if (points.length <= 2) return points;

  let dmax = 0;
  let index = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(points[i], points[0], points[end]);
    if (d > dmax) {
      index = i;
      dmax = d;
    }
  }

  if (dmax > epsilon) {
    const recResults1 = simplifyCoordinates(points.slice(0, index + 1), epsilon);
    const recResults2 = simplifyCoordinates(points.slice(index), epsilon);
    return recResults1.slice(0, recResults1.length - 1).concat(recResults2);
  } else {
    return [points[0], points[end]];
  }
}

function perpendicularDistance(p: [number, number], p1: [number, number], p2: [number, number]): number {
  let x = p1[0];
  let y = p1[1];
  let dx = p2[0] - x;
  let dy = p2[1] - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = p2[0];
      y = p2[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = p[0] - x;
  dy = p[1] - y;

  return Math.sqrt(dx * dx + dy * dy);
}
