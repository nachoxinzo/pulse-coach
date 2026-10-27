/**
 * Detector y Analizador de Puertos y Subidas (ClimbPro / Strava Standard)
 * Extrae y clasifica automáticamente los puertos, cotas y repechos a partir
 * del perfil altimétrico de una ruta para su previsualización en la interfaz.
 * 
 * NOTA: Este módulo es exclusivamente para análisis y previsualización en UI.
 * No modifica los archivos descargables (GPX/TCX) ni añade coursePoints externos.
 */

export type ClimbCategory = 'HC' | 'Cat 1' | 'Cat 2' | 'Cat 3' | 'Cat 4' | 'Repecho';

export interface GradientSector {
  startKm: number;
  endKm: number;
  lengthM: number;
  gradientPct: number;
  colorHex: string;
  label: string;
}

export interface DetectedClimb {
  id: string;
  order: number;
  name: string;
  category: ClimbCategory;
  categoryBadge: {
    label: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
  };
  startKm: number;
  endKm: number;
  lengthKm: number;
  elevationGainM: number;
  startElevationM: number;
  summitElevationM: number;
  avgGradientPct: number;
  maxGradientPct: number;
  climbScore: number;
  sectors: GradientSector[];
  startCoord?: [number, number]; // [lat, lng]
  summitCoord?: [number, number];
}

export interface ElevationPoint {
  distanceKm: number;
  elevationM: number;
  lat?: number;
  lng?: number;
}

/**
 * Devuelve el color y etiqueta para un porcentaje de pendiente
 */
export function getGradientVisual(pct: number): { colorHex: string; label: string } {
  if (pct <= 3.0) {
    return { colorHex: '#10b981', label: 'Suave (0-3%)' }; // Verde esmeralda
  } else if (pct <= 6.0) {
    return { colorHex: '#0284c7', label: 'Moderada (3-6%)' }; // Azul
  } else if (pct <= 9.0) {
    return { colorHex: '#f59e0b', label: 'Exigente (6-9%)' }; // Ámbar
  } else if (pct <= 12.0) {
    return { colorHex: '#ef4444', label: 'Dura (9-12%)' }; // Rojo
  } else {
    return { colorHex: '#7c3aed', label: 'Muro (>12%)' }; // Morado oscuro
  }
}

/**
 * Determina la categoría oficial UCI / FIETS según el Climb Score
 */
function classifyClimbCategory(score: number, avgGrad: number, lenKm: number): {
  category: ClimbCategory;
  badge: DetectedClimb['categoryBadge'];
} {
  if (score >= 100000 || (lenKm >= 9 && avgGrad >= 7.5)) {
    return {
      category: 'HC',
      badge: {
        label: 'Fuera de Categoría (HC)',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-900',
        borderColor: 'border-purple-300',
      },
    };
  } else if (score >= 64000 || (lenKm >= 6.5 && avgGrad >= 7.0)) {
    return {
      category: 'Cat 1',
      badge: {
        label: '1ª Categoría',
        bgColor: 'bg-rose-100',
        textColor: 'text-rose-900',
        borderColor: 'border-rose-300',
      },
    };
  } else if (score >= 32000 || (lenKm >= 4.5 && avgGrad >= 6.0)) {
    return {
      category: 'Cat 2',
      badge: {
        label: '2ª Categoría',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-900',
        borderColor: 'border-orange-300',
      },
    };
  } else if (score >= 15000 || (lenKm >= 2.5 && avgGrad >= 5.0)) {
    return {
      category: 'Cat 3',
      badge: {
        label: '3ª Categoría',
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-900',
        borderColor: 'border-amber-300',
      },
    };
  } else if (score >= 6500 || (lenKm >= 1.2 && avgGrad >= 4.0)) {
    return {
      category: 'Cat 4',
      badge: {
        label: '4ª Categoría',
        bgColor: 'bg-sky-100',
        textColor: 'text-sky-900',
        borderColor: 'border-sky-300',
      },
    };
  } else {
    return {
      category: 'Repecho',
      badge: {
        label: 'Cota / Repecho',
        bgColor: 'bg-emerald-100',
        textColor: 'text-emerald-900',
        borderColor: 'border-emerald-300',
      },
    };
  }
}

/**
 * Extrae y analiza las subidas y puertos de un perfil altimétrico
 */
