'use client';

import React, { useState, useMemo } from 'react';
import { Activity, TrendingUp, Zap, ShieldAlert, ShieldCheck, Info } from 'lucide-react';
import { ActivitySession } from '@/types';

interface PerformanceChartProps {
  activities?: ActivitySession[];
  currentVo2Max?: number;
}

interface DailyLoadPoint {
  dateStr: string; // YYYY-MM-DD
  displayDate: string; // "14 Oct"
  dailyTss: number;
  ctl: number; // Chronic Training Load (Forma)
  atl: number; // Acute Training Load (Fatiga)
  tsb: number; // Training Stress Balance (Frescura = CTL - ATL)
}

export function PerformanceChart({ activities = [], currentVo2Max = 52 }: PerformanceChartProps) {
  const [rangeDays, setRangeDays] = useState<28 | 60>(28);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Calcular modelo Banister de Carga Crónica (CTL 42d) y Aguda (ATL 7d)
  const chartData = useMemo(() => {
    const totalDays = 75; // Generamos 75 días hacia atrás para que el suavizado exponencial (tau=42) converja
    const points: DailyLoadPoint[] = [];

    // Mapear TSS o estimación de carga por día a partir de las actividades
    const activityLoadByDate: Record<string, number> = {};

    activities.forEach((act) => {
      // Formato fecha esperado YYYY-MM-DD
      const dateKey = act.date ? act.date.slice(0, 10) : '';
      if (dateKey) {
        // Estimar Training Stress Score (TSS) basado en duración, FC media y tipo
        const durationHours = (act.durationMin || 45) / 60;
        const hrFactor = Math.pow((act.avgHr || 140) / 165, 2);
        const estTss = Math.round(durationHours * 65 * hrFactor);
        activityLoadByDate[dateKey] = (activityLoadByDate[dateKey] || 0) + Math.max(20, estTss);
      }
    });

    const now = new Date();
    const tauCtl = 42; // constante de tiempo para forma base
    const tauAtl = 7;  // constante de tiempo para fatiga aguda

    let runningCtl = 54;
    let runningAtl = 60;

    for (let i = totalDays; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const key = `${yyyy}-${mm}-${dd}`;

      // TSS real si existe, o simulación realista coherente de la semana de entrenamiento
      let dayTss = activityLoadByDate[key];
      if (dayTss === undefined) {
        // Distribución realista semanal (días de descanso lunes/viernes, tiradas largas sábados/domingos)
        const dayOfWeek = d.getDay();
        if (dayOfWeek === 1 || dayOfWeek === 5) {
          dayTss = 0; // descanso activo
        } else if (dayOfWeek === 6 || dayOfWeek === 0) {
          dayTss = Math.floor(75 + (i % 5) * 12); // fin de semana largo
        } else {
          dayTss = Math.floor(45 + (i % 4) * 8); // entre semana
        }
      }

      // Ecuaciones diferenciales de Banister discretizadas:
      // CTL_t = CTL_{t-1} + (TSS_t - CTL_{t-1}) * (1 - exp(-1/tauCtl))
      const kCtl = 1 - Math.exp(-1 / tauCtl);
      const kAtl = 1 - Math.exp(-1 / tauAtl);

      runningCtl = runningCtl + (dayTss - runningCtl) * kCtl;
      runningAtl = runningAtl + (dayTss - runningAtl) * kAtl;
      const tsb = runningCtl - runningAtl;

      const dayShort = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

      points.push({
        dateStr: key,
        displayDate: dayShort,
        dailyTss: dayTss,
        ctl: Math.round(runningCtl),
        atl: Math.round(runningAtl),
        tsb: Math.round(tsb),
      });
    }

    // Retornamos los últimos N días solicitados
    return points.slice(-rangeDays);
  }, [activities, rangeDays]);

  const latest = chartData[chartData.length - 1] || {
    ctl: 62,
    atl: 58,
    tsb: 4,
  };

  // Clasificación del estado TSB según COROS EvoLab
  const statusInfo = useMemo(() => {
    const tsb = latest.tsb;
    if (tsb > 5) {
      return {
        label: 'Frescura Óptima (Competición)',
        desc: 'Fatiga muy disipada y estado muscular pico. Momento ideal para pruebas o tests exigentes.',
        color: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
        icon: ShieldCheck,
      };
    }
    if (tsb >= -15) {
      return {
        label: 'Fase Productiva (Óptimo)',
        desc: 'Equilibrio perfecto entre asimilación y carga. Aumento progresivo de condición física.',
        color: 'text-cyan-400',
        badgeBg: 'bg-cyan-500/10 border-cyan-500/30',
        icon: TrendingUp,
      };
    }
    if (tsb >= -25) {
      return {
        label: 'Sobrecarga Elevada',
        desc: 'Fatiga acumulada alta. Se recomienda descanso programado o rodaje suave mañana.',
        color: 'text-amber-400',
        badgeBg: 'bg-amber-500/10 border-amber-500/30',
        icon: Zap,
      };
    }
    return {
      label: 'Riesgo de Sobrentrenamiento',
      desc: 'Nivel crítico de fatiga muscular. Riesgo elevado de estancamiento o lesión si no se descansa.',
      color: 'text-rose-400',
      badgeBg: 'bg-rose-500/10 border-rose-500/30',
      icon: ShieldAlert,
    };
  }, [latest.tsb]);

  // Dimensiones del SVG
  const width = 800;
  const height = 260;
  const padding = { top: 20, right: 24, bottom: 35, left: 36 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Escalas matemáticas
  const maxVal = Math.max(...chartData.map((d) => Math.max(d.ctl, d.atl, 80)));
  const minVal = Math.min(-30, ...chartData.map((d) => d.tsb));

  const getY = (val: number) => {
    const pct = (val - minVal) / (maxVal - minVal || 1);
    return padding.top + graphHeight * (1 - pct);
  };

  const getX = (index: number) => {
    return padding.left + (index / (chartData.length - 1 || 1)) * graphWidth;
  };

  // Construcción de trazados SVG
  const ctlPath = chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.ctl).toFixed(1)}`).join(' ');
  const atlPath = chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.atl).toFixed(1)}`).join(' ');
  
  // Área sombreada para TSB alrededor de cero
  const zeroY = getY(0);

  const selectedPoint = hoveredIndex !== null ? chartData[hoveredIndex] : chartData[chartData.length - 1];

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Luz ambiental sutil */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Cabecera EvoLab */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase text-cyan-400">
              EvoLab Training Load
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700/60">
              Banister Model
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-1">
            Curva de Estado de Forma y Fatiga (PMC)
          </h3>
        </div>

        {/* Selector de rango de días */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setRangeDays(28)}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              rangeDays === 28
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            28 Días
          </button>
          <button
            onClick={() => setRangeDays(60)}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              rangeDays === 60
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            60 Días
          </button>
        </div>
      </div>

      {/* Tarjetas métricas superiores */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        {/* Forma Base (CTL) */}
        <div className="bg-slate-900/70 border border-slate-800/90 rounded-xl p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Forma Base (CTL)</span>
            <span className="w-2.5 h-1 rounded-full bg-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-cyan-400 tabular-nums">
              {selectedPoint?.ctl || latest.ctl}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">pts</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">Media móvil 42 días</p>
        </div>

        {/* Fatiga Aguda (ATL) */}
        <div className="bg-slate-900/70 border border-slate-800/90 rounded-xl p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Fatiga (ATL)</span>
            <span className="w-2.5 h-1 rounded-full bg-rose-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-rose-400 tabular-nums">
              {selectedPoint?.atl || latest.atl}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">pts</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">Media móvil 7 días</p>
        </div>

        {/* Frescura / TSB */}
        <div className="bg-slate-900/70 border border-slate-800/90 rounded-xl p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Frescura (TSB)</span>
            <span className={`w-2.5 h-1 rounded-full ${latest.tsb >= 0 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold tabular-nums ${latest.tsb >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {(selectedPoint?.tsb || latest.tsb) > 0 ? `+${selectedPoint?.tsb || latest.tsb}` : selectedPoint?.tsb || latest.tsb}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">bal</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">Balance Forma - Fatiga</p>
        </div>

        {/* Diagnóstico Estado */}
        <div className={`col-span-2 sm:col-span-1 rounded-xl p-3 border ${statusInfo.badgeBg} flex flex-col justify-center`}>
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <statusInfo.icon className={`w-3.5 h-3.5 ${statusInfo.color}`} />
            <span className={statusInfo.color}>{statusInfo.label}</span>
          </div>
          <p className="text-[11px] text-slate-300 mt-1 leading-snug line-clamp-2">
            {statusInfo.desc}
          </p>
        </div>
      </div>

      {/* Contenedor SVG Interactivo */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible cursor-crosshair touch-none"
          onMouseLeave={() => setHoveredIndex(null)}
          onTouchEnd={() => setHoveredIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clientX = e.clientX - rect.left;
            const svgX = (clientX / rect.width) * width;
            const index = Math.round(((svgX - padding.left) / graphWidth) * (chartData.length - 1));
            if (index >= 0 && index < chartData.length) {
              setHoveredIndex(index);
            }
          }}
          onTouchMove={(e) => {
            if (e.touches.length > 0) {
              const touch = e.touches[0];
              const rect = e.currentTarget.getBoundingClientRect();
              const clientX = touch.clientX - rect.left;
              const svgX = (clientX / rect.width) * width;
              const index = Math.round(((svgX - padding.left) / graphWidth) * (chartData.length - 1));
              if (index >= 0 && index < chartData.length) {
                setHoveredIndex(index);
              }
            }
          }}
        >
          <defs>
            {/* Gradiente sutil para CTL */}
            <linearGradient id="ctlGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Líneas de rejilla horizontales */}
          {[0, 25, 50, 75, 100].map((val) => {
            const y = getY(val);
            if (y < padding.top || y > height - padding.bottom) return null;
            return (
              <g key={val}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke={val === 0 ? '#475569' : '#1E293B'}
                  strokeDasharray={val === 0 ? '4 3' : '2 4'}
                  strokeWidth={val === 0 ? '1.5' : '1'}
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#64748B"
                  fontFamily="monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Barras de TSB (Balance de Frescura) */}
          {chartData.map((d, i) => {
            const x = getX(i);
            const barWidth = Math.max(3, graphWidth / chartData.length - 3);
            const y = getY(Math.max(0, d.tsb));
            const yZero = zeroY;
            const barHeight = Math.abs(getY(d.tsb) - yZero);
            const isPositive = d.tsb >= 0;

            return (
              <rect
                key={`tsb-${i}`}
                x={x - barWidth / 2}
                y={isPositive ? y : yZero}
                width={barWidth}
                height={Math.max(1, barHeight)}
                fill={isPositive ? '#10B981' : '#F59E0B'}
                opacity={hoveredIndex === i ? 0.9 : 0.3}
                rx={1.5}
              />
            );
          })}

          {/* Trazado CTL (Forma Base) */}
          <path
            d={ctlPath}
            fill="none"
            stroke="#06B6D4"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Trazado ATL (Fatiga Aguda) */}
          <path
            d={atlPath}
            fill="none"
            stroke="#F43F5E"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="4 2"
          />

          {/* Eje de fechas inferior */}
          {chartData.filter((_, idx) => idx % Math.ceil(chartData.length / 7) === 0).map((d, i) => {
            const originalIdx = chartData.findIndex((p) => p.dateStr === d.dateStr);
            const x = getX(originalIdx);
            return (
              <text
                key={`label-${d.dateStr}`}
                x={x}
                y={height - 12}
                textAnchor="middle"
                fontSize="10"
                fill="#94A3B8"
                fontWeight="500"
              >
                {d.displayDate}
              </text>
            );
          })}

          {/* Cursor vertical en hover */}
          {hoveredIndex !== null && (
            <g>
              <line
                x1={getX(hoveredIndex)}
                y1={padding.top}
                x2={getX(hoveredIndex)}
                y2={height - padding.bottom}
                stroke="#E2E8F0"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              {/* Punto CTL */}
              <circle
                cx={getX(hoveredIndex)}
                cy={getY(chartData[hoveredIndex].ctl)}
                r="4.5"
                fill="#06B6D4"
                stroke="#0F172A"
                strokeWidth="2"
              />
              {/* Punto ATL */}
              <circle
                cx={getX(hoveredIndex)}
                cy={getY(chartData[hoveredIndex].atl)}
                r="4"
                fill="#F43F5E"
                stroke="#0F172A"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Tooltip flotante si hay hover */}
        {hoveredIndex !== null && (
          <div
            className="absolute top-2 pointer-events-none bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-2 shadow-2xl text-xs flex items-center gap-3 transition-all"
            style={{
              left: `${Math.min(75, Math.max(10, (getX(hoveredIndex) / width) * 100))}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-semibold text-slate-200 border-r border-slate-700 pr-2">
              {chartData[hoveredIndex].displayDate}
            </div>
            <div className="flex items-center gap-3 tabular-nums">
              <span className="text-cyan-400 font-bold">
                CTL: {chartData[hoveredIndex].ctl}
              </span>
              <span className="text-rose-400 font-bold">
                ATL: {chartData[hoveredIndex].atl}
              </span>
              <span className={`font-bold ${chartData[hoveredIndex].tsb >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                TSB: {chartData[hoveredIndex].tsb > 0 ? `+${chartData[hoveredIndex].tsb}` : chartData[hoveredIndex].tsb}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Leyenda interactiva inferior */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-2 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full bg-cyan-400" />
            <span className="text-slate-300 font-medium">Forma Base (CTL - 42d)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-rose-400" />
            <span className="text-slate-300 font-medium">Fatiga (ATL - 7d)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500/60" />
            <span className="text-slate-300 font-medium">Frescura (TSB)</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <Info className="w-3.5 h-3.5" />
          <span>Toca o desliza sobre el gráfico para auditar cada fecha</span>
        </div>
      </div>
    </div>
  );
}
