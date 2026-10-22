'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Plus,
  X,
  Layers,
  Activity,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { ActivitySession } from '@/types';
import { estimateAthleteFtp, FtpEstimationResult } from '@/lib/race-power-algorithms';

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
  userWeightKg = 72 
}: PowerDurationCurveProps) {
  const [selectedPointIndex, setSelectedPointIndex] = useState<number>(3); // 20m
  const [userFtp, setUserFtp] = useState<number | null>(null);
  const [isFtpModalOpen, setIsFtpModalOpen] = useState(false);
  const [inputFtp, setInputFtp] = useState('');
  const [showZonesTable, setShowZonesTable] = useState(true);

  // Cargar FTP manual del usuario si existe
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pulse_user_ftp');
      if (stored) {
        setUserFtp(parseInt(stored, 10));
      }
    } catch {
      // Ignorar
    }
  }, []);

  const handleSaveFtp = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(inputFtp, 10);
    if (!isNaN(val) && val >= 50 && val <= 600) {
      setUserFtp(val);
      try {
        localStorage.setItem('pulse_user_ftp', val.toString());
      } catch {
        // Ignorar
      }
      setIsFtpModalOpen(false);
    }
  };

  // Cálculo de FTP mediante algoritmos de vanguardia (Martin et al. 1998, Monod & Scherrer CP, Coggan)
  const ftpResult: FtpEstimationResult = useMemo(() => {
    return estimateAthleteFtp(activities, userWeightKg, userFtp);
  }, [activities, userWeightKg, userFtp]);

  const effectiveFtp = ftpResult.ftpWatts;

  // Generar puntos de la curva de potencia-duración (MMP)
  const curvePoints: PowerPoint[] = useMemo(() => {
    const p5s = ftpResult.best1MinWatts ? Math.round(ftpResult.best1MinWatts * 1.65) : Math.round(effectiveFtp * 2.85);
    const p1m = ftpResult.best1MinWatts || Math.round(effectiveFtp * 1.65);
    const p5m = ftpResult.best5MinWatts || Math.round(effectiveFtp * 1.22);
    const p20m = ftpResult.best20MinWatts || Math.round(effectiveFtp / 0.95);
    const p60m = effectiveFtp;

    const sourceName = ftpResult.methodLabel;
    const todayStr = 'Estimación Actualizada';

    return [
      {
        durationLabel: '5 seg',
        durationSec: 5,
        watts: p5s,
        wattsPerKg: Number((p5s / userWeightKg).toFixed(1)),
        dateAchieved: todayStr,
        sourceActivity: sourceName,
        zoneName: 'Potencia Neuromuscular (Pmax)',
        zoneColor: '#EC4899',
      },
      {
        durationLabel: '1 min',
        durationSec: 60,
        watts: p1m,
        wattsPerKg: Number((p1m / userWeightKg).toFixed(1)),
        dateAchieved: todayStr,
        sourceActivity: sourceName,
        zoneName: 'Capacidad Anaeróbica',
        zoneColor: '#A855F7',
      },
      {
        durationLabel: '5 min',
        durationSec: 300,
        watts: p5m,
        wattsPerKg: Number((p5m / userWeightKg).toFixed(1)),
        dateAchieved: todayStr,
        sourceActivity: sourceName,
        zoneName: 'Potencia VO2 Máx',
        zoneColor: '#EF4444',
      },
      {
        durationLabel: '20 min',
        durationSec: 1200,
        watts: p20m,
        wattsPerKg: Number((p20m / userWeightKg).toFixed(1)),
        dateAchieved: todayStr,
        sourceActivity: sourceName,
        zoneName: 'Umbral Lactato (Test 20m)',
        zoneColor: '#F97316',
      },
      {
        durationLabel: '60 min',
        durationSec: 3600,
        watts: p60m,
        wattsPerKg: Number((p60m / userWeightKg).toFixed(1)),
        dateAchieved: todayStr,
        sourceActivity: sourceName,
        zoneName: 'Umbral Funcional (FTP Real)',
        zoneColor: '#38BDF8',
      },
    ];
  }, [ftpResult, effectiveFtp, userWeightKg]);

  // Clasificación Coggan / Hunter Allen según W/kg
  let rankLabel = 'Amateur Activo (Cat 4)';
  if (ftpResult.ftpWkg >= 4.5) rankLabel = 'Élite Nacional (Cat 1)';
  else if (ftpResult.ftpWkg >= 3.8) rankLabel = 'Competitivo Avanzado (Cat 2)';
  else if (ftpResult.ftpWkg >= 3.2) rankLabel = 'Cicloturista Experimentado (Cat 3)';
  else if (ftpResult.ftpWkg >= 2.5) rankLabel = 'Amateur Activo (Cat 4)';
  else rankLabel = 'Iniciación / Base (Cat 5)';

  const activePoint = curvePoints[selectedPointIndex] || curvePoints[3];

  // Parámetros del gráfico SVG
  const maxW = Math.max(...curvePoints.map(p => p.watts)) * 1.08;
  const svgWidth = 500;
  const svgHeight = 160;
  const paddingX = 40;
  const paddingY = 25;
  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY * 2;

  const points = curvePoints.map((p, idx) => {
    const x = paddingX + (idx / (curvePoints.length - 1)) * chartW;
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
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Algoritmo Coggan & Monod-Scherrer (CP / W')
            </span>
            <span className="text-xs text-slate-400">
              Método: <strong className="text-slate-700 dark:text-slate-300">{ftpResult.methodLabel}</strong>
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <span>Potencia Umbral Funcional (FTP) & Curva de Potencia</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Calcula la potencia umbral exacta (W y W/kg) en la que te mueves, modelada según tus salidas en bicicleta y sensores de telemetría.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFtpModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all active:scale-[0.98] shadow-xs touch-target"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Ajustar mi FTP</span>
          </button>
        </div>
      </div>

      {/* Tarjetas KPI de FTP, Relativa, Potencia Crítica y W' */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">FTP Sostenible</span>
          <div className="flex items-baseline gap-1.5">
            <strong className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {effectiveFtp}
            </strong>
            <span className="text-xs font-bold text-amber-500">W</span>
          </div>
          <span className="text-[11px] text-slate-500 block truncate mt-0.5">
            Estado estable ~60 min
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Potencia Relativa</span>
          <div className="flex items-baseline gap-1.5">
            <strong className="text-xl sm:text-2xl font-black text-cyan-600 dark:text-cyan-400 tabular-nums">
              {ftpResult.ftpWkg}
            </strong>
            <span className="text-xs font-bold text-slate-500">W/kg</span>
          </div>
          <span className="text-[11px] text-slate-500 block truncate mt-0.5">
            {userWeightKg} kg de peso corporal
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Potencia Crítica (CP)</span>
          <div className="flex items-baseline gap-1.5">
            <strong className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              {ftpResult.criticalPowerWatts}
            </strong>
            <span className="text-xs font-bold text-slate-500">W</span>
          </div>
          <span className="text-[11px] text-slate-500 block truncate mt-0.5">
            W&apos; anaeróbico: {ftpResult.wPrimeKj} kJ
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Nivel Fisiológico</span>
          <strong className="text-xs sm:text-sm font-black text-slate-900 dark:text-white block mt-1 truncate">
            {rankLabel}
          </strong>
          <span className="text-[11px] text-slate-500 block truncate mt-0.5">
            Escala Coggan / Hunter Allen
          </span>
        </div>
      </div>

      {/* Gráfico SVG de la Curva de Duración de Potencia (Mean Maximal Power - MMP) */}
      <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-950 text-white space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              Curva de Potencia-Duración (Mean Maximal Power - MMP)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">Pulsa en cada punto para inspeccionar el intervalo</span>
        </div>

        <div className="w-full overflow-hidden">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-44 select-none">
            <defs>
              <linearGradient id="powerGradScientific" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="#334155" strokeDasharray="3 3" strokeWidth="0.75" />
            <line x1={paddingX} y1={paddingY + chartH * 0.5} x2={svgWidth - paddingX} y2={paddingY + chartH * 0.5} stroke="#334155" strokeDasharray="3 3" strokeWidth="0.75" />
            <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="#475569" strokeWidth="1" />

            <path d={areaD} fill="url(#powerGradScientific)" />
            <path d={pathD} fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

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
                  <text
                    x={p.x}
                    y={p.y - 10}
                    textAnchor="middle"
                    className={`text-[10px] font-bold ${isSelected ? 'fill-cyan-300 font-black' : 'fill-slate-400'}`}
                  >
                    {p.watts}W
                  </text>
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

        {activePoint && (
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
                  {Math.round((activePoint.watts / effectiveFtp) * 100)}%
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabla Oficial de las 7 Zonas de Potencia de Coggan + Sweet Spot */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Tus Zonas de Potencia Exactas (Protocolo Coggan)
            </h3>
          </div>
          <button
            onClick={() => setShowZonesTable(!showZonesTable)}
            className="text-xs text-cyan-600 dark:text-cyan-400 font-bold hover:underline"
          >
            {showZonesTable ? 'Ocultar Zonas' : 'Ver Todas las Zonas'}
          </button>
        </div>

        {showZonesTable && (
          <div className="overflow-x-auto rounded-xl border border-slate-200/90 dark:border-slate-800">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[10px] uppercase font-bold text-slate-400">
                  <th className="py-2.5 px-3 w-16">Zona</th>
                  <th className="py-2.5 px-3">Nombre & Objetivo Fisiológico</th>
                  <th className="py-2.5 px-3">Rango de Vatios</th>
                  <th className="py-2.5 px-3">W/kg</th>
                  <th className="py-2.5 px-3">% FTP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium tabular-nums">
                {ftpResult.zones.map(z => {
                  const pctMin = Math.round((z.minWatts / effectiveFtp) * 100);
                  const pctMax = Math.round((z.maxWatts / effectiveFtp) * 100);
                  return (
                    <tr key={z.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold">
                        <span 
                          className="px-2 py-0.5 rounded text-[10px] font-black text-slate-950 inline-block"
                          style={{ backgroundColor: z.color }}
                        >
                          {z.code}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <strong className="text-slate-900 dark:text-white block font-bold">
                          {z.name}
                        </strong>
                        <span className="text-[11px] text-slate-400 hidden sm:block">
                          {z.description}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        {z.minWatts} – {z.maxWatts} W
                      </td>
                      <td className="py-2.5 px-3 text-cyan-600 dark:text-cyan-400 font-bold">
                        {z.minWkg} – {z.maxWkg} W/kg
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {pctMin}% – {pctMax}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para ajustar FTP */}
      {isFtpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Configurar mi FTP</h3>
              <button onClick={() => setIsFtpModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFtp} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Potencia Umbral en Vatios (W)
                </label>
                <input
                  type="number"
                  required
                  min="50"
                  max="600"
                  placeholder="Ej. 240"
                  value={inputFtp}
                  onChange={e => setInputFtp(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white tabular-nums"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Introduce tu FTP obtenido de un test de 20 minutos (multiplicado por 0.95), test de rampa o potenciómetro.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFtpModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-xs"
                >
                  Guardar FTP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
