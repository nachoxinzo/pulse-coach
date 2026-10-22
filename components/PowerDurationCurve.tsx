'use client';

import React, { useState } from 'react';
import { 
  Zap, 
  TrendingUp, 
  Gauge, 
  HelpCircle, 
  ChevronRight, 
  ShieldCheck, 
  Award, 
  Info,
  Calendar,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import { ActivitySession } from '@/types';

interface PowerDurationCurveProps {
  activities?: ActivitySession[];
  userWeightKg?: number;
}

export interface PowerPoint {
  durationLabel: string;
  durationSec: number;
  watts: number;
  wattsPerKg: number;
  dateAchieved: string;
  sourceActivity: string;
  zoneName: string;
  zoneColor: string;
}

export function PowerDurationCurve({ 
  activities = [],
  userWeightKg = 70 
}: PowerDurationCurveProps) {
  const [sportFilter, setSportFilter] = useState<'cycling' | 'running'>('cycling');
  const [selectedPointIndex, setSelectedPointIndex] = useState<number>(3); // Default 20m

  // Datos base calibrados fisiológicamente
  const cyclingCurve: PowerPoint[] = [
    {
      durationLabel: '5 seg',
      durationSec: 5,
      watts: 820,
      wattsPerKg: Number((820 / userWeightKg).toFixed(1)),
      dateAchieved: '14 Abr 2026',
      sourceActivity: 'Sprint Final en Alto do Furco',
      zoneName: 'Neuromuscular (Pmax)',
      zoneColor: '#EF4444'
    },
    {
      durationLabel: '1 min',
      durationSec: 60,
      watts: 460,
      wattsPerKg: Number((460 / userWeightKg).toFixed(1)),
      dateAchieved: '02 May 2026',
      sourceActivity: 'Ataque en Repecho de Vilar',
      zoneName: 'Capacidad Anaeróbica',
      zoneColor: '#F97316'
    },
    {
      durationLabel: '5 min',
      durationSec: 300,
      watts: 325,
      wattsPerKg: Number((325 / userWeightKg).toFixed(1)),
      dateAchieved: '18 May 2026',
      sourceActivity: 'Subida a Santa Mariña',
      zoneName: 'Potencia Aeróbica (VO2 Máx)',
      zoneColor: '#FBBF24'
    },
    {
      durationLabel: '20 min',
      durationSec: 1200,
      watts: 272,
      wattsPerKg: Number((272 / userWeightKg).toFixed(1)),
      dateAchieved: '24 May 2026',
      sourceActivity: 'Test Contrarreloj Xinzo',
      zoneName: 'Umbral de Lactato (FTP Test)',
      zoneColor: '#34D399'
    },
    {
      durationLabel: '60 min',
      durationSec: 3600,
      watts: 254,
      wattsPerKg: Number((254 / userWeightKg).toFixed(1)),
      dateAchieved: '10 Jun 2026',
      sourceActivity: 'Gran Fondo Serra de San Mamede',
      zoneName: 'Umbral Funcional (FTP Real)',
      zoneColor: '#38BDF8'
    }
  ];

  const runningCurve: PowerPoint[] = [
    {
      durationLabel: '5 seg',
      durationSec: 5,
      watts: 480,
      wattsPerKg: Number((480 / userWeightKg).toFixed(1)),
      dateAchieved: '10 Abr 2026',
      sourceActivity: 'Aceleración en cuesta',
      zoneName: 'Potencia Reactiva',
      zoneColor: '#EF4444'
    },
    {
      durationLabel: '1 min',
      durationSec: 60,
      watts: 385,
      wattsPerKg: Number((385 / userWeightKg).toFixed(1)),
      dateAchieved: '28 Abr 2026',
      sourceActivity: 'Series de 400m pista',
      zoneName: 'Glucolítico Rápido',
      zoneColor: '#F97316'
    },
    {
      durationLabel: '5 min',
      durationSec: 300,
      watts: 310,
      wattsPerKg: Number((310 / userWeightKg).toFixed(1)),
      dateAchieved: '15 May 2026',
      sourceActivity: 'Milla a ritmo de 10K',
      zoneName: 'VO2 Máx Running',
      zoneColor: '#FBBF24'
    },
    {
      durationLabel: '20 min',
      durationSec: 1200,
      watts: 265,
      wattsPerKg: Number((265 / userWeightKg).toFixed(1)),
      dateAchieved: '01 Jun 2026',
      sourceActivity: '5K Tempo continuado',
      zoneName: 'Potencia Crítica (CP)',
      zoneColor: '#34D399'
    },
    {
      durationLabel: '60 min',
      durationSec: 3600,
      watts: 242,
      wattsPerKg: Number((242 / userWeightKg).toFixed(1)),
      dateAchieved: '12 Jun 2026',
      sourceActivity: 'Tirada Larga 15k Asfalto',
      zoneName: 'Base Aeróbica Máxima',
      zoneColor: '#38BDF8'
    }
  ];

  const currentCurve = sportFilter === 'cycling' ? cyclingCurve : runningCurve;
  const p20Watts = currentCurve[3].watts;
  // Fisiología: FTP = 95% del mejor esfuerzo sostenido de 20 minutos
  const estimatedFtp = Math.round(p20Watts * 0.95);
  const estimatedFtpWkg = Number((estimatedFtp / userWeightKg).toFixed(2));

  // Clasificación Coggan / Hunter Allen
  let rankLabel = 'Entrenado (Cat 4)';
  if (estimatedFtpWkg >= 4.5) rankLabel = 'Élite Nacional (Cat 1)';
  else if (estimatedFtpWkg >= 3.8) rankLabel = 'Competitivo Avanzado (Cat 2)';
  else if (estimatedFtpWkg >= 3.2) rankLabel = 'Cicloturista Experimentado (Cat 3)';
  else if (estimatedFtpWkg >= 2.5) rankLabel = 'Entrenado Regular (Cat 4)';
  else rankLabel = 'Base Inicial (Cat 5)';

  const activePoint = currentCurve[selectedPointIndex];

  // Coordenadas para el SVG interactivo de la curva
  // Eje X: 5 puntos equidistantes (10%, 30%, 50%, 70%, 90%)
  const maxW = Math.max(...currentCurve.map(p => p.watts)) * 1.05;
  const svgWidth = 500;
  const svgHeight = 160;
  const paddingX = 40;
  const paddingY = 25;
  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY * 2;

  const points = currentCurve.map((p, idx) => {
    const x = paddingX + (idx / (currentCurve.length - 1)) * chartW;
    const y = paddingY + (1 - (p.watts / maxW)) * chartH;
    return { x, y, ...p };
  });

  const pathD = points.reduce((acc, curr, idx, arr) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    const prev = arr[idx - 1];
    const cp1x = prev.x + (curr.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (curr.x - prev.x) / 2;
    const cp2y = curr.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`;

  return (
    <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-6">
      
      {/* Cabecera y Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Power Duration Curve & FTP
            </span>
            <span className="text-xs text-slate-400">Protocolo Dr. Andrew Coggan</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <span>Curva de Potencia Crítica & Estimador de FTP</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Máximos vatios sostenidos por intervalo de tiempo. Base para definir zonas de entrenamiento y umbrales fisiológicos.
          </p>
        </div>

        {/* Selector de deporte */}
        <div className="flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 text-xs">
          <button
            onClick={() => { setSportFilter('cycling'); setSelectedPointIndex(3); }}
            className={`px-3 py-1.5 rounded-md font-bold transition-all ${
              sportFilter === 'cycling'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Ciclismo / Rodillo
          </button>
          <button
            onClick={() => { setSportFilter('running'); setSelectedPointIndex(3); }}
            className={`px-3 py-1.5 rounded-md font-bold transition-all ${
              sportFilter === 'running'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Running (Stryd/Garmin)
          </button>
        </div>
      </div>

      {/* Tarjetas KPI de FTP y Potencia Relativa */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* FTP Estimado */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">FTP Calculado (95% P20)</span>
          <div className="flex items-baseline gap-1.5">
            <strong className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {estimatedFtp}
            </strong>
            <span className="text-xs font-bold text-amber-500">Watios</span>
          </div>
          <span className="text-[11px] text-slate-500 block truncate mt-0.5">
            Umbral Funcional en estado estable
          </span>
        </div>

        {/* Relación W/kg */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Potencia Relativa</span>
          <div className="flex items-baseline gap-1.5">
            <strong className="text-xl sm:text-2xl font-black text-cyan-600 dark:text-cyan-400 tabular-nums">
              {estimatedFtpWkg}
            </strong>
            <span className="text-xs font-bold text-slate-500">W/kg</span>
          </div>
          <span className="text-[11px] text-slate-500 block truncate mt-0.5">
            Basado en atleta de {userWeightKg} kg
          </span>
        </div>

        {/* Rango Competitivo */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Perfil Fisiológico</span>
          <strong className="text-sm sm:text-base font-black text-slate-900 dark:text-white block mt-1">
            {rankLabel}
          </strong>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block truncate mt-0.5">
            Excelente base aeróbica
          </span>
        </div>

        {/* Sprint Pico (5s) */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Pico Neuromuscular (5s)</span>
          <div className="flex items-baseline gap-1.5">
            <strong className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 tabular-nums">
              {currentCurve[0].watts}
            </strong>
            <span className="text-xs font-bold text-slate-500">W ({currentCurve[0].wattsPerKg} W/kg)</span>
          </div>
          <span className="text-[11px] text-slate-500 block truncate mt-0.5">
            Sprint explosivo
          </span>
        </div>

      </div>

      {/* Gráfico SVG de la Curva de Potencia */}
      <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-950 text-white space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              Curva de Duración de Potencia (Mean Maximal Power - MMP)
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Pulsa en cada punto para ver el récord</span>
        </div>

        {/* SVG Viewport */}
        <div className="w-full overflow-hidden">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-44 select-none">
            <defs>
              <linearGradient id="powerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Guías horizontales de potencia */}
            <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="#334155" strokeDasharray="3 3" strokeWidth="0.75" />
            <line x1={paddingX} y1={paddingY + chartH * 0.5} x2={svgWidth - paddingX} y2={paddingY + chartH * 0.5} stroke="#334155" strokeDasharray="3 3" strokeWidth="0.75" />
            <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="#475569" strokeWidth="1" />

            {/* Relleno y Línea de la curva */}
            <path d={areaD} fill="url(#powerGrad)" />
            <path d={pathD} fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Puntos interactivos */}
            {points.map((p, idx) => {
              const isSelected = idx === selectedPointIndex;
              return (
                <g 
                  key={p.durationLabel} 
                  className="cursor-pointer group"
                  onClick={() => setSelectedPointIndex(idx)}
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isSelected ? 6 : 4}
                    fill={isSelected ? '#00E5FF' : '#F59E0B'}
                    stroke="#0F172A"
                    strokeWidth="2"
                    className="transition-all"
                  />
                  {/* Etiqueta de vatios sobre el punto */}
                  <text
                    x={p.x}
                    y={p.y - 10}
                    textAnchor="middle"
                    className={`text-[10px] font-bold ${isSelected ? 'fill-cyan-300 font-black' : 'fill-slate-400'}`}
                  >
                    {p.watts}W
                  </text>
                  {/* Etiqueta de duración debajo */}
                  <text
                    x={p.x}
                    y={svgHeight - 8}
                    textAnchor="middle"
                    className={`text-[10px] font-bold ${isSelected ? 'fill-white' : 'fill-slate-500'}`}
                  >
                    {p.durationLabel}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Tarjeta de Detalle del Esfuerzo Seleccionado */}
        <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{activePoint.durationLabel}: {activePoint.watts} Watios</span>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${activePoint.zoneColor}25`, color: activePoint.zoneColor }}>
                {activePoint.zoneName}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>{activePoint.sourceActivity}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-500">{activePoint.dateAchieved}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 tabular-nums border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Potencia Relativa</span>
              <strong className="text-sm font-black text-cyan-400">{activePoint.wattsPerKg} W/kg</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">% Respecto a FTP</span>
              <strong className="text-sm font-black text-amber-400">
                {Math.round((activePoint.watts / estimatedFtp) * 100)}%
              </strong>
            </div>
          </div>
        </div>

      </div>

      {/* Tabla Resumen de Intervalos Críticos */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
              <th className="py-2 pr-3">Duración</th>
              <th className="py-2 px-3">Potencia Máx</th>
              <th className="py-2 px-3">W/kg</th>
              <th className="py-2 px-3">Zona Fisiológica</th>
              <th className="py-2 pl-3 text-right">Sesión Récord</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium tabular-nums">
            {currentCurve.map((point, idx) => (
              <tr 
                key={point.durationLabel}
                onClick={() => setSelectedPointIndex(idx)}
                className={`cursor-pointer transition-colors ${
                  idx === selectedPointIndex 
                    ? 'bg-amber-50/60 dark:bg-amber-950/20' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <td className="py-2.5 pr-3 font-black text-slate-900 dark:text-white">
                  {point.durationLabel}
                </td>
                <td className="py-2.5 px-3 font-bold text-amber-600 dark:text-amber-400">
                  {point.watts} W
                </td>
                <td className="py-2.5 px-3 font-semibold text-cyan-600 dark:text-cyan-400">
                  {point.wattsPerKg} W/kg
                </td>
                <td className="py-2.5 px-3">
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    {point.zoneName}
                  </span>
                </td>
                <td className="py-2.5 pl-3 text-right text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-[180px]">
                  {point.sourceActivity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
