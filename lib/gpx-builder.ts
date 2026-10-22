import { RoutePoint } from '@/types';

export function buildGpxXml(name: string, points: RoutePoint[]): string {
  const timestamp = new Date().toISOString();
  
  const trkpts = points
    .map(
      (p) =>
        `      <trkpt lat="${p.lat.toFixed(6)}" lon="${p.lng.toFixed(6)}">\n` +
        `        <ele>${p.elevationM.toFixed(1)}</ele>\n` +
        `        <time>${timestamp}</time>\n` +
        `      </trkpt>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Pulse Coach - Garmin &amp; Strava AI Hub"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(name)}</name>
    <time>${timestamp}</time>
    <author>
      <name>Pulse Coach</name>
    </author>
  </metadata>
  <trk>
    <name>${escapeXml(name)}</name>
    <type>Running / Cycling Loop</type>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