export function extractClimbsFromProfile(
  profile: ElevationPoint[],
  coordinates?: [number, number][]
): DetectedClimb[] {
  if (!profile || profile.length < 4) return [];

  // 1. Calcular segmentos elementales entre puntos del perfil
  const segments: {
    startIdx: number;
    endIdx: number;
    startKm: number;
    endKm: number;
    dDistKm: number;
    dDistM: number;
    startEle: number;
    endEle: number;
    dEleM: number;
    gradPct: number;
  }[] = [];

  for (let i = 1; i < profile.length; i++) {
    const p1 = profile[i - 1];
    const p2 = profile[i];
    const dDistKm = Math.max(0.001, p2.distanceKm - p1.distanceKm);
    const dDistM = dDistKm * 1000;
    const dEleM = p2.elevationM - p1.elevationM;
    const gradPct = Number(((dEleM / dDistM) * 100).toFixed(1));

    segments.push({
      startIdx: i - 1,
      endIdx: i,
      startKm: p1.distanceKm,
      endKm: p2.distanceKm,
      dDistKm,
      dDistM,
      startEle: p1.elevationM,
      endEle: p2.elevationM,
      dEleM,
      gradPct,
    });
  }

  // 2. Detección continua de inicio y fin de puerto
  const climbs: DetectedClimb[] = [];
  let inClimb = false;
  let climbStartSegIdx = 0;
  let descentBufferKm = 0;
  let climbSegments: typeof segments = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];

    if (!inClimb) {
      // Inicia subida si la pendiente es sostenida (>= 2.5%)
      if (seg.gradPct >= 2.5) {
        inClimb = true;
        climbStartSegIdx = i;
        descentBufferKm = 0;
        climbSegments = [seg];
      }
    } else {
      climbSegments.push(seg);

      if (seg.gradPct <= 0) {
        descentBufferKm += seg.dDistKm;
        // Si el tramo de bajada supera los 350m o alcanzamos el final de la ruta, consolidamos la subida
        if (descentBufferKm > 0.35 || i === segments.length - 1) {
          // Retroceder los segmentos de bajada al final para encontrar la cima exacta
          while (climbSegments.length > 1 && climbSegments[climbSegments.length - 1].gradPct <= 0) {
            climbSegments.pop();
          }

          if (climbSegments.length > 0) {
            const startPt = profile[climbSegments[0].startIdx];
            const summitPt = profile[climbSegments[climbSegments.length - 1].endIdx];
            const lenKm = summitPt.distanceKm - startPt.distanceKm;
            const eleGain = summitPt.elevationM - startPt.elevationM;
            const avgGrad = lenKm > 0 ? (eleGain / (lenKm * 1000)) * 100 : 0;
            const score = Math.round(lenKm * 1000 * avgGrad);

            // Criterio de validación: al menos 400m de longitud, desnivel positivo >= 20m y media >= 2.8%
            if (lenKm >= 0.4 && eleGain >= 20 && avgGrad >= 2.8) {
              const maxGrad = Math.max(...climbSegments.map((s) => s.gradPct));
              const { category, badge } = classifyClimbCategory(score, avgGrad, lenKm);

              // Subdivisión de sectores coloreados por pendiente
              const sectors: GradientSector[] = climbSegments.map((s) => {
                const visual = getGradientVisual(s.gradPct);
                return {
                  startKm: Math.round(s.startKm * 10) / 10,
                  endKm: Math.round(s.endKm * 10) / 10,
                  lengthM: Math.round(s.dDistM),
                  gradientPct: s.gradPct,
                  colorHex: visual.colorHex,
                  label: visual.label,
                };
              });

              // Coordenadas geográficas si están disponibles
              let startCoord: [number, number] | undefined = undefined;
              let summitCoord: [number, number] | undefined = undefined;

              if (coordinates && coordinates.length > 0) {
                const totalDistKm = profile[profile.length - 1].distanceKm;
                const startRatio = Math.min(1, Math.max(0, startPt.distanceKm / totalDistKm));
                const endRatio = Math.min(1, Math.max(0, summitPt.distanceKm / totalDistKm));

                const startCoordIdx = Math.min(coordinates.length - 1, Math.floor(startRatio * (coordinates.length - 1)));
                const endCoordIdx = Math.min(coordinates.length - 1, Math.floor(endRatio * (coordinates.length - 1)));

                startCoord = coordinates[startCoordIdx];
                summitCoord = coordinates[endCoordIdx];
              }

              const order = climbs.length + 1;
              const name = `Subida ${order} (Km ${startPt.distanceKm.toFixed(1)})`;

              climbs.push({
                id: `climb-${order}-${startPt.distanceKm.toFixed(1)}k`,
                order,
                name,
                category,
                categoryBadge: badge,
                startKm: Number(startPt.distanceKm.toFixed(1)),
                endKm: Number(summitPt.distanceKm.toFixed(1)),
                lengthKm: Number(lenKm.toFixed(1)),
                elevationGainM: Math.round(eleGain),
                startElevationM: Math.round(startPt.elevationM),
                summitElevationM: Math.round(summitPt.elevationM),
                avgGradientPct: Number(avgGrad.toFixed(1)),
                maxGradientPct: Number(maxGrad.toFixed(1)),
                climbScore: score,
                sectors,
                startCoord,
                summitCoord,
              });
            }
          }

          inClimb = false;
          descentBufferKm = 0;
          climbSegments = [];
        }
      } else {
        descentBufferKm = 0;
      }
    }
  }

  return climbs;
}
